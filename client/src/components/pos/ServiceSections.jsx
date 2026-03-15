import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTag, FiShoppingCart, FiBook, FiPrinter as FiPrinterIcon } from 'react-icons/fi';
import { formatRupiah } from '../../utils';

export default function ServiceSections({
    activeServiceTab,
    setActiveServiceTab,
    fcPaper, setFcPaper,
    fcColor, setFcColor,
    fcSide, setFcSide,
    fcQty, setFcQty,
    fcPrice, fcUnitPrice, fcTotal, fcDiscountInfo,
    bindingPrices,
    printPrices,
    handlers
}) {
    const { addFotocopyToCart, addJilidToCart, addPrintToCart } = handlers;

    const tabs = [
        { id: 'fotocopy', label: 'Fotocopy', icon: 'content_copy', kbd: 'F1' },
        { id: 'jilid', label: 'Jilid', icon: 'book', kbd: 'F2' },
        { id: 'print', label: 'PRINT', icon: 'print', kbd: 'F3' }
    ];

    return (
        <section className="bg-slate-900/30 backdrop-blur-xl rounded-3xl border border-slate-800/60 p-3 shadow-xl">
            <div className="flex p-3 gap-3 overflow-x-auto hide-scrollbar">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveServiceTab(tab.id)}
                className={`flex-1 min-w-[120px] py-3 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden group ${activeServiceTab === tab.id
                            ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20'
                            : 'bg-slate-950/30 text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
                            }`}
                    >
                        <div className="flex items-center gap-2 relative z-10">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black italic uppercase ${activeServiceTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-600'
                                }`}>{tab.kbd}</span>
                            <span className="material-symbols-outlined text-2xl">{tab.icon}</span>
                        </div>
                        <span className="text-sm font-black italic uppercase tracking-widest relative z-10">{tab.label}</span>

                        {activeServiceTab === tab.id && (
                            <motion.div
                                layoutId="activeTabGlow"
                                className="absolute inset-0 bg-gradient-to-tr from-blue-400/20 to-transparent pointer-events-none"
                            />
                        )}
                    </button>
                ))}
            </div>

            <div className="p-8">
                <AnimatePresence mode="wait">
                    {activeServiceTab === 'fotocopy' && (
                        <motion.div
                            key="fotocopy"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col gap-8 max-w-5xl mx-auto"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="space-y-8">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block ml-1 italic leading-none">Paper Selection</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['HVS A4', 'HVS F4', 'HVS A3'].map(p => (
                                                <button
                                                    key={p}
                                                    onClick={() => setFcPaper(p)}
                                                    className={`py-4 rounded-[1.5rem] font-black italic uppercase text-xs border-2 transition-all duration-300 ${fcPaper === p ? 'border-blue-500 bg-blue-500/10 text-white shadow-lg shadow-blue-500/10' : 'border-slate-800 bg-slate-950/30 text-slate-500 hover:border-slate-700'}`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block ml-1 italic leading-none">Color Mode</label>
                                            <div className="flex gap-3">
                                                {[{ v: 'bw', l: 'B/W' }, { v: 'color', l: 'COLOR' }].map(c => (
                                                    <button key={c.v} onClick={() => setFcColor(c.v)} className={`flex-1 py-4 rounded-[1.5rem] font-black italic uppercase text-xs border-2 transition-all duration-300 ${fcColor === c.v ? 'border-blue-500 bg-blue-500/10 text-white shadow-lg shadow-blue-500/10' : 'border-slate-800 bg-slate-950/30 text-slate-500 hover:border-slate-700'}`}>{c.l}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block ml-1 italic leading-none">Print Side</label>
                                            <div className="flex gap-3">
                                                {[{ v: '1', l: '1 SISI' }, { v: '2', l: 'BOLAK' }].map(s => (
                                                    <button key={s.v} onClick={() => setFcSide(s.v)} className={`flex-1 py-4 rounded-[1.5rem] font-black italic uppercase text-xs border-2 transition-all duration-300 ${fcSide === s.v ? 'border-blue-500 bg-blue-500/10 text-white shadow-lg shadow-blue-500/10' : 'border-slate-800 bg-slate-950/30 text-slate-500 hover:border-slate-700'}`}>{s.l}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block ml-1 italic leading-none">Unit Quantity</label>
                                        <div className="flex items-center gap-5">
                                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setFcQty(Math.max(0, fcQty - 1))} className="size-14 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-2xl font-black italic hover:bg-slate-700 transition-colors shadow-lg">−</motion.button>
                                            <input type="number" value={fcQty} onChange={e => setFcQty(Math.max(0, parseInt(e.target.value) || 0))} className="flex-1 h-14 bg-slate-950/50 border-2 border-slate-800 rounded-[1.5rem] text-center font-black italic text-2xl text-white focus:border-blue-500 outline-none transition-all shadow-inner" />
                                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setFcQty(fcQty + 1)} className="size-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-black italic hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20">+</motion.button>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-950/50 backdrop-blur-md rounded-[2.5rem] p-8 border border-slate-800/50 flex flex-col justify-between gap-8 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10" />

                                    <div className="text-center relative z-10">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 italic leading-none">Unit Pricing Structure</p>
                                        <div className="flex flex-col items-center gap-1">
                                            {fcDiscountInfo && (
                                                <span className="text-sm text-rose-500 line-through opacity-50 font-black italic">{formatRupiah(fcUnitPrice)}</span>
                                            )}
                                            <span className="text-4xl font-black italic tracking-tighter text-white drop-shadow-md">{formatRupiah(fcPrice)}</span>
                                        </div>
                                        {fcDiscountInfo && (
                                            <div className="mt-4 inline-flex items-center gap-2 px-6 py-2 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest italic border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                                                <FiTag size={12} className="animate-pulse" /> Efficiency Save: {formatRupiah(fcDiscountInfo.discountPerSheet)}/sheet
                                            </div>
                                        )}
                                    </div>

                                    <div className="h-px bg-slate-800 relative z-10" />

                                    <div className="text-center relative z-10">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 italic leading-none">Calculated Sub-Total</p>
                                        <p className="text-6xl font-black italic tracking-tighter text-blue-500 drop-shadow-2xl">{formatRupiah(fcTotal)}</p>
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={addFotocopyToCart}
                                        className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black italic uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-4 hover:bg-blue-500 transition-all group relative z-10"
                                    >
                                        <FiShoppingCart className="group-hover:rotate-12 transition-transform" size={20} /> Deploy to Terminal
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {activeServiceTab === 'jilid' && (
                        <motion.div
                            key="jilid"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
                        >
                            {bindingPrices.map(type => (
                                <motion.div
                                    key={type.id}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => addJilidToCart(type)}
                                    className="group cursor-pointer p-6 rounded-[2rem] border-2 border-slate-800 bg-slate-950/30 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-center flex flex-col items-center gap-4 shadow-xl"
                                >
                                    <div className="size-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-lg shadow-blue-500/5">
                                        <FiBook size={32} />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <h3 className="font-black italic uppercase text-xs tracking-widest text-slate-300 group-hover:text-white transition-colors">{type.name}</h3>
                                        <p className="text-lg font-black italic tracking-tighter text-blue-500 mt-2">{formatRupiah(type.price)}</p>
                                    </div>
                                    <div className="w-8 h-1 bg-slate-800 rounded-full group-hover:w-16 group-hover:bg-blue-600 transition-all duration-500" />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {activeServiceTab === 'print' && (
                        <motion.div
                            key="print"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
                        >
                            {printPrices.map(type => (
                                <motion.div
                                    key={type.id}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => addPrintToCart(type)}
                                    className="group cursor-pointer p-6 rounded-[2rem] border-2 border-slate-800 bg-slate-950/30 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-center flex flex-col items-center gap-4 shadow-xl"
                                >
                                    <div className="size-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-lg shadow-blue-500/5">
                                        <FiPrinterIcon size={32} />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <h3 className="font-black italic uppercase text-xs tracking-widest text-slate-300 group-hover:text-white transition-colors">{type.name}</h3>
                                        <p className="text-lg font-black italic tracking-tighter text-blue-500 mt-2">{formatRupiah(type.price)}</p>
                                    </div>
                                    <div className="w-8 h-1 bg-slate-800 rounded-full group-hover:w-16 group-hover:bg-blue-600 transition-all duration-500" />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
