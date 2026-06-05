import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../services/api';
import { FiPrinter, FiUsers, FiCheckSquare, FiSquare, FiSearch, FiCreditCard, FiRefreshCw } from 'react-icons/fi';

const CARD_W = 86, CARD_H = 54, BLEED = 3;
const CARD_W_B = CARD_W + BLEED * 2; // 92mm
const CARD_H_B = CARD_H + BLEED * 2; // 60mm
const PAPER_W = 200, PAPER_H = 300;
const COLS = 2, ROWS = 5, PER_SHEET = 10;
const mm = (v) => `${v}mm`;

const typeLabel = (t) => ({ walkin: 'REGULER', corporate: 'KORPORAT', vip: 'VIP', service: 'SERVIS' }[t] || 'MEMBER');
const typeColor = (t) => ({ walkin: '#3b82f6', corporate: '#f59e0b', vip: '#ef4444', service: '#10b981' }[t] || '#3b82f6');

// ─── SVG Wave Background (reusable) ───
const WaveBg = ({ flip }) => (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none', transform: flip ? 'scaleX(-1)' : 'none' }} viewBox="0 0 920 600" preserveAspectRatio="none">
        {/* Wave lines */}
        {Array.from({ length: 8 }).map((_, i) => (
            <path key={i} d={`M0,${380 + i * 8} Q230,${300 + i * 12} 460,${360 + i * 10} T920,${340 + i * 14}`} fill="none" stroke="#c7d2fe" strokeWidth="1" opacity={0.5 + i * 0.05} />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
            <path key={`b-${i}`} d={`M0,${420 + i * 10} Q300,${340 + i * 8} 600,${400 + i * 12} T920,${380 + i * 10}`} fill="none" stroke="#c7d2fe" strokeWidth="0.8" opacity={0.3 + i * 0.04} />
        ))}
        {/* Gradient blue circles */}
        <defs>
            <radialGradient id={`gc${flip ? 'f' : 'b'}`} cx="50%" cy="30%" r="50%"><stop offset="0%" stopColor="#4f6df5" /><stop offset="100%" stopColor="#1e3a8a" /></radialGradient>
        </defs>
        <circle cx={flip ? 80 : 840} cy={flip ? 80 : 520} r="70" fill={`url(#gc${flip ? 'f' : 'b'})`} opacity="0.9" />
        <circle cx={flip ? 40 : 880} cy={flip ? 40 : 480} r="45" fill={`url(#gc${flip ? 'f' : 'b'})`} opacity="0.6" />
        {/* Bottom bar */}
        <rect x="0" y="560" width="920" height="40" fill="#2d3db8" />
        <rect x={flip ? 0 : 680} y="555" width="240" height="45" fill="#8b9cf7" opacity="0.3" rx="4" />
    </svg>
);

