import { useState, useMemo, useEffect } from 'react';
import db from '../db';
import api from '../services/api';
import { formatRupiah, formatDate } from '../utils';
import {
    FiTrendingUp, FiTrendingDown, FiDollarSign, FiPrinter
} from 'react-icons/fi';

export function ProfitLossContent({ dateFrom, dateTo }) {
    const [storeInfo, setStoreInfo] = useState({});
    const [transactions, setTransactions] = useState([]);
    const [cashFlow, setCashFlow] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch store info
    useEffect(() => {
        const settings = db.getAll('settings');
        const info = {};
        settings.forEach(s => { info[s.key] = s.value; });
        setStoreInfo({
            name: info.store_name || 'FOTOCOPY ABADI JAYA',
            address: info.store_address || '',
            phone: info.store_phone || ''
        });
    }, []);

    // Fetch data
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [trxRes, cfRes] = await Promise.all([
                api.get('/transactions'),
                api.get('/cash-flow')
            ]);
            setTransactions(trxRes.data || []);
            setCashFlow(cfRes.data || []);
        } catch (err) {
            console.error('Failed to fetch data:', err);
            setTransactions(db.getAll('transactions'));
            setCashFlow(db.getAll('cash_flow'));
        }
        setLoading(false);
    };

    // Filter data by date range
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const d = t.date ? t.date.slice(0, 10) : '';
            return d >= dateFrom && d <= dateTo;
        });
    }, [transactions, dateFrom, dateTo]);

    const filteredCashFlow = useMemo(() => {
        return cashFlow.filter(c => {
            const d = c.date ? c.date.slice(0, 10) : '';
            return d >= dateFrom && d <= dateTo;
        });
    }, [cashFlow, dateFrom, dateTo]);

    // Calculate P&L metrics
    const metrics = useMemo(() => {
        const totalRevenue = filteredTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
        
        let cogs = 0;
        filteredTransactions.forEach(t => {
            (t.items || []).forEach(item => {
                const product = db.getById('products', item.productId);
                if (product) {
                    cogs += (product.buyPrice || 0) * item.qty;
                }
            });
        });

        const operationalExpenses = filteredCashFlow
            .filter(c => c.type === 'out')
            .reduce((sum, c) => sum + (c.amount || 0), 0);

        const totalExpenses = cogs + operationalExpenses;
        const grossProfit = totalRevenue - cogs;
        const netProfit = totalRevenue - totalExpenses;
        const npm = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0;

        return { totalRevenue, cogs, grossProfit, operationalExpenses, totalExpenses, netProfit, npm };
    }, [filteredTransactions, filteredCashFlow]);

    // Revenue by category
    const revenueByCategory = useMemo(() => {
        const categories = { fotocopy: 0, print: 0, atk: 0, service: 0, binding: 0, other: 0 };
        filteredTransactions.forEach(t => {
            const type = t.type || 'other';
            if (type === 'fotocopy') categories.fotocopy += t.total || 0;
            else if (type === 'print' || type === 'digital-printing') categories.print += t.total || 0;
            else if (type === 'sale' || type === 'atk') categories.atk += t.total || 0;
            else if (type === 'service') categories.service += t.total || 0;
            else if (type === 'binding') categories.binding += t.total || 0;
            else categories.other += t.total || 0;
        });
        return categories;
    }, [filteredTransactions]);

    // Expense breakdown
    const expenseBreakdown = useMemo(() => {
        const breakdown = {};
        filteredCashFlow.filter(c => c.type === 'out').forEach(c => {
            const cat = c.category || 'Lainnya';
            breakdown[cat] = (breakdown[cat] || 0) + (c.amount || 0);
        });
        return Object.entries(breakdown).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
    }, [filteredCashFlow]);

    const formatCurrency = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
    const getPercent = (value, total) => total > 0 ? ((value / total) * 100).toFixed(1) : 0;

    if (loading) {
        return <div className="flex items-center justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
    }

    return (
        <div className="space-y-6">
            {/* Actions Bar */}
            <div className="flex items-center justify-end gap-4">
                <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                    <FiPrinter size={14} /> Cetak
                </button>
            </div>

            {/* DETAILED VIEW - Screen */}
            <div className="space-y-6">
                    {/* Summary Cards */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm group">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-3 rounded-2xl bg-green-50 dark:bg-green-900/20">
                                    <FiTrendingUp className="text-xl text-green-600" />
                                </div>
                                <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Pendapatan</span>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pendapatan</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter">{formatCurrency(metrics.totalRevenue)}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm group">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-900/20">
                                    <FiTrendingDown className="text-xl text-red-600" />
                                </div>
                                <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">Pengeluaran</span>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pengeluaran</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter">{formatCurrency(metrics.totalExpenses)}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border-2 border-l-4 border-l-blue-500 border-slate-200 dark:border-slate-800 shadow-sm group">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20">
                                    <FiDollarSign className="text-xl text-blue-600" />
                                </div>
                                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Laba</span>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Laba Bersih</p>
                            <p className={`text-2xl font-black italic tracking-tighter ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(metrics.netProfit)}
                            </p>
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">NPM: {metrics.npm.toFixed(1)}%</p>
                        </div>
                    </section>

                    {/* Revenue & Expenses Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                <FiTrendingUp className="text-green-600" /> Kategori Pendapatan
                            </h3>
                            <div className="space-y-3">
                                {Object.entries(revenueByCategory).map(([cat, amount]) => (
                                    <div key={cat} className="flex justify-between items-center">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase">{cat}</span>
                                        <span className="text-[11px] font-black text-slate-900 dark:text-white italic">{formatCurrency(amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                <FiTrendingDown className="text-red-600" /> Rincian Beban
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase">HPP (Bahan Baku)</span>
                                    <span className="text-[11px] font-black text-slate-900 dark:text-white italic">{formatCurrency(metrics.cogs)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase">Beban Operasional</span>
                                    <span className="text-[11px] font-black text-slate-900 dark:text-white italic">{formatCurrency(metrics.operationalExpenses)}</span>
                                </div>
                                {expenseBreakdown.slice(0, 3).map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{item.name}</span>
                                        <span className="text-[10px] font-black text-slate-500 italic">{formatCurrency(item.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Print Layout */}
                <div className="hidden print:block">
                <header className="text-center mb-6 border-b-2 border-black pb-3">
                    <h1 className="text-xl font-black uppercase">Laporan Laba Rugi</h1>
                    <p className="text-base font-medium">{storeInfo.name}</p>
                    <div className="mt-2 flex justify-between text-sm">
                        <div className="text-left">
                            <p><strong>Alamat:</strong> {storeInfo.address}</p>
                            {storeInfo.phone && <p><strong>Telp:</strong> {storeInfo.phone}</p>}
                        </div>
                        <div className="text-right">
                            <p><strong>Periode:</strong> {formatDate(dateFrom)} - {formatDate(dateTo)}</p>
                            <p><strong>Mata Uang:</strong> Rupiah (IDR)</p>
                        </div>
                    </div>
                </header>

                <section className="mb-4">
                    <h2 className="text-sm font-bold border-b border-black mb-2 uppercase">Pendapatan Operasional</h2>
                    <table className="w-full text-sm">
                        <tbody>
                            {revenueByCategory.fotocopy > 0 && <tr><td className="py-0.5">Pendapatan Fotocopy</td><td className="text-right">{formatCurrency(revenueByCategory.fotocopy)}</td></tr>}
                            {revenueByCategory.print > 0 && <tr><td className="py-0.5">Pendapatan Print Digital</td><td className="text-right">{formatCurrency(revenueByCategory.print)}</td></tr>}
                            {revenueByCategory.atk > 0 && <tr><td className="py-0.5">Penjualan ATK</td><td className="text-right">{formatCurrency(revenueByCategory.atk)}</td></tr>}
                            {revenueByCategory.service > 0 && <tr><td className="py-0.5">Pendapatan Service</td><td className="text-right">{formatCurrency(revenueByCategory.service)}</td></tr>}
                        </tbody>
                        <tfoot>
                            <tr className="font-bold border-t border-black"><td className="pt-1">Total Pendapatan</td><td className="text-right pt-1">{formatCurrency(metrics.totalRevenue)}</td></tr>
                        </tfoot>
                    </table>
                </section>

                <section className="mb-4">
                    <h2 className="text-sm font-bold border-b border-black mb-2 uppercase">Beban Operasional</h2>
                    <table className="w-full text-sm">
                        <tbody>
                            {metrics.cogs > 0 && <tr><td className="py-0.5">Beban Bahan Baku (HPP)</td><td className="text-right">{formatCurrency(metrics.cogs)}</td></tr>}
                            {expenseBreakdown.slice(0, 4).map((item, idx) => (
                                <tr key={idx}><td className="py-0.5">{item.name}</td><td className="text-right">{formatCurrency(item.amount)}</td></tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="font-bold border-t border-black"><td className="pt-1">Total Beban</td><td className="text-right pt-1">({formatCurrency(metrics.totalExpenses)})</td></tr>
                        </tfoot>
                    </table>
                </section>

                <section className="mt-6 p-3 border-2 border-black">
                    <div className="flex justify-between items-center">
                        <h2 className="text-base font-black uppercase">Laba Bersih</h2>
                        <span className="text-lg font-black">{formatCurrency(metrics.netProfit)}</span>
                    </div>
                    <p className="text-xs text-center mt-1">Net Profit Margin: {metrics.npm.toFixed(1)}%</p>
                </section>

                <section className="mt-10 grid grid-cols-2 gap-8 text-center text-sm">
                    <div><p className="font-bold mb-8">Dibuat oleh,</p><div className="border-t border-black w-32 mx-auto pt-1">Admin</div></div>
                    <div><p className="font-bold mb-8">Disetujui oleh,</p><div className="border-t border-black w-32 mx-auto pt-1">Pemilik</div></div>
                </section>

                {/* Print Styles */}
                <style>{`
                    @media print {
                        @page { size: A4; margin: 15mm; }
                        .no-print { display: none !important; }
                        .bg-white, .bg-green-100, .bg-red-100, .bg-blue-100 { background: white !important; }
                    }
                `}</style>
            </div>
        </div>
    );
}
