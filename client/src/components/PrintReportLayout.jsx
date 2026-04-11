import React from 'react';
import { formatDateTime } from '../utils';

export default function PrintReportLayout({ id = "print-report-content", title, period, printedBy, storeInfo, children }) {
    const defaultStore = {
        name: "ABADI JAYA",
        tagline: "Percetakan & Fotocopy",
        footer: "SISTEM MONITORING & INVENTORI TERPADU | DOKUMEN DIGENERATE SECARA OTOMATIS"
    };
    const store = storeInfo || defaultStore;

    return (
        <div id={id} className="hidden print:block w-full text-black font-sans leading-relaxed bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            <style>
                {`
                @media print {
                    @page { size: A4 portrait; margin: 15mm; }
                    html, body {
                        background-color: #ffffff !important;
                        color: #000000 !important;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
                
                .print-table {
                    page-break-inside: auto;
                    border-collapse: collapse;
                    width: 100%;
                }
                .print-table tr {
                    page-break-inside: avoid;
                    page-break-after: auto;
                }
                .print-table thead {
                    display: table-header-group;
                }
                .print-table th, .print-table td {
                    padding: 12px 14px;
                    border-bottom: 1px solid #e5e7eb;
                    font-size: 12px;
                }
                
                /* Override any global section break-inside blocks */
                section {
                    page-break-inside: auto !important;
                    break-inside: auto !important;
                }
                
                .break-inside-avoid {
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                }

                .print-table th {
                    background-color: transparent !important;
                    border-top: 2px solid #000 !important;
                    border-bottom: 2px solid #000 !important;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: #000;
                    text-align: left;
                }
                .print-table tbody tr:nth-child(even) {
                    background-color: #fafafa !important;
                }
                `}
            </style>

            <header className="flex justify-between items-end border-b-4 border-black pb-5 mb-8">
                <div className="w-2/3 flex items-center gap-5">
                    <img src="/logo.png" alt="Logo" className="h-[72px] w-auto object-contain" />
                    <div>
                        <h1 className="text-[28px] font-black uppercase tracking-tight text-black mb-1 leading-none">{store.name}</h1>
                        <p className="text-gray-800 text-sm font-bold tracking-widest uppercase">{store.tagline}</p>
                    </div>
                </div>
                <div className="w-1/3 text-right">
                    <h2 className="text-xl font-bold uppercase tracking-widest text-black mb-3">{title}</h2>
                    <div className="text-[10px] text-gray-800 space-y-1.5">
                        <p><span className="font-bold text-black uppercase tracking-wider mr-2">Tanggal Cetak:</span> {formatDateTime(new Date())}</p>
                        {period && <p><span className="font-bold text-black uppercase tracking-wider mr-2">Periode:</span> {period}</p>}
                        <p><span className="font-bold text-black uppercase tracking-wider mr-2">Dicetak Oleh:</span> <span className="italic">{printedBy}</span></p>
                    </div>
                </div>
            </header>

            <main className="mb-12">
                {children}
            </main>

            <section className="mt-12 flex justify-between px-16 text-center text-sm break-inside-avoid bg-white print:bg-white">
                <div className="w-56">
                    <p className="mb-16 text-gray-500 text-xs font-bold uppercase tracking-wider">Dibuat Oleh,</p>
                    <div className="border-t border-black font-black text-gray-900 pt-2">{printedBy}</div>
                </div>
                <div className="w-56">
                    <p className="mb-16 text-gray-500 text-xs font-bold uppercase tracking-wider">Mengetahui & Menyetujui,</p>
                    <div className="border-t border-black font-black text-gray-900 pt-2">Pemilik / Manager</div>
                </div>
            </section>

            <footer className="mt-12 text-center text-[10px] text-gray-500 font-bold uppercase pt-4 pb-8 border-t border-gray-200 break-inside-avoid tracking-widest">
                {store.footer}
            </footer>
        </div>
    );
}
