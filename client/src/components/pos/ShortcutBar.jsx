import React from 'react';

export default function ShortcutBar() {
    const shortcuts = [
        { k: 'F1', l: 'PHOTOCOPY' },
        { k: 'F2', l: 'BINDING' },
        { k: 'F3', l: 'PRINT' },
        { k: 'F5', l: 'INVENTORY' },
        { k: 'F8', l: 'DRAWER' },
        { k: 'F9', l: 'CREDITS' },
        { k: 'F10', l: 'PROCESS' },
        { k: 'F11', l: 'FULLSCREEN' },
        { k: 'F12', l: 'CACHE' },
        { k: 'ESC', l: 'ABORT' }
    ];

    return (
        <div className="bg-slate-950/80 backdrop-blur-xl py-3 px-8 flex items-center gap-8 overflow-x-auto hide-scrollbar border-t border-slate-900 z-50">
            <div className="flex items-center gap-3 shrink-0">
                <div className="size-2 bg-blue-600 rounded-full animate-pulse" />
                <span className="text-[9px] font-black italic text-slate-500 uppercase tracking-[0.4em]">Protocol Shortcuts</span>
            </div>
            <div className="flex gap-4">
                {shortcuts.map(s => (
                    <div key={s.k} className="flex items-center gap-2 group">
                        <span className="text-[10px] font-black italic text-blue-500 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-all">{s.k}</span>
                        <span className="text-[9px] font-black italic text-slate-500 uppercase tracking-widest leading-none">{s.l}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
