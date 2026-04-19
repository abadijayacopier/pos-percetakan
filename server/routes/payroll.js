const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// --- ATTENDANCE ---

// GET attendance for a period
router.get('/attendance', verifyToken, async (req, res) => {
    try {
        const { start, end, employee_id } = req.query;
        let query = `
            SELECT a.*, e.name as employee_name 
            FROM attendance a
            JOIN employees e ON a.employee_id = e.id
            WHERE 1=1
        `;
        const params = [];

        if (start && end) {
            query += ' AND a.date BETWEEN ? AND ?';
            params.push(start, end);
        }
        if (employee_id) {
            query += ' AND a.employee_id = ?';
            params.push(employee_id);
        }

        query += ' ORDER BY a.date DESC';
        const [rows] = await req.db.query(query, params);
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal mengambil data absensi' });
    }
});

// POST attendance (Manual or Bulk)
router.post('/attendance', verifyToken, requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { records } = req.body; // Array of { employee_id, date, clock_in, clock_out, work_hours, notes }

        if (!Array.isArray(records)) return res.status(400).json({ message: 'Data absensi tidak valid' });

        for (const r of records) {
            await req.db.query(`
                INSERT INTO attendance (employee_id, date, clock_in, clock_out, work_hours, notes)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [r.employee_id, r.date, r.clock_in || null, r.clock_out || null, r.work_hours || 0, r.notes || null]);
        }

        res.json({ message: 'Data absensi berhasil disimpan' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal menyimpan data absensi' });
    }
});

// --- LOANS (KASBON) ---

// GET all loans
router.get('/loans', verifyToken, async (req, res) => {
    try {
        const { employee_id, status } = req.query;
        let query = `
            SELECT l.*, e.name as employee_name 
            FROM employee_loans l
            JOIN employees e ON l.employee_id = e.id
            WHERE 1=1
        `;
        const params = [];

        if (employee_id) {
            query += ' AND l.employee_id = ?';
            params.push(employee_id);
        }
        if (status) {
            query += ' AND l.status = ?';
            params.push(status);
        }

        query += ' ORDER BY l.date DESC';
        const [rows] = await req.db.query(query, params);
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal mengambil data pinjaman' });
    }
});

// POST new loan
router.post('/loans', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const { employee_id, amount, date, description } = req.body;
        const id = uuidv4();

        await req.db.query(`
            INSERT INTO employee_loans (id, employee_id, amount, remaining_amount, date, description, status)
            VALUES (?, ?, ?, ?, ?, ?, 'unpaid')
        `, [id, employee_id, amount, amount, date, description || null]);

        res.json({ id, message: 'Pinjaman berhasil dicatat' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal mencatat pinjaman' });
    }
});

// --- SALARIES (PAYROLL) ---

// GET salary slips
router.get('/salaries', verifyToken, async (req, res) => {
    try {
        const { month, year } = req.query;
        let query = `
            SELECT s.*, e.name as employee_name, e.position
            FROM salaries s
            JOIN employees e ON s.employee_id = e.id
            WHERE 1=1
        `;
        const params = [];

        if (month) {
            query += ' AND s.period_month = ?';
            params.push(month);
        }
        if (year) {
            query += ' AND s.period_year = ?';
            params.push(year);
        }

        query += ' ORDER BY s.period_year DESC, s.period_month DESC';
        const [rows] = await req.db.query(query, params);
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal mengambil data gaji' });
    }
});

// POST Generate Salary Slips for a Month
router.post('/salaries/generate', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const { month, year } = req.body;

        // 1. Get all active employees
        const [employees] = await req.db.query('SELECT * FROM employees WHERE is_active = 1');

        const generatedCount = 0;

        for (const emp of employees) {
            // Check if already generated
            const [existing] = await req.db.query('SELECT id FROM salaries WHERE employee_id = ? AND period_month = ? AND period_year = ?', [emp.id, month, year]);
            if (existing.length > 0) continue;

            // 2. Calculate deductions from unpaid/partial loans
            const [loans] = await req.db.query('SELECT * FROM employee_loans WHERE employee_id = ? AND status != "paid"', [emp.id]);
            let totalDeduction = 0;
            // Simplified: fully pay off loans if salary allows, or just a fixed amount? 
            // For now, let's just track that they HAVE loans.
            // Actual deduction usually decided during processing.

            const id = uuidv4();
            const base = emp.base_salary || 0;
            const net = base; // Initial net

            await req.db.query(`
                INSERT INTO salaries (id, employee_id, period_month, period_year, base_processing_salary, net_salary, status)
                VALUES (?, ?, ?, ?, ?, ?, 'draft')
            `, [id, emp.id, month, year, base, net]);

            generatedCount++;
        }

        res.json({ message: `Berhasil generate ${generatedCount} slip gaji (Draft)` });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal generate slip gaji' });
    }
});

// PUT Process Payment for a Salary Slip
router.post('/salaries/pay/:id', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { loan_deduction, attendance_bonus, overtime_pay, other_deductions } = req.body;

        // 1. Get the slip
        const [slips] = await req.db.query('SELECT * FROM salaries WHERE id = ?', [id]);
        if (slips.length === 0) return res.status(404).json({ message: 'Slip gaji tidak ditemukan' });
        const slip = slips[0];

        const net = (slip.base_processing_salary || 0) + (attendance_bonus || 0) + (overtime_pay || 0) - (loan_deduction || 0) - (other_deductions || 0);

        // 2. Update the slip
        await req.db.query(`
            UPDATE salaries 
            SET attendance_bonus=?, overtime_pay=?, loan_deduction=?, other_deductions=?, net_salary=?, status='paid', paid_at=CURRENT_TIMESTAMP
            WHERE id=?
        `, [attendance_bonus || 0, overtime_pay || 0, loan_deduction || 0, other_deductions || 0, net, id]);

        // 3. Handle Loan repayment if deduction > 0
        if (loan_deduction > 0) {
            const [loans] = await req.db.query('SELECT * FROM employee_loans WHERE employee_id = ? AND status != "paid" ORDER BY date ASC', [slip.employee_id]);
            let remainingToDeduct = loan_deduction;

            for (const loan of loans) {
                if (remainingToDeduct <= 0) break;

                const deduction = Math.min(loan.remaining_amount, remainingToDeduct);
                const newRemaining = loan.remaining_amount - deduction;
                const newStatus = newRemaining <= 0 ? 'paid' : 'partially_paid';

                await req.db.query('UPDATE employee_loans SET remaining_amount=?, status=? WHERE id=?', [newRemaining, newStatus, loan.id]);
                remainingToDeduct -= deduction;
            }
        }

        // 4. Record to Cash Flow (Expense)
        await req.db.query(`
            INSERT INTO cash_flow (id, date, type, category, amount, description, reference_id)
            VALUES (?, CURRENT_DATE, 'out', 'Gaji Karyawan', ?, ?, ?)
        `, [uuidv4(), net, `Gaji ${slip.employee_id} Periode ${slip.period_month}/${slip.period_year}`, id]);

        res.json({ message: 'Gaji berhasil dibayarkan and tercatat di kas' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal memproses pembayaran gaji' });
    }
});

module.exports = router;
