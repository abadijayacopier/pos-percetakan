import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FiPrinter, FiAlertCircle, FiLoader, FiLock, FiShield, FiShoppingBag, FiTool } from 'react-icons/fi';

export default function LoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        if (!username || !password) { setError('Username dan password harus diisi!'); return; }
        setLoading(true);

        const result = await login(username, password);
        if (!result.success) setError(result.message);

        setLoading(false);
    };

    const quickLogin = (u, p) => { setUsername(u); setPassword(p); };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-brand">
                    <div className="login-icon"><FiPrinter size={40} /></div>
                    <h1>FOTOCOPY ABADI JAYA</h1>
                    <p>Sistem Point of Sale</p>
                </div>

                {error && <div className="login-error"><FiAlertCircle /> {error}</div>}

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input className="form-input" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Masukkan username" autoFocus />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Masukkan password" />
                    </div>
                    <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading} style={{ marginTop: '8px' }}>
                        {loading ? <><FiLoader className="spin" /> Memproses...</> : <><FiLock /> Masuk</>}
                    </button>
                </form>

                <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
                    <div style={{ fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>DEMO LOGIN:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        {[
                            { label: 'Admin', icon: FiShield, u: 'admin', p: 'admin123' },
                            { label: 'Kasir', icon: FiShoppingBag, u: 'kasir', p: 'kasir123' },
                            { label: 'Operator', icon: FiPrinter, u: 'operator', p: 'operator123' },
                            { label: 'Teknisi', icon: FiTool, u: 'teknisi', p: 'teknisi123' },
                        ].map(d => (
                            <button key={d.u} className="btn btn-secondary btn-sm" onClick={() => quickLogin(d.u, d.p)} style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <d.icon size={12} /> {d.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
