import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiFile } from 'react-icons/fi';
import { formatRupiah } from '../../utils';

export default function ProductExplorer({
    searchQuery,
    setSearchQuery,
    filteredProducts,
    onAddToCart,
    searchInputRef
}) {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-2 bg-blue-600 rounded-full" />
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">Retail Inventory <span className="text-slate-500 opacity-50 font-normal">/ ATK</span></h2>
                    <span className="hidden md:block px-3 py-1 rounded-[1rem] bg-slate-900 border border-slate-800 text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Terminal Ready</span>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative group max-w-2xl">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
                    <FiSearch size={22} />
                </div>
                <input
                    ref={searchInputRef}
                    className="w-full pl-16 pr-8 py-6 rounded-[2.5rem] border-2 border-slate-800 bg-slate-900/40 backdrop-blur-xl focus:ring-8 focus:ring-blue-500/10 focus:border-blue-500 text-lg font-black italic uppercase transition-all outline-none shadow-2xl placeholder:text-slate-700"
                    placeholder="Scan Barcode or Manual Search..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute inset-y-0 right-6 flex items-center gap-2 pointer-events-none">
                    <span className="px-3 py-1 bg-slate-800 rounded-lg text-[10px] font-black text-slate-500 italic uppercase">F5 Focus</span>
                </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 lg:gap-6 min-h-[400px]">
                <AnimatePresence>
                    {filteredProducts.map((p, idx) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onAddToCart(p)}
                            className="bg-slate-900/40 backdrop-blur-xl p-4 lg:p-6 rounded-[2rem] border-2 border-slate-800/50 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all cursor-pointer flex flex-col gap-4 min-h-[200px] justify-between group relative overflow-hidden"
                        >
                            <div className="aspect-square bg-slate-950/50 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 overflow-hidden relative border border-slate-800/30">
                                {p.image ? (
                                    <img src={p.image} alt={p.name} className="size-full object-cover transition-transform group-hover:scale-110 duration-700" />
                                ) : (
                                    <FiFile size={32} className="text-slate-700 group-hover:text-blue-500 transition-colors" />
                                )}
                                <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors" />

                                {p.stock <= 5 && (
                                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-rose-500 text-[8px] font-black italic uppercase text-white rounded-lg shadow-lg">Low Stock</div>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <h4 className="font-black italic uppercase text-[11px] tracking-widest truncate text-slate-300 leading-tight group-hover:text-white transition-colors">{p.name}</h4>
                                <p className="text-lg font-black italic tracking-tighter text-blue-500 leading-none">{formatRupiah(p.sellPrice)}</p>
                                <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-800/50">
                                    <span className={`text-[9px] font-black italic uppercase tracking-widest ${p.stock > 10 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        UNIT: {p.stock}
                                    </span>
                                    <span className="text-[9px] text-slate-600 font-black italic uppercase tracking-widest">{p.unit}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
