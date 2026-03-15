import React from 'react';
import { FiPrinter } from 'react-icons/fi';

export default function PosFooter({ printerName, userName }) {
    return (
        <footer className="h-12 bg-slate-950 text-slate-600 flex items-center justify-between px-8 text-[9px] font-black italic uppercase tracking-[0.3em] border-t border-slate-900">
            <div className="flex gap-8">
                <span className="hover:text-slate-300 transition-colors">TERMINAL_VERSION: 4.0.ALPHA</span>
                <span className="flex items-center gap-2"><div className="size-1.5 bg-emerald-500 rounded-full" /> SYSTEM_ONLINE</span>
            </div>
            <div className="flex gap-8">
                <span className="flex items-center gap-2 hover:text-slate-300 transition-colors"><FiPrinter /> PRINTER_LINKED: {printerName || 'NULL'}</span>
                <span className="hover:text-slate-300 transition-colors">OP: {userName?.toUpperCase() || 'ROOT'}</span>
            </div>
        </footer>
    );
}
