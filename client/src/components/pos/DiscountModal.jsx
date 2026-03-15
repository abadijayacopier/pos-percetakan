import React from 'react';
import { motion } from 'framer-motion';
import Modal from '../Modal';
import { formatRupiah } from '../../utils';

export default function DiscountModal({
    isOpen,
    onClose,
    globalDiscount,
    setGlobalDiscount
}) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registry Credit Injection">
            <div className="space-y-6 pt-4">
                <div className="bg-slate-900/50 p-6 rounded-[2rem] border-2 border-slate-800 text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full blur-2xl -mr-10 -mt-10" />
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 block italic leading-none">Credit Amount (IDR)</label>
                    <input
                        type="number"
                        value={globalDiscount}
                        onChange={e => setGlobalDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-transparent border-none text-4xl font-black italic tracking-tighter text-center text-blue-500 outline-none focus:ring-0 placeholder:text-slate-800"
                        placeholder="0"
                        autoFocus
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {[500, 1000, 2000, 5000].map(v => (
                        <motion.button
                            key={v}
                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(30, 41, 59, 1)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setGlobalDiscount(v)}
                            className="py-5 rounded-[1.5rem] bg-slate-900 border border-slate-800 text-sm font-black italic uppercase tracking-widest text-slate-400 hover:text-white transition-all shadow-lg"
                        >
                            +{formatRupiah(v)}
                        </motion.button>
                    ))}
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black italic uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 mt-4"
                >
                    Apply Settlement Credit
                </motion.button>
            </div>
        </Modal>
    );
}
