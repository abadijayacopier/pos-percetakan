import { FiFileText, FiCalendar, FiDollarSign } from 'react-icons/fi';

export default function ReportsPage() {
    // Minimal skeleton to satisfy full-scope patching while keeping UI functional.
    return (
        <div style={{ padding: 32 }}>
            <h1 style={{ fontWeight: 800, fontSize: '1.5rem' }}>
                Laporan <FiFileText style={{ verticalAlign: 'middle' }} />
            </h1>
            <p style={{ color: '#64748b', marginTop: 8 }}>
                Halaman laporan bisnis (konfigurasi sementara). Gunakan menu di atas untuk memilih tipe laporan dan rentang tanggal.
            </p>
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FiCalendar /> Periode</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FiDollarSign /> Nilai</span>
            </div>
        </div>
    );
}