// ─── SISI DEPAN ───
function CardFront({ customer, storeInfo }) {
    const accent = typeColor(customer.type);
    return (
        <div style={{ width: mm(CARD_W_B), height: mm(CARD_H_B), position: 'relative', overflow: 'hidden', fontFamily: "'Inter','Segoe UI',sans-serif", background: '#ffffff', boxSizing: 'border-box' }}>
            {/* Blue gradient kop header */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 40%, #60a5fa 100%)', zIndex: 2 }} />

            {/* Wave background on white area (bottom half) */}
            <WaveBg flip={true} />

            {/* Decorative circles on kop */}
            <div style={{ position: 'absolute', top: mm(-3), right: mm(-3), width: mm(18), height: mm(18), borderRadius: '50%', background: 'rgba(255,255,255,0.08)', zIndex: 2 }} />
            <div style={{ position: 'absolute', top: mm(6), right: mm(5), width: mm(10), height: mm(10), borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 2 }} />

            {/* Logo + Store Name (white text on blue kop) */}
            <div style={{ position: 'absolute', top: mm(BLEED + 2), left: mm(BLEED + 3), right: mm(BLEED + 3), zIndex: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: mm(2) }}>
                    {storeInfo.logo ? (
                        <img src={storeInfo.logo} alt="" style={{ width: mm(10), height: mm(10), borderRadius: mm(2), objectFit: 'cover', border: '1.5px solid rgba(255,255,255,0.4)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} />
                    ) : (
                        <div style={{ width: mm(10), height: mm(10), borderRadius: mm(2), background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10pt', fontWeight: 900, color: '#fff' }}>AJ</div>
                    )}
                    <div>
                        <div style={{ fontSize: '10pt', fontWeight: 900, color: '#fff', letterSpacing: '0.5px', lineHeight: 1.2, textTransform: 'uppercase', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                            {storeInfo.name}
                        </div>
                        <div style={{ fontSize: '6pt', color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginTop: '2px', letterSpacing: '0.5px' }}>
                            {storeInfo.tagline}
                        </div>
                    </div>
                </div>
                {/* Badge below store name */}
                <div style={{ marginTop: mm(1), display: 'inline-flex', background: 'rgba(255,255,255,0.2)', borderRadius: mm(1), padding: `${mm(0.4)} ${mm(2)}` }}>
                    <span style={{ fontSize: '4.5pt', fontWeight: 800, color: '#fff', letterSpacing: '2px' }}>✦ MEMBER CARD</span>
                </div>
            </div>

            {/* Customer info section (white area) */}
            <div style={{ position: 'absolute', bottom: mm(BLEED + 6), left: mm(BLEED + 3), right: mm(BLEED + 22), zIndex: 4 }}>
                <div style={{ fontSize: '10pt', fontWeight: 900, color: '#0f172a', letterSpacing: '0.3px', lineHeight: 1.2, textTransform: 'uppercase' }}>
                    {customer.name}
                </div>
                <div style={{ fontSize: '6.5pt', color: '#475569', fontWeight: 700, marginTop: mm(1.2), letterSpacing: '0.5px' }}>
                    📱 {customer.phone || '-'}
                </div>
                <div style={{ display: 'inline-block', marginTop: mm(1.2), background: accent, color: '#fff', fontSize: '5pt', fontWeight: 900, padding: `${mm(0.5)} ${mm(2.5)}`, borderRadius: mm(1), letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                    {typeLabel(customer.type)}
                </div>
            </div>

            {/* QR Code */}
            <div style={{ position: 'absolute', bottom: mm(BLEED + 5), right: mm(BLEED + 3), background: '#fff', padding: mm(1.2), borderRadius: mm(1.5), border: '1.5px solid #c7d2fe', boxShadow: '0 2px 6px rgba(30,58,138,0.1)', zIndex: 4 }}>
                <QRCodeSVG value={JSON.stringify({ id: customer.id, name: customer.name, phone: customer.phone, type: customer.type })} size={52} level="M" fgColor="#1e3a8a" />
            </div>

            {/* ID at bottom bar */}
            <div style={{ position: 'absolute', bottom: mm(BLEED + 1.5), left: mm(BLEED + 3), zIndex: 4 }}>
                <span style={{ fontSize: '6.5pt', color: '#fff', fontWeight: 800, fontFamily: "'Courier New',monospace", letterSpacing: '1px' }}>
                    ID: {(customer.id || '').slice(0, 16).toUpperCase()}
                </span>
            </div>
        </div>
    );
}

// ─── SISI BELAKANG ───
function CardBack({ storeInfo }) {
    return (
        <div style={{ width: mm(CARD_W_B), height: mm(CARD_H_B), position: 'relative', overflow: 'hidden', fontFamily: "'Inter','Segoe UI',sans-serif", background: '#fff', boxSizing: 'border-box' }}>
            {/* Watermark logo */}
            {storeInfo.logo && <img src={storeInfo.logo} alt="" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: mm(26), height: mm(26), opacity: 0.05, objectFit: 'contain', pointerEvents: 'none' }} />}

            {/* Top accent bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: mm(3.5), background: 'linear-gradient(90deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)' }} />

            {/* Content */}
            <div style={{ position: 'absolute', top: mm(BLEED + 6), left: mm(BLEED + 5), right: mm(BLEED + 5), textAlign: 'center', zIndex: 2 }}>
                <div style={{ fontSize: '9pt', fontWeight: 900, color: '#1e3a8a', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{storeInfo.name}</div>
                <div style={{ fontSize: '6pt', color: '#64748b', fontWeight: 600, marginTop: mm(1.5), lineHeight: 1.5 }}>{storeInfo.address}</div>
                <div style={{ fontSize: '6.5pt', color: '#3b82f6', fontWeight: 700, marginTop: mm(1.5) }}>
                    ☎ {storeInfo.phone}{storeInfo.email ? ` • ✉ ${storeInfo.email}` : ''}
                </div>
            </div>

            {/* Terms */}
            <div style={{ position: 'absolute', bottom: mm(BLEED + 7), left: mm(BLEED + 5), right: mm(BLEED + 5), textAlign: 'center', zIndex: 2 }}>
                <div style={{ width: mm(12), height: '0.3mm', background: 'linear-gradient(90deg,transparent,#cbd5e1,transparent)', margin: `0 auto ${mm(1.5)}` }} />
                <div style={{ fontSize: '5pt', color: '#94a3b8', fontWeight: 600, lineHeight: 1.6 }}>
                    Kartu ini merupakan bukti keanggotaan sah dan tidak dapat dipindahtangankan.<br />
                    Tunjukkan kartu ini untuk mendapatkan harga khusus member.
                </div>
            </div>

            {/* Bottom decorative stripe bar */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: mm(4), background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: mm(1.5) }}>
                {['#3b82f6', '#1e3a8a', '#60a5fa', '#3b82f6', '#1e3a8a', '#60a5fa', '#3b82f6'].map((c, i) => (
                    <div key={i} style={{ width: mm(3), height: mm(2), background: c, borderRadius: mm(0.5) }} />
                ))}
            </div>
        </div>
    );
}

// ─── PRINT SHEET (200×300mm) ───
function PrintSheet({ customers, storeInfo, side }) {
    const padded = [...customers];
    while (padded.length < PER_SHEET) padded.push(null);
    const mX = (PAPER_W - COLS * CARD_W_B) / 2;
    const mY = (PAPER_H - ROWS * CARD_H_B) / 2;

    return (
        <div className="print-sheet" style={{ width: mm(PAPER_W), height: mm(PAPER_H), position: 'relative', background: '#fff', pageBreakAfter: 'always', overflow: 'hidden' }}>
            {/* Crop marks */}
            {Array.from({ length: COLS + 1 }).map((_, c) => (
                <React.Fragment key={`cv-${c}`}>
                    <div style={{ position: 'absolute', left: mm(mX + c * CARD_W_B), top: 0, width: '0.2mm', height: mm(mX - 1), background: '#000' }} />
                    <div style={{ position: 'absolute', left: mm(mX + c * CARD_W_B), bottom: 0, width: '0.2mm', height: mm(mX - 1), background: '#000' }} />
                </React.Fragment>
            ))}
            {Array.from({ length: ROWS + 1 }).map((_, r) => (
                <React.Fragment key={`ch-${r}`}>
                    <div style={{ position: 'absolute', top: mm(mY + r * CARD_H_B), left: 0, height: '0.2mm', width: mm(mX - 1), background: '#000' }} />
                    <div style={{ position: 'absolute', top: mm(mY + r * CARD_H_B), right: 0, height: '0.2mm', width: mm(mX - 1), background: '#000' }} />
                </React.Fragment>
            ))}
            <div style={{ position: 'absolute', top: mm(mY), left: mm(mX), display: 'grid', gridTemplateColumns: `repeat(${COLS}, ${mm(CARD_W_B)})`, gridTemplateRows: `repeat(${ROWS}, ${mm(CARD_H_B)})` }}>
                {padded.map((cust, idx) => (
                    <div key={idx} style={{ width: mm(CARD_W_B), height: mm(CARD_H_B) }}>
                        {cust ? (side === 'front' ? <CardFront customer={cust} storeInfo={storeInfo} /> : <CardBack storeInfo={storeInfo} />) : (
                            <div style={{ width: '100%', height: '100%', border: '0.3mm dashed #e2e8f0', boxSizing: 'border-box' }} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── MAIN COMPONENT ───
export default function MemberCardSettings({ storeName, storeAddress, storePhone, storeEmail, storeLogo }) {
    const [customers, setCustomers] = useState([]);
    const [selected, setSelected] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showPreview, setShowPreview] = useState(false);
    const [previewSide, setPreviewSide] = useState('front');
    const printRef = useRef(null);

    const storeInfo = {
        name: storeName || 'FOTOCOPY ABADI JAYA',
        address: storeAddress || '',
        phone: storePhone || '',
        email: storeEmail || '',
        tagline: 'Percetakan & Fotocopy',
        logo: storeLogo || '',
    };

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/customers');
                setCustomers(Array.isArray(res.data) ? res.data : []);
            } catch { setCustomers([]); }
            finally { setLoading(false); }
        })();
    }, []);

    const filtered = customers.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.toLowerCase().includes(search.toLowerCase())
    );
    const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const selectAll = () => setSelected(prev => prev.length === filtered.length ? [] : filtered.map(c => c.id));
    const selectedCustomers = customers.filter(c => selected.includes(c.id));
    const sheets = [];
    for (let i = 0; i < selectedCustomers.length; i += PER_SHEET) sheets.push(selectedCustomers.slice(i, i + PER_SHEET));

    const handlePreview = () => {
        if (selected.length === 0) return;
        setPreviewSide('front');
        setShowPreview(true);
    };

    const handlePrintFromPreview = () => {
        const content = printRef.current;
        if (!content) return;
        const printWindow = window.open('', '_blank', 'width=800,height=1000');
        if (!printWindow) return;
        printWindow.document.write(`<!DOCTYPE html><html><head><title>Kartu Member</title><style>
            @page { size: ${PAPER_W}mm ${PAPER_H}mm; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: #fff; }
            .print-sheet { page-break-after: always; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .print-sheet:last-child { page-break-after: auto; }
        </style></head><body>${content.innerHTML}</body></html>`);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 600);
    };

    return (
        <div className="space-y-6">
            {/* Control Panel */}
            <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] pointer-events-none" />
                <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shadow-sm"><FiCreditCard size={24} /></div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Cetak Kartu Member</h3>
                        <p className="text-sm text-slate-500">Pilih pelanggan → cetak kartu member 86×54mm (kertas ID Card 200×300mm)</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-5 relative z-10">
                    <div className="relative flex-1">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="text" placeholder="Cari nama atau nomor HP..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-11 pr-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                    </div>
                    <button onClick={selectAll} className="px-5 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2 whitespace-nowrap">
                        {selected.length === filtered.length ? <FiCheckSquare size={16} /> : <FiSquare size={16} />}
                        {selected.length === filtered.length ? 'Batal Pilih' : 'Pilih Semua'}
                    </button>
                    <button onClick={handlePreview} disabled={selected.length === 0} className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all flex items-center gap-2 whitespace-nowrap">
                        <FiPrinter size={16} /> Cetak {selected.length > 0 ? `(${selected.length})` : ''}
                    </button>
                </div>

                <div className="flex gap-4 mb-5 relative z-10">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl px-4 py-2 text-xs font-bold text-blue-600"><FiUsers className="inline mr-1" size={14} /> {customers.length} Pelanggan</div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-4 py-2 text-xs font-bold text-emerald-600"><FiCreditCard className="inline mr-1" size={14} /> {selected.length} Dipilih</div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-2 text-xs font-bold text-amber-600">📄 {Math.ceil(selected.length / PER_SHEET) || 0} Lembar</div>
                </div>

                <div className="max-h-[400px] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 relative z-10">
                    {loading ? (
                        <div className="p-8 text-center text-slate-400"><FiRefreshCw className="animate-spin inline mr-2" /> Memuat...</div>
                    ) : filtered.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">Tidak ada pelanggan ditemukan</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-left w-10"></th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Nama</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">No. HP</th>
                                    <th className="px-4 py-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipe</th>
                                    <th className="px-4 py-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Total TRX</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filtered.map(c => {
                                    const sel = selected.includes(c.id);
                                    return (
                                        <tr key={c.id} onClick={() => toggleSelect(c.id)} className={`cursor-pointer transition-all ${sel ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                                            <td className="px-4 py-3">{sel ? <FiCheckSquare className="text-blue-600" size={18} /> : <FiSquare className="text-slate-300" size={18} />}</td>
                                            <td className="px-4 py-3 font-bold text-slate-800 dark:text-white uppercase text-xs">{c.name}</td>
                                            <td className="px-4 py-3 text-slate-500 font-mono text-xs">{c.phone || '-'}</td>
                                            <td className="px-4 py-3 text-center"><span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-white" style={{ background: typeColor(c.type) }}>{typeLabel(c.type)}</span></td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-600 text-xs">{c.total_trx || 0}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Live Card Preview */}
            {selected.length > 0 && (
                <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 p-8">
                    <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-4">🔍 Preview Kartu</h4>
                    <div className="flex flex-wrap gap-6 justify-center">
                        <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center mb-2">DEPAN</p>
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                <CardFront customer={selectedCustomers[0]} storeInfo={storeInfo} />
                            </div>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center mb-2">BELAKANG</p>
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                <CardBack storeInfo={storeInfo} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════ PRINT PREVIEW MODAL ══════ */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex flex-col">
                    {/* Modal Header */}
                    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-4">
                            <FiPrinter className="text-blue-600" size={20} />
                            <div>
                                <h3 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-widest">Print Preview — Kartu Member</h3>
                                <p className="text-[10px] text-slate-400 mt-0.5">{selectedCustomers.length} kartu • {sheets.length} lembar • Kertas {PAPER_W}×{PAPER_H}mm</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Side toggle */}
                            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden">
                                <button onClick={() => setPreviewSide('front')} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${previewSide === 'front' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}>Depan</button>
                                <button onClick={() => setPreviewSide('back')} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${previewSide === 'back' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}>Belakang</button>
                            </div>
                            <button onClick={handlePrintFromPreview} className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
                                <FiPrinter size={14} /> Cetak Sekarang
                            </button>
                            <button onClick={() => setShowPreview(false)} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-all text-lg font-bold">✕</button>
                        </div>
                    </div>

                    {/* Preview Body - scrollable */}
                    <div className="flex-1 overflow-auto p-8 flex flex-col items-center gap-8" style={{ background: '#525659' }}>
                        {sheets.map((group, si) => (
                            <div key={si} style={{ transform: 'scale(0.5)', transformOrigin: 'top center', marginBottom: '-300px' }}>
                                <PrintSheet customers={group} storeInfo={storeInfo} side={previewSide} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Hidden print content (for new window print) */}
            <div ref={printRef} style={{ position: 'absolute', left: '-99999px', top: 0 }}>
                {sheets.map((g, i) => <PrintSheet key={`f-${i}`} customers={g} storeInfo={storeInfo} side="front" />)}
                {sheets.map((g, i) => <PrintSheet key={`b-${i}`} customers={g} storeInfo={storeInfo} side="back" />)}
            </div>
        </div>
    );
}
