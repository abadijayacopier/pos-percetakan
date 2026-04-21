const { getActivePool, currentDbType } = require('../config/database');

const migrate = async () => {
    try {
        const db = await getActivePool();
        const isSqlite = currentDbType === 'sqlite';

        console.log(`--- Migrating Salary and Tax Tables (${currentDbType}) ---`);

        // 1. Employees table
        const employeesSql = isSqlite ? `
            CREATE TABLE IF NOT EXISTS employees (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                name TEXT NOT NULL,
                nik TEXT,
                phone TEXT,
                address TEXT,
                position TEXT,
                salary_type TEXT CHECK(salary_type IN ('monthly', 'hourly', 'daily')) NOT NULL DEFAULT 'monthly',
                base_salary INTEGER DEFAULT 0,
                hourly_rate INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        ` : `
            CREATE TABLE IF NOT EXISTS employees (
                id VARCHAR(50) PRIMARY KEY,
                user_id VARCHAR(50),
                name VARCHAR(255) NOT NULL,
                nik VARCHAR(50),
                phone VARCHAR(20),
                address TEXT,
                position VARCHAR(100),
                salary_type ENUM('monthly', 'hourly', 'daily') NOT NULL DEFAULT 'monthly',
                base_salary DECIMAL(15,2) DEFAULT 0,
                hourly_rate DECIMAL(15,2) DEFAULT 0,
                is_active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
        `;

        // 2. Attendance table
        const attendanceSql = isSqlite ? `
            CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id TEXT NOT NULL,
                date DATE NOT NULL,
                clock_in DATETIME,
                clock_out DATETIME,
                work_hours REAL DEFAULT 0,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
            )
        ` : `
            CREATE TABLE IF NOT EXISTS attendance (
                id INT AUTO_INCREMENT PRIMARY KEY,
                employee_id VARCHAR(50) NOT NULL,
                date DATE NOT NULL,
                clock_in DATETIME,
                clock_out DATETIME,
                work_hours DECIMAL(5,2) DEFAULT 0,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
        `;

        // 3. Employee Loans (Kasbon)
        const loansSql = isSqlite ? `
            CREATE TABLE IF NOT EXISTS employee_loans (
                id TEXT PRIMARY KEY,
                employee_id TEXT NOT NULL,
                amount INTEGER NOT NULL,
                remaining_amount INTEGER NOT NULL,
                date DATE NOT NULL,
                description TEXT,
                status TEXT CHECK(status IN ('unpaid', 'partially_paid', 'paid')) DEFAULT 'unpaid',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
            )
        ` : `
            CREATE TABLE IF NOT EXISTS employee_loans (
                id VARCHAR(50) PRIMARY KEY,
                employee_id VARCHAR(50) NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                remaining_amount DECIMAL(15,2) NOT NULL,
                date DATE NOT NULL,
                description TEXT,
                status ENUM('unpaid', 'partially_paid', 'paid') DEFAULT 'unpaid',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
        `;

        // 4. Salaries (Salary Slips)
        const salariesSql = isSqlite ? `
            CREATE TABLE IF NOT EXISTS salaries (
                id TEXT PRIMARY KEY,
                employee_id TEXT NOT NULL,
                period_month INTEGER NOT NULL,
                period_year INTEGER NOT NULL,
                base_processing_salary INTEGER DEFAULT 0,
                attendance_bonus INTEGER DEFAULT 0,
                overtime_pay INTEGER DEFAULT 0,
                loan_deduction INTEGER DEFAULT 0,
                other_deductions INTEGER DEFAULT 0,
                net_salary INTEGER NOT NULL,
                status TEXT CHECK(status IN ('draft', 'paid')) DEFAULT 'draft',
                paid_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
            )
        ` : `
            CREATE TABLE IF NOT EXISTS salaries (
                id VARCHAR(50) PRIMARY KEY,
                employee_id VARCHAR(50) NOT NULL,
                period_month TINYINT(2) NOT NULL,
                period_year SMALLINT(4) NOT NULL,
                base_processing_salary DECIMAL(15,2) DEFAULT 0,
                attendance_bonus DECIMAL(15,2) DEFAULT 0,
                overtime_pay DECIMAL(15,2) DEFAULT 0,
                loan_deduction DECIMAL(15,2) DEFAULT 0,
                other_deductions DECIMAL(15,2) DEFAULT 0,
                net_salary DECIMAL(15,2) NOT NULL,
                status ENUM('draft', 'paid') DEFAULT 'draft',
                paid_at DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
        `;

        // Execute queries
        await db.query(employeesSql);
        await db.query(attendanceSql);
        await db.query(loansSql);
        await db.query(salariesSql);

        // 5. Add tax_amount to transactions if missing
        if (isSqlite) {
            try { await db.exec('ALTER TABLE transactions ADD COLUMN tax_amount INTEGER DEFAULT 0'); } catch (e) { }
        } else {
            try {
                await db.query(`
                    ALTER TABLE transactions 
                    ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(15,2) DEFAULT 0
                `);
            } catch (e) {
                // MySQL <= 8.0.19 doesn't support ADD COLUMN IF NOT EXISTS, try direct alter
                try { await db.query('ALTER TABLE transactions ADD COLUMN tax_amount DECIMAL(15,2) DEFAULT 0'); } catch (migErr) { }
            }
        }

        // 6. Global Tax Settings
        const settings = [
            { key: 'tax_enabled', value: 'false' },
            { key: 'tax_percentage', value: '11' }
        ];

        for (const s of settings) {
            if (isSqlite) {
                await db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [s.key, s.value]);
            } else {
                await db.query('INSERT IGNORE INTO settings (\`key\`, \`value\`) VALUES (?, ?)', [s.key, s.value]);
            }
        }

        console.log('✅ Migration Salary \u0026 Tax Completed Successfully');
        // If not required by process, don't exit if it's imported. But here it's run.
        if (require.main === module) process.exit(0);
    } catch (error) {
        console.error('❌ Migration Failed:', error);
        if (require.main === module) process.exit(1);
    }
};

if (require.main === module) migrate();

module.exports = { migrate };
