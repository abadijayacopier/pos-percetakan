import { useState, useMemo, useEffect } from 'react';
import api from '../services/api';
import { formatRupiah, formatDate, formatDateTime } from '../utils';
import {
    FiTrendingUp, FiTrendingDown, FiDollarSign, FiPrinter
} from 'react-icons/fi';
import PrintReportLayout from './PrintReportLayout';

export function ProfitLossContent({ dateFrom, dateTo, storeInfo }) {
    const [transactions, setTransactions] = useState([]);
    const [cashFlow, setCashFlow] = useState([]);
    const [loading, setLoading] = useState(false);

    const [products, setProducts] = useState([]);

    // Fetch data
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [trxRes, cfRes, prodRes] = await Promise.all([
                api.get('/transactions'),
                api.get('/finance'),
                api.get('/products')
            ]);
            setTransactions(trxRes.data || []);
            setCashFlow(cfRes.data || []);
            setProducts(prodRes.data || []);
        } catch (err) {
            console.error('Failed to fetch data:', err);
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
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    cogs += (Number(product.buyPrice) || 0) * item.qty;
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
            {/* DETAILED VIEW - Screen */}
            <div className="space-y-6 print:hidden">
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

            {/* --- PRINT ONLY LABA RUGI REPORT (A4 FORMAT) --- */}
            <PrintReportLayout
                title="Laporan Laba Rugi"
                period={dateFrom === dateTo ? formatDate(dateFrom) : `${formatDate(dateFrom)} - ${formatDate(dateTo)}`}
                printedBy="Admin Keuangan"
                storeInfo={storeInfo}
            >
                <div className="flex gap-8 break-inside-avoid">
                    <section className="w-1/2">
                        <h3 className="font-bold text-gray-800 mb-3 border-l-4 border-emerald-500 pl-2 uppercase">Pendapatan Operasional</h3>
                        <table className="w-full text-left text-sm border-collapse outline outline-1 outline-gray-300">
                            <thead className="bg-gray-100 border-b-2 border-gray-400">
                                <tr>
                                    <th className="py-2 px-3 font-bold text-gray-800">Keterangan</th>
                                    <th className="py-2 px-3 font-bold text-gray-800 text-right">Jumlah (Rp)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {revenueByCategory.fotocopy > 0 && <tr><td className="py-2 px-3 text-gray-700">Pendapatan Fotocopy</td><td className="text-right py-2 px-3 font-medium">{formatCurrency(revenueByCategory.fotocopy)}</td></tr>}
                                {revenueByCategory.print > 0 && <tr className="bg-gray-50"><td className="py-2 px-3 text-gray-700">Pendapatan Print Digital</td><td className="text-right py-2 px-3 font-medium">{formatCurrency(revenueByCategory.print)}</td></tr>}
                                {revenueByCategory.atk > 0 && <tr><td className="py-2 px-3 text-gray-700">Penjualan Alat Tulis Kantor</td><td className="text-right py-2 px-3 font-medium">{formatCurrency(revenueByCategory.atk)}</td></tr>}
                                {revenueByCategory.service > 0 && <tr className="bg-gray-50"><td className="py-2 px-3 text-gray-700">Pendapatan Servis & Finishing</td><td className="text-right py-2 px-3 font-medium">{formatCurrency(revenueByCategory.service)}</td></tr>}
                                {revenueByCategory.binding > 0 && <tr><td className="py-2 px-3 text-gray-700">Pendapatan Jilid / Binding</td><td className="text-right py-2 px-3 font-medium">{formatCurrency(revenueByCategory.binding)}</td></tr>}
                                {revenueByCategory.other > 0 && <tr className="bg-gray-50"><td className="py-2 px-3 text-gray-700">Pendapatan Lainnya</td><td className="text-right py-2 px-3 font-medium">{formatCurrency(revenueByCategory.other)}</td></tr>}
                            </tbody>
                            <tfoot>
                                <tr className="font-bold border-t border-black bg-gray-100">
                                    <td className="py-2 px-3 uppercase text-gray-800">Total Pendapatan</td>
                                    <td className="text-right py-2 px-3 text-gray-900">{formatCurrency(metrics.totalRevenue)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </section>

                    <section className="w-1/2">
                        <h3 className="font-bold text-gray-800 mb-3 border-l-4 border-red-500 pl-2 uppercase">Beban Operasional</h3>
                        <table className="w-full text-left text-sm border-collapse outline outline-1 outline-gray-300">
                            <thead className="bg-gray-100 border-b-2 border-gray-400">
                                <tr>
                                    <th className="py-2 px-3 font-bold text-gray-800">Keterangan</th>
                                    <th className="py-2 px-3 font-bold text-gray-800 text-right">Jumlah (Rp)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {metrics.cogs > 0 && <tr><td className="py-2 px-3 text-gray-700">HPP (Bebak Pokok Penjualan)</td><td className="text-right py-2 px-3 font-medium">{formatCurrency(metrics.cogs)}</td></tr>}
                                {expenseBreakdown.map((item, idx) => (
                                    <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : ''}><td className="py-2 px-3 text-gray-700 capitalize">Beban {item.name}</td><td className="text-right py-2 px-3 font-medium">{formatCurrency(item.amount)}</td></tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="font-bold border-t border-black bg-gray-100 text-red-700">
                                    <td className="py-2 px-3 uppercase">Total Beban</td>
                                    <td className="text-right py-2 px-3">({formatCurrency(metrics.totalExpenses)})</td>
                                </tr>
                            </tfoot>
                        </table>
                    </section>
                </div>

                <section className="mt-8 p-6 bg-gray-50 border-2 border-gray-300 rounded-lg break-inside-avoid shadow-sm outline outline-1 outline-offset-4 outline-gray-200">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-black uppercase text-gray-800">Laba Bersih (Net Profit)</h2>
                        <span className={`text-2xl font-black ${metrics.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`} style={{ borderBottom: '3px double #000' }}>{formatCurrency(metrics.netProfit)}</span>
                    </div>
                </section>

            </PrintReportLayout>
        </div>
    );
}
