import React from 'react';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiPrinter, FiChevronRight } from 'react-icons/fi';
import Modal from '../Modal';
import { formatRupiah } from '../../utils';

export default function PaymentModal({
    isOpen,
    onClose,
    transactionComplete,
    subtotal,
    globalDiscount,
    paymentMethod,
    setPaymentMethod,
    amountPaid,
    setAmountPaid,
    handlers
}) {
    const { handleConfirmPayment, handleDirectPrint } = handlers;
    const totalDue = subtotal - globalDiscount;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={transactionComplete ? 'SETTLEMENT SUCCESS' : 'AUTHORIZING PAYMENT'}>
            {transactionComplete ? (
                <div className="text-center py-10 flex flex-col items-center gap-8">
                    <motion.div
                        initial={{ scale: 0.5, rotate: -45, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        className="size-32 bg-emerald-500/10 text-emerald-500 rounded-[3rem] flex items-center justify-center border-4 border-emerald-500/20 shadow-2xl shadow-emerald-500/10"
                    >
                        <FiCheckCircle size={64} className="drop-shadow-lg" />
                    </motion.div>

                    <div className="space-y-2">
                        <h3 className="text-4xl font-black italic tracking-tighter uppercase text-white">Transmission <span className="text-emerald-500">Synced</span></h3>
                        <p className="text-[10px] font-black italic uppercase tracking-[0.3em] text-slate-500">ID: {transactionComplete.invoiceNo}</p>
                    </div>

                    <div className="w-full space-y-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleDirectPrint(transactionComplete)}
                            className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black italic text-lg uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl shadow-blue-500/30 hover:bg-blue-500 transition-all"
                        >
                            <FiPrinter size={24} /> Print Transmission
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onClose}
                            className="w-full py-6 bg-slate-900 text-slate-400 border border-slate-800 rounded-[2rem] font-black italic uppercase tracking-[0.2em] hover:text-white transition-all"
                        >
                            Close Terminal
                        </motion.button>
                    </div>
                </div>
            ) : (
                <div className="space-y-10 pt-4">
                    <div className="bg-slate-950 p-10 rounded-[3rem] text-center border-2 border-slate-900 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl -mr-24 -mt-24" />
                        <p className="text-[10px] font-black italic text-slate-500 uppercase tracking-[0.4em] mb-4 leading-none">Net Transaction total</p>
                        <p className="text-6xl font-black italic tracking-tighter text-blue-500 drop-shadow-[0_10px_30px_rgba(59,130,246,0.3)]">{formatRupiah(totalDue)}</p>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black italic text-slate-500 uppercase tracking-[0.3em] pl-2">Channel Protocol</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['tunai', 'qris', 'transfer', 'piutang'].map(m => (
                                <button
                                    key={m}
                                    onClick={() => setPaymentMethod(m)}
                                    className={`py-5 rounded-[1.8rem] font-black italic uppercase text-xs tracking-[0.2em] border-2 transition-all duration-500 ${paymentMethod === m ? 'border-blue-500 bg-blue-500/10 text-white shadow-xl shadow-blue-500/5' : 'border-slate-900 bg-slate-950/50 text-slate-600 hover:border-slate-800'}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    {paymentMethod === 'tunai' && (
                        <div className="space-y-4">
                            <label className="text-[10px] font-black italic text-slate-500 uppercase tracking-[0.3em] pl-2">CASH INPUT (IDR)</label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={amountPaid ? 'Rp ' + Number(amountPaid).toLocaleString('id-ID') : ''}
                                    onChange={e => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        setAmountPaid(val);
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            if ((parseFloat(amountPaid) || 0) >= totalDue) {
                                                handleConfirmPayment();
                                            }
                                        }
                                    }}
                                    placeholder="Rp 0"
                                    className="w-full p-6 bg-slate-950 border-2 border-slate-900 rounded-[2rem] text-4xl font-black italic tracking-tighter text-center text-white focus:border-blue-500 transition-all shadow-inner outline-none"
                                    autoFocus
                                />
                                {amountPaid && (
                                    <div className="flex justify-between items-center px-6 mt-4 pt-4 border-t border-slate-900">
                                        <span className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest">Calculated Change</span>
                                        <span className={`text-2xl font-black italic tracking-tighter ${parseFloat(amountPaid) - totalDue >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {formatRupiah(parseFloat(amountPaid) - totalDue)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={paymentMethod === 'tunai' && (parseFloat(amountPaid) || 0) < totalDue}
                        onClick={handleConfirmPayment}
                        className={`w-full py-6 rounded-[2rem] font-black italic uppercase tracking-[0.2em] shadow-2xl transition-all duration-500 ${(paymentMethod !== 'tunai' || (parseFloat(amountPaid) || 0) >= totalDue)
                            ? 'bg-emerald-600 text-white shadow-emerald-500/20 hover:bg-emerald-500'
                            : 'bg-slate-900 text-slate-700 opacity-50 cursor-not-allowed border border-slate-800'
                            }`}
                    >
                        Commit Settlement
                    </motion.button>
                </div>
            )}
        </Modal>
    );
}
