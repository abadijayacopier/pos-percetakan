import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiUser, FiMinus, FiPlus, FiTag, FiSave, FiChevronRight } from 'react-icons/fi';
import { formatRupiah } from '../../utils';

export default function CartPanel({
    isMobile,
    isCartOpen,
    setIsCartOpen,
    cart,
    customers,
    selectedCustomerId,
    setSelectedCustomerId,
    manualCustomerName,
    setManualCustomerName,
    subtotal,
    globalDiscount,
    handlers
}) {
    const { updateQty, removeAll, toggleDiscountModal, openPayment, saveQueue } = handlers;

    return (
        <aside className={`fixed lg:relative top-0 right-0 h-full w-[85vw] max-w-[420px] lg:w-96 xl:max-w-[500px] 2xl:max-w-[28rem] bg-slate-950/60 backdrop-blur-3xl border-l border-slate-800/50 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-50 transition-transform duration-500 cubic-bezier(0.4,0,0.2,1) transform ${isMobile && !isCartOpen ? 'translate-x-full' : 'translate-x-0'}`} min-h-0>
            <div className="p-8 border-b border-slate-800/50 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />

                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Registry <span className="text-blue-500">Hub</span></h2>
                        <p className="text-[10px] font-black italic uppercase tracking-[0.3em] text-slate-500 mt-1">Terminal Batch #8821</p>
                    </div>
                    <div className="flex gap-3">
                        <motion.button
                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(244, 63, 94, 0.1)' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={removeAll}
                            className="size-11 flex items-center justify-center text-slate-500 hover:text-rose-500 border border-slate-800 rounded-2xl transition-all"
                        >
                            <FiTrash2 size={18} />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsCartOpen(false)}
                            className="lg:hidden size-11 flex items-center justify-center text-slate-500 hover:text-blue-500 bg-slate-800/50 rounded-2xl"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </motion.button>
                    </div>
                </div>

                {/* Customer Selection */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1 italic">Client Profile</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
                            <FiUser size={18} />
                        </div>
                        <select
                            value={selectedCustomerId || ''}
                            onChange={(e) => setSelectedCustomerId(e.target.value)}
                            className="w-full pl-12 pr-10 py-4 rounded-2xl border-2 border-slate-800 bg-slate-900/50 focus:border-blue-500 text-sm font-black italic uppercase tracking-widest text-slate-300 appearance-none outline-none transition-all cursor-pointer hover:bg-slate-900"
                        >
                            <option value="">General Citizen</option>
                            <option value="manual">+ Secure New Entry</option>
                            <optgroup label="VERIFIED DATABASE">
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </optgroup>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-500">
                            <span className="material-symbols-outlined text-xl">expand_more</span>
                        </div>
                    </div>

                    {selectedCustomerId === 'manual' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="overflow-hidden"
                        >
                            <input
                                type="text"
                                placeholder="Enter secure entity name..."
                                value={manualCustomerName}
                                onChange={(e) => setManualCustomerName(e.target.value)}
                                className="w-full px-5 py-4 rounded-2xl border-2 border-blue-500/50 bg-blue-500/5 focus:border-blue-500 text-sm font-black italic uppercase text-white outline-none transition-all placeholder:text-blue-500/30"
                                autoFocus
                            />
                        </motion.div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 hide-scrollbar">
                <AnimatePresence>
                    {cart.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.3 }}
                            className="h-full flex flex-col items-center justify-center text-slate-500 gap-8"
                        >
                            <div className="size-32 bg-slate-900/50 rounded-full flex items-center justify-center border-4 border-slate-800 border-dashed animate-spin-slow">
                                <span className="material-symbols-outlined text-6xl">inventory_2</span>
                            </div>
                            <p className="font-black text-[10px] uppercase tracking-[0.4em] italic text-center leading-loose">Waiting for<br />Terminal Input</p>
                        </motion.div>
                    ) : (
                        cart.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                layout
                                className="flex gap-5 group relative p-4 rounded-3xl hover:bg-slate-900/40 transition-colors border border-transparent hover:border-slate-800/50"
                            >
                                <div className="size-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 shrink-0 border border-blue-500/20 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-blue-500/5">
                                    <span className="material-symbols-outlined text-3xl">
                                        {item.type === 'fotocopy' ? 'content_copy' : item.type === 'service' ? 'book' : 'inventory_2'}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <h5 className="text-[11px] font-black italic uppercase tracking-widest truncate text-slate-100 mb-1 leading-none">{item.name}</h5>
                                        <button onClick={() => updateQty(item.id, -item.quantity)} className="opacity-0 group-hover:opacity-100 text-rose-500 hover:scale-110 transition-all">
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800 border-blue-500/30">
                                            <motion.button whileTap={{ scale: 0.8 }} onClick={() => updateQty(item.id, -1)} className="size-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
                                                <FiMinus size={14} />
                                            </motion.button>
                                            <span className="text-xs font-black italic w-8 text-center text-white">{item.quantity}</span>
                                            <motion.button whileTap={{ scale: 0.8 }} onClick={() => updateQty(item.id, 1)} className="size-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
                                                <FiPlus size={14} />
                                            </motion.button>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[9px] font-black italic uppercase text-slate-500 mb-1">Total Unit Value</span>
                                            <div className="text-sm font-black italic tracking-tighter text-blue-500">{formatRupiah(item.sellPrice * item.quantity)}</div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            <div className="p-8 bg-slate-950/80 backdrop-blur-3xl border-t border-slate-800/50 space-y-8 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black italic uppercase tracking-[0.3em] text-slate-500">Gross Terminal Value</span>
                        <span className="text-sm font-black italic text-slate-300">{formatRupiah(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center group">
                        <span className="text-[10px] font-black italic uppercase tracking-[0.3em] text-slate-500">Hub Credits / Discon</span>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={toggleDiscountModal}
                            className={`flex items-center gap-3 text-[10px] font-black uppercase tracking-widest italic border-2 px-5 py-2.5 rounded-[1.5rem] transition-all ${globalDiscount > 0 ? 'bg-emerald-500 text-white border-emerald-500 shadow-xl shadow-emerald-500/20' : 'text-blue-500 border-blue-500/20 bg-blue-500/5 hover:border-blue-500/50'}`}
                        >
                            {globalDiscount > 0 ? (
                                <><FiTag size={12} className="animate-pulse" /> -{formatRupiah(globalDiscount)}</>
                            ) : (
                                <><FiPlus size={12} /> Inject Credit</>
                            )}
                        </motion.button>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-800/50 relative z-10">
                    <div className="flex flex-col gap-2 mb-8">
                        <span className="font-black text-slate-500 uppercase text-[10px] tracking-[0.4em] italic text-center">Final Settlement Amount</span>
                        <span className="text-6xl font-black italic tracking-tighter text-blue-500 drop-shadow-[0_10px_20px_rgba(59,130,246,0.3)] text-center">{formatRupiah(subtotal - globalDiscount)}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={saveQueue}
                            className="flex items-center justify-center gap-4 py-5 rounded-[1.8rem] border-2 border-slate-800 bg-slate-900 group hover:border-slate-700 transition-all font-black text-[11px] italic uppercase tracking-[0.3em] text-slate-400"
                        >
                            <FiSave className="group-hover:-translate-y-1 transition-transform" size={18} /> Cache Transaction
                        </motion.button>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02, backgroundColor: '#2563eb' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={openPayment}
                        className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-lg italic uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/40 flex items-center justify-center gap-4 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <span className="relative z-10">Authorize Payment</span>
                        <FiChevronRight className="group-hover:translate-x-2 transition-transform relative z-10" size={24} />
                    </motion.button>
                </div>
            </div>
        </aside>
    );
}
