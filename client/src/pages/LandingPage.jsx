import { useState, useEffect, useRef, useMemo } from 'react';
import {
    FiPrinter, FiCpu, FiFileText, FiLayers, FiImage, FiSettings,
    FiMapPin, FiPhone, FiClock, FiArrowRight,
    FiCheckCircle, FiTag, FiMenu, FiX, FiCheck,
    FiInfo, FiSend, FiStar, FiArrowUpRight
} from 'react-icons/fi';
import { FaInstagram, FaFacebookF, FaYoutube, FaWhatsapp } from 'react-icons/fa6';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

const DEFAULT_PRINT_PRICES = [
    { paper: 'HVS A4', color: 'bw', price: 500, name: 'Print HVS A4 B/W' },
    { paper: 'HVS A4', color: 'color', price: 1000, name: 'Print HVS A4 Warna' },
    { paper: 'HVS F4', color: 'bw', price: 600, name: 'Print HVS F4 B/W' },
    { paper: 'HVS F4', color: 'color', price: 1200, name: 'Print HVS F4 Warna' }
];

const DEFAULT_BINDING_PRICES = [
    { name: 'Jilid Lakban (Biasa)', price: 3000 },
    { name: 'Jilid Mika', price: 5000 },
    { name: 'Jilid Spiral Kawat', price: 15000 },
    { name: 'Jilid Spiral Plastik', price: 10000 }
];

const HERO_IMAGE = '/hero_main.png';
const getQrUrl = (data) => `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;

const NAV_ITEMS = [
    { label: 'Layanan', href: '#services' },
    { label: 'Harga', href: '#prices' },
    { label: 'Service Mesin', href: '#service-machine' },
    { label: 'Lokasi', href: '#location' },
];

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] } })
};

export default function LandingPage({ onNavigate }) {
    const [scrolled, setScrolled] = useState(false);
    const [formSent, setFormSent] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('Semua');

    const [storeInfo, setStoreInfo] = useState({
        name: 'Our Printing Store',
        favicon: '/favicon.ico',
        logo: '/logo.png',
        address: 'Desa Kediren RT 06 RW 01, Kec. Lembeyan, Kab. Magetan, Jawa Timur',
        phone: '+62 812 3456 7890',
        mapsUrl: 'https://maps.app.goo.gl/DD3kUGfTmqaZ9iDd7'
    });

    const [prices, setPrices] = useState({ fotocopy: [], print: [], binding: [] });
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [galleryImages, setGalleryImages] = useState([]);
    const [storeLogo, setStoreLogo] = useState('');

    useEffect(() => {
        const fetchLandingData = async () => {
            try {
                const [settingsRes, fotoRes, projRes] = await Promise.all([
                    api.get('/settings/public').catch(() => ({ data: [] })),
                    api.get('/transactions/fotocopy-prices').catch(() => ({ data: [] })),
                    api.get('/products/public').catch(() => ({ data: [] })),
                    api.get('/pricing/public/all').catch(() => ({ data: { binding: [], print: [] } }))
                ]);

                const allSettings = Array.isArray(settingsRes.data) ? settingsRes.data : [];
                const getSetting = (key, defaultVal) => allSettings.find(s => s.key === key)?.value || defaultVal;

                setStoreInfo({
                    name: getSetting('store_name', 'Our Printing Store'),
                    address: getSetting('store_address', 'Desa Kediren RT 06 RW 01, Kec. Lembeyan, Kab. Magetan, Jawa Timur'),
                    phone: getSetting('store_phone', '+62 812 3456 7890'),
                    mapsUrl: getSetting('store_maps_url', 'https://maps.app.goo.gl/DD3kUGfTmqaZ9iDd7')
                });

                if (fotoRes.data && fotoRes.data.length > 0) {
                    setPrices(prev => ({ ...prev, fotocopy: fotoRes.data.slice(0, 4) }));
                }

                let printP = projRes.data && projRes.data.print && projRes.data.print.length > 0 ? projRes.data.print : DEFAULT_PRINT_PRICES;
                let bindP = projRes.data && projRes.data.binding && projRes.data.binding.length > 0 ? projRes.data.binding : DEFAULT_BINDING_PRICES;

                // Allow settings to override if present
                try { const sp = getSetting('print_prices'); if (sp) printP = JSON.parse(sp); } catch (e) { }
                try { const sb = getSetting('binding_prices'); if (sb) bindP = JSON.parse(sb); } catch (e) { }

                setPrices(prev => ({ ...prev, print: printP, binding: bindP }));

                if (projRes.data && projRes.data.length > 0) {
                    setFeaturedProducts(projRes.data.filter(p => (p.stock || 0) > 0).slice(0, 8));
                }

                try { const sg = getSetting('landing_gallery'); if (sg) setGalleryImages(JSON.parse(sg)); } catch (e) { }
                setStoreLogo(getSetting('landing_logo', ''));
            } catch (err) {
                console.error("Failed fetching landing data:", err);
            }
        };

        fetchLandingData();

        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const services = [
        { title: 'ATK & Stationery', desc: 'Kebutuhan alat tulis kantor lengkap dengan kualitas terbaik.', icon: <FiFileText />, gradient: 'from-sky-500 to-blue-600 shadow-sky-500/20' },
        { title: 'Fotocopy & Jilid', desc: 'Layanan fotocopy cepat, jilid spiral, lakban, hingga hard cover.', icon: <FiLayers />, gradient: 'from-emerald-500 to-indigo-600 shadow-emerald-500/20' },
        { title: 'Digital Printing', desc: 'Cetak kartu nama, brosur, stiker, hingga banner berkualitas tinggi.', icon: <FiImage />, gradient: 'from-emerald-500 to-teal-600 shadow-emerald-500/20' },
        { title: 'Cetak Offset', desc: 'Solusi cetak dalam jumlah besar untuk majalah, undangan, dan form.', icon: <FiCpu />, gradient: 'from-amber-500 to-orange-600 shadow-amber-500/20' },
        { title: 'Service Fotocopy', desc: 'Teknisi berpengalaman siap menangani kendala mesin fotocopy Anda.', icon: <FiSettings />, gradient: 'from-rose-500 to-pink-600 shadow-rose-500/20' },
        { title: 'Scan Dokumen', desc: 'Scan dokumen ke berbagai format digital dengan resolusi tinggi.', icon: <FiPrinter />, gradient: 'from-cyan-500 to-sky-600 shadow-cyan-500/20' },
    ];

    const testimonials = [
        { name: 'Budi Santoso', role: 'Mahasiswa', text: 'Pelayanan sangat cepat, hasil jilid rapi banget. Harganya juga bersahabat buat kantong mahasiswa.', stars: 5 },
        { name: 'Siti Aminah', role: 'Sekretaris Desa', text: 'Langganan cetak laporan dan ATK di sini. Selalu puas dengan hasilnya, terutama cetak warna yang tajam.', stars: 5 },
        { name: 'Aris Prasetyo', role: 'Pemilik Toko', text: 'Mesin fotocopy saya sering macet, panggil teknisi Abadi Jaya Copier langsung beres di hari yang sama. Mantap!', stars: 5 }
    ];

    const handleApplyService = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);

        try {
            const res = await api.post('/service/public', fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.status === 201) {
                const data = Object.fromEntries(fd.entries());
                const message = `Halo ${storeInfo.name}, saya telah mengirim tiket service via Landing Page:%0A- No Tiket: ${res.data.serviceNo}%0A- Nama: ${data.customerName}%0A- Model: ${data.model}%0A- Keluhan: ${data.complaint}`;

                // Still allow opening WhatsApp for immediate follow-up if user wants
                window.open(`https://wa.me/${storeInfo.phone.replace(/\D/g, '')}?text=${message}`, '_blank');

                setFormSent(true);
                setTimeout(() => setFormSent(false), 5000);
                e.target.reset();
            }
        } catch (err) {
            console.error("Failed to submit service ticket:", err);
            alert("Gagal mengirim tiket service. Silakan hubungi kami via WhatsApp.");
        }
    };

    const categories = useMemo(() => {
        const cats = [...new Set(featuredProducts.map(p => p.category_name).filter(Boolean))];
        return ['Semua', ...cats];
    }, [featuredProducts]);
    const filteredProducts = activeCategory === 'Semua'
        ? featuredProducts
        : featuredProducts.filter(p => p.category_name === activeCategory);

    const waLink = `https://wa.me/${storeInfo.phone.replace(/\D/g, '')}`;

    return (
        <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-500 selection:bg-sky-500 selection:text-white overflow-x-hidden" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
            <h1 className="sr-only">{storeInfo.name} - Solusi Cetak & Fotocopy Magetan</h1>

            {/* ═══════════ NAVBAR ═══════════ */}
            <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl py-3 border-b border-slate-200 dark:border-white/5' : 'bg-transparent py-5'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group shrink-0" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="size-9 sm:size-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25 group-hover:shadow-sky-500/40 transition-shadow overflow-hidden">
                            {storeLogo ? <img src={storeLogo} className="w-full h-full object-cover rounded-xl" alt="Logo" /> : <FiPrinter className="text-lg" />}
                        </div>
                        <span className="text-base sm:text-lg font-black tracking-tighter uppercase italic">
                            {storeInfo.name}
                        </span>
                    </div>

                    <div className="hidden lg:flex items-center gap-8">
                        {NAV_ITEMS.map((item) => (
                            <a key={item.label} href={item.href} className="text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-white transition-colors duration-200">{item.label}</a>
                        ))}
                        <button onClick={() => onNavigate('login')} className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-6 py-2.5 rounded-xl text-[13px] font-semibold shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 active:scale-95 transition-all cursor-pointer">Portal Kasir</button>
                    </div>

                    <button className="lg:hidden size-10 flex items-center justify-center rounded-xl bg-slate-200/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
                    </button>
                </div>
            </nav>

            {/* ═══════════ MOBILE MENU ═══════════ */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[60] bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center gap-6"
                    >
                        <button className="absolute top-6 right-6 size-12 rounded-2xl bg-slate-200/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>
                            <FiX size={22} />
                        </button>
                        {NAV_ITEMS.map((item, i) => (
                            <motion.a
                                key={item.label}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08, duration: 0.4 }}
                                className="text-2xl font-bold text-slate-900/80 dark:text-white/80 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                            >
                                {item.label}
                            </motion.a>
                        ))}
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35, duration: 0.4 }}
                            onClick={() => { setIsMobileMenuOpen(false); onNavigate('login'); }}
                            className="mt-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-10 py-4 rounded-2xl text-base font-bold shadow-xl shadow-sky-500/20 cursor-pointer"
                        >
                            Portal Kasir
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══════════ HERO ═══════════ */}
            <section id="home" className="relative min-h-screen flex items-center pt-24 pb-20 overflow-hidden">
                {/* Background effects */}
                <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950 transition-colors duration-500" />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-500/10 dark:bg-sky-500/8 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/5 dark:bg-blue-600/5 rounded-full blur-[100px]" />
                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div className="space-y-8">
                        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/10 dark:bg-sky-500/10 border border-sky-500/20 dark:border-sky-500/20 text-sky-600 dark:text-sky-400 text-[10px] sm:text-xs font-semibold whitespace-nowrap">
                            <span className="size-1.5 bg-sky-500 dark:bg-sky-400 rounded-full animate-pulse shrink-0" />
                            {storeInfo.name}
                        </motion.div>
                        <motion.h2 variants={fadeUp} initial="hidden" animate="visible" custom={1} className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.05] text-slate-900 dark:text-white">
                            Solusi <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">Cetak &</span><br />
                            Fotocopy <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">Premium.</span>
                        </motion.h2>
                        <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2} className="text-lg text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
                            Cepat, Berkualitas, dan Terpercaya. Melayani Fotocopy, Digital Printing, ATK,
                            hingga Service Mesin Fotocopy Professional.
                        </motion.p>
                        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="flex flex-col sm:flex-row gap-4">
                            <a href="#services" className="group bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-8 py-4 rounded-2xl text-sm font-bold shadow-2xl shadow-sky-500/25 hover:shadow-sky-500/40 transition-all flex items-center justify-center gap-3 cursor-pointer">
                                Lihat Layanan <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </a>
                            <a href="#service-machine" className="bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 hover:border-sky-500/50 dark:hover:border-white/20 px-8 py-4 rounded-2xl text-sm font-bold shadow-sm transition-all text-center cursor-pointer">
                                Request Service
                            </a>
                        </motion.div>

                        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4} className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-200 dark:border-white/5">
                            {[
                                { val: '10+', label: 'Tahun' },
                                { val: '5k+', label: 'Klien' },
                                { val: '24h', label: 'Max Waktu' },
                            ].map((s, i) => (
                                <div key={i}>
                                    <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{s.val}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-500 font-medium mt-1 uppercase tracking-wider">{s.label}</p>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.3 }} className="relative group hidden lg:block">
                        <div className="relative z-10 rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl shadow-slate-200 dark:shadow-sky-500/10 transition-colors duration-500">
                            <img src={HERO_IMAGE} alt="Abadi Jaya Printing" className="w-full aspect-[4/5] object-cover group-hover:scale-105 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-white/20 dark:from-slate-950/60 via-transparent to-transparent" />
                        </div>
                        <div className="absolute -bottom-6 -left-6 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 dark:border-white/10 z-20 flex items-center gap-3 shadow-xl dark:shadow-none" style={{ animation: 'subtleFloat 3s ease-in-out infinite' }}>
                            <div className="size-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400"><FiCheckCircle size={20} /></div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">Garansi Kualitas</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-500">Hasil dijamin memuaskan</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ═══════════ SERVICES ═══════════ */}
            <section id="services" className="py-24 sm:py-32 relative">
                <div className="absolute inset-0 bg-slate-100/50 dark:bg-slate-900/50 transition-colors duration-500" />
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                        <span className="text-sky-600 dark:text-sky-400 text-xs font-semibold tracking-widest uppercase">Layanan Kami</span>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">Layanan Unggulan</h2>
                        <p className="text-slate-600 dark:text-slate-400">Semua kebutuhan cetak dan alat tulis dalam satu tempat.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {services.map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08, duration: 0.5 }}
                                viewport={{ once: true, margin: "-50px" }}
                                className="group bg-white dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/[0.06] hover:border-sky-500/30 dark:hover:border-white/[0.12] rounded-3xl p-8 transition-all duration-300 shadow-sm dark:shadow-none cursor-pointer"
                            >
                                <div className={`size-14 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white text-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                                    {s.icon}
                                </div>
                                <h4 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">{s.title}</h4>
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════ PRICES ═══════════ */}
            <section id="prices" className="py-24 sm:py-32 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-sky-500/5 dark:bg-sky-500/5 rounded-full blur-[150px]" />
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col items-center text-center gap-6 mb-16">
                        <div className="space-y-3">
                            <span className="text-sky-600 dark:text-sky-400 text-xs font-semibold tracking-widest uppercase">Transparan</span>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">Daftar Harga Layanan</h2>
                        </div>
                        <p className="text-slate-500 dark:text-slate-500 text-xs font-medium flex items-center justify-center gap-2">
                            <FiInfo className="text-sky-500" /> Harga sewaktu-waktu dapat berubah tanpa pemberitahuan sebelumnya
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
                        {[
                            { name: 'Fotocopy', icon: <FiFileText />, data: prices.fotocopy, defaults: [{ p: 'A4 B/W', v: 300 }, { p: 'F4 B/W', v: 350 }, { p: 'Warna Standard', v: 2000 }] },
                            { name: 'Print Dokumen', icon: <FiPrinter />, data: prices.print, defaults: [{ p: 'A4 B/W', v: 500 }, { p: 'A4 Warna', v: 2000 }, { p: 'Foto Premium', v: 5000 }] },
                            { name: 'Penjilidan', icon: <FiLayers />, data: prices.binding, defaults: [{ p: 'Spiral Kawat', v: 5000 }, { p: 'Lakban Rapih', v: 3000 }, { p: 'Custom Cover', v: 25000 }] },
                        ].map((cat, i) => (
                            <div key={i} className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-3xl p-8 hover:border-sky-500/50 dark:hover:border-sky-500/20 transition-all duration-300 shadow-sm dark:shadow-none group">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="size-12 rounded-2xl bg-sky-500/10 dark:bg-sky-500/10 border border-sky-500/20 dark:border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 text-xl">
                                        {cat.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{cat.name}</h3>
                                </div>

                                <div className="space-y-1">
                                    {cat.data.length > 0 ? cat.data.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center py-4 border-b border-slate-100 dark:border-white/5 last:border-0">
                                            <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                                {item.paper_size || item.paper || item.name} {(item.color_type || item.color) ? `(${String(item.color_type || item.color).toUpperCase()})` : ''}
                                            </span>
                                            <span className="text-sm font-bold text-sky-600 dark:text-sky-400 underline decoration-sky-500/30">Rp {parseInt(item.price || 0).toLocaleString()}</span>
                                        </div>
                                    )) : cat.defaults.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center py-4 border-b border-slate-100 dark:border-white/5 last:border-0">
                                            <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">{item.p}</span>
                                            <span className="text-sm font-bold text-sky-600 dark:text-sky-400 underline decoration-sky-500/30">Rp {item.v.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════ PRODUCTS ═══════════ */}
            {featuredProducts.length > 0 && (
                <section className="py-24 sm:py-32 relative">
                    <div className="absolute inset-0 bg-slate-100/30 dark:bg-slate-900/10 transition-colors duration-500" />
                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <div className="flex flex-col lg:flex-row justify-between items-center gap-8 mb-16 text-center lg:text-left">
                            <div className="space-y-3">
                                <span className="text-sky-600 dark:text-sky-400 text-xs font-semibold tracking-widest uppercase">Produk</span>
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">ATK & Hot Items</h2>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${activeCategory === cat ? 'bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-500/25' : 'bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-sky-500/50 dark:hover:border-white/20 hover:text-sky-600 dark:hover:text-white shadow-sm dark:shadow-none'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {filteredProducts.map((p, i) => (
                                <motion.div
                                    key={p.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06, duration: 0.4 }}
                                    viewport={{ once: true }}
                                    className="group bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-3xl overflow-hidden hover:border-sky-500 dark:hover:border-sky-500/50 transition-all duration-300 shadow-sm dark:shadow-none flex flex-col cursor-pointer"
                                >
                                    <div className="aspect-square bg-slate-50 dark:bg-gradient-to-br dark:from-slate-800/50 dark:to-slate-900 relative overflow-hidden flex items-center justify-center">
                                        <div className="absolute top-4 left-4 bg-sky-500 text-white px-3 py-1 rounded-lg text-[10px] font-bold z-10 shadow-lg shadow-sky-500/25 italic uppercase tracking-wider">Ready Stock</div>
                                        <FiTag className="text-6xl text-slate-200 dark:text-slate-700 group-hover:text-sky-500/40 group-hover:scale-110 transition-all duration-500" />
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col gap-5">
                                        <h4 className="text-sm font-bold line-clamp-2 text-slate-800 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors uppercase tracking-tight">{p.name}</h4>
                                        <div className="flex items-center justify-between mt-auto">
                                            <p className="text-xl font-extrabold text-sky-600 dark:text-sky-400">Rp {parseInt(p.sellPrice || 0).toLocaleString()}</p>
                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/5">Stok: {p.stock}</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const message = `Halo ${storeInfo.name}, saya ingin memesan produk:%0A- Nama: ${p.name}%0A- Harga: Rp ${parseInt(p.sellPrice || 0).toLocaleString()}%0AApakah stok masih tersedia?`;
                                                window.open(`https://wa.me/${storeInfo.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
                                            }}
                                            className="w-full py-4 bg-slate-900 dark:bg-white/5 hover:bg-sky-500 dark:hover:bg-sky-500 border border-slate-800 dark:border-white/10 hover:border-sky-500 dark:hover:border-sky-500 text-white dark:text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer shadow-lg dark:shadow-none"
                                        >
                                            <FaWhatsapp className="text-sm" /> Pesan via WA
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ═══════════ GALLERY ═══════════ */}
            <section id="gallery" className="py-24 sm:py-32 relative">
                <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950 transition-colors duration-500" />
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                        <span className="text-sky-600 dark:text-sky-400 text-xs font-semibold tracking-widest uppercase">Portfolio</span>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">Dokumentasi Kerja</h2>
                    </div>

                    <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8">
                        {galleryImages.length > 0 ? galleryImages.map((img, i) => (
                            <div key={i} className="break-inside-avoid rounded-3xl overflow-hidden group border border-slate-200 dark:border-white/[0.06] shadow-sm hover:shadow-2xl transition-all duration-700">
                                <img src={img} className="w-full group-hover:scale-105 transition-transform duration-700" alt="Work Gallery" />
                            </div>
                        )) : [1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="break-inside-avoid rounded-3xl overflow-hidden bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center shadow-inner" style={{ height: `${200 + (i % 3) * 80}px` }}>
                                <FiImage size={32} className="text-slate-300 dark:text-slate-800" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════ SERVICE MACHINE ═══════════ */}
            <section id="service-machine" className="py-24 sm:py-32 relative">
                <div className="absolute inset-0 bg-slate-100/30 dark:bg-slate-900/20 transition-colors duration-500" />
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800/50 dark:to-slate-900/50 rounded-[3rem] overflow-hidden border border-slate-200 dark:border-white/[0.06] shadow-2xl dark:shadow-none relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 dark:bg-sky-500/5 rounded-full -mr-32 -mt-32 blur-[100px]" />

                        <div className="flex flex-col lg:flex-row">
                            <div className="lg:w-1/2 p-10 lg:p-20 space-y-10 relative z-10">
                                <span className="text-sky-600 dark:text-sky-400 text-xs font-bold tracking-widest uppercase italic">Professional Support</span>
                                <h2 className="text-3xl lg:text-5xl font-black tracking-tighter leading-[1.1] text-slate-900 dark:text-white uppercase italic">
                                    Butuh Service<br /><span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">Mesin Fotocopy?</span>
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm font-medium">
                                    Mesin error atau hasil cetak buruk? Teknisi kami siap memperbaiki unit Anda langsung di tempat.
                                </p>
                                <div className="space-y-4">
                                    {['Teknisi Berpengalaman & Profesional', 'Sparepart Grade A / Original', 'Support Area Karisidenan Madiun'].map((txt, i) => (
                                        <div key={i} className="flex items-center gap-4 text-sm font-bold text-slate-700 dark:text-slate-300">
                                            <div className="size-7 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20 shadow-sm"><FiCheck size={16} /></div>
                                            {txt}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="lg:w-1/2 p-10 lg:p-14 bg-slate-50/50 dark:bg-white/[0.02] border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-white/[0.06]">
                                {formSent ? (
                                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center space-y-6 py-20">
                                        <div className="size-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 text-4xl shadow-lg border border-emerald-500/20"><FiCheckCircle /></div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic">Permintaan Terkirim!</h3>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Teknisi kami akan segera memverifikasi data Anda.</p>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleApplyService} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {[
                                            { name: 'customerName', label: 'Nama / Instansi', type: 'text', required: true, placeholder: 'Nama Toko/Lembaga', colSpan: true },
                                            { name: 'phone', label: 'WhatsApp Aktif', type: 'tel', required: true, placeholder: '08xx-xxxx-xxxx' },
                                            { name: 'model', label: 'Merk & Model', type: 'text', required: true, placeholder: 'Contoh: Canon iR 3245' },
                                            { name: 'serialNo', label: 'Serial Number', type: 'text', placeholder: 'Tertera pada unit' },
                                            { name: 'photo', label: 'Upload Foto Kendala', type: 'file', placeholder: 'Pilih file...', colSpan: true },
                                        ].map(field => (
                                            <div key={field.name} className={`space-y-2.5 ${field.colSpan ? 'sm:col-span-2' : ''}`}>
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{field.label}</label>
                                                {field.type === 'file' ? (
                                                    <input name={field.name} type={field.type} accept="image/*" className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 px-5 text-slate-900 dark:text-white text-xs font-bold focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500/50 transition-all outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 shadow-sm dark:shadow-none" />
                                                ) : (
                                                    <input name={field.name} type={field.type} required={field.required} placeholder={field.placeholder} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-5 text-slate-900 dark:text-white text-sm font-bold focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500/50 transition-all outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-sm dark:shadow-none" />
                                                )}
                                            </div>
                                        ))}
                                        <div className="space-y-2.5 sm:col-span-2">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Alamat Lengkap Unit</label>
                                            <textarea name="address" required rows="2" placeholder="Wajib menyertakan RT/RW dan Kelurahan..." className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-5 text-slate-900 dark:text-white text-sm font-bold focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500/50 transition-all outline-none resize-none placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-sm dark:shadow-none" />
                                        </div>
                                        <div className="space-y-2.5 sm:col-span-2">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Deskripsi Kerusakan</label>
                                            <textarea name="complaint" required rows="3" placeholder="Jelaskan kendala mesin secara mendetail..." className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-5 text-slate-900 dark:text-white text-sm font-bold focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500/50 transition-all outline-none resize-none placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-sm dark:shadow-none" />
                                        </div>
                                        <button type="submit" className="sm:col-span-2 py-5 bg-slate-900 dark:bg-gradient-to-r dark:from-sky-500 dark:to-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 dark:shadow-sky-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer">
                                            <FiSend size={18} /> Kirim Tiket Service
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════ TESTIMONIALS ═══════════ */}
            <section className="py-24 sm:py-32 relative">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
                        <span className="text-sky-600 dark:text-sky-400 text-xs font-bold tracking-widest uppercase">Testimoni</span>
                        <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Kepuasan <span className="text-sky-500">Pelanggan</span></h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((t, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                viewport={{ once: true }}
                                className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-[2rem] p-10 hover:border-sky-500/50 dark:hover:border-white/[0.12] transition-all duration-500 shadow-sm hover:shadow-2xl dark:shadow-none group"
                            >
                                <div className="flex gap-1.5 mb-6">
                                    {[...Array(t.stars)].map((_, idx) => <FiStar key={idx} className="text-amber-400 fill-amber-400 group-hover:scale-110 transition-transform" size={16} />)}
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 text-base italic font-medium leading-relaxed mb-8">"{t.text}"</p>
                                <div className="flex items-center gap-4 border-t border-slate-100 dark:border-white/5 pt-6">
                                    <div className="size-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center font-bold text-base text-white shadow-lg">
                                        {t.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <p className="text-base font-black text-slate-900 dark:text-white uppercase italic">{t.name}</p>
                                        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.role}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════ LOCATION ═══════════ */}
            <section id="location" className="py-24 sm:py-32 bg-slate-100/30 dark:bg-transparent overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 relative">
                    <div className="grid lg:grid-cols-12 gap-16 items-center">
                        <div className="lg:col-span-5 space-y-10">
                            <div className="space-y-4">
                                <span className="text-sky-600 dark:text-sky-400 text-xs font-black tracking-widest uppercase italic">Presence</span>
                                <h2 className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-[1.1]">
                                    Kunjungi Lokasi<br /><span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent underline decoration-sky-500/20">Fisik Toko.</span>
                                </h2>
                            </div>

                            <div className="space-y-8">
                                {[
                                    { icon: <FiMapPin size={22} />, label: 'Headquarters', value: storeInfo.address },
                                    { icon: <FiPhone size={22} />, label: 'Direct Line', value: storeInfo.phone },
                                    { icon: <FiClock size={22} />, label: 'Opening Hours', value: 'Senin–Sabtu: 07:00–20:00', sub: 'Minggu: 08:00–16:00' },
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-6 group">
                                        <div className="size-14 rounded-2xl bg-white dark:bg-sky-500/10 border border-slate-200 dark:border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 shadow-sm group-hover:scale-105 transition-all">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 italic">{item.label}</p>
                                            <p className="text-base font-bold text-slate-800 dark:text-white leading-snug">{item.value}</p>
                                            {item.sub && <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1">{item.sub}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div
                                onClick={() => window.open(storeInfo.mapsUrl, '_blank')}
                                className="group p-6 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-[2rem] flex items-center justify-between cursor-pointer hover:border-sky-500/40 dark:hover:border-sky-500/20 transition-all shadow-sm hover:shadow-xl dark:shadow-none"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="bg-white rounded-2xl p-2 group-hover:rotate-3 transition-transform shadow-md">
                                        <img src={getQrUrl(storeInfo.mapsUrl)} className="size-16 rounded-xl" alt="Maps QR" />
                                    </div>
                                    <div>
                                        <p className="text-base font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Navigasi Langsung</p>
                                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-500 mt-1 uppercase">Klik atau Scan QR</p>
                                    </div>
                                </div>
                                <FiArrowUpRight className="text-sky-500 text-2xl group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </div>
                        </div>

                        <div className="lg:col-span-7 h-[450px] lg:h-[600px] rounded-[3rem] overflow-hidden border-4 border-white dark:border-white/10 shadow-2xl relative group">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15814.71714856037!2d111.4111306!3d-7.71752!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7960334860b73b%3A0x26550607bd9b19e9!2sKediren%2C%20Lembeyan%2C%20Magetan%20Regency%2C%20East%20Java!5e0!3m2!1sen!2sid!4v1700000000000!5m2!1sen!2sid"
                                width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy"
                                className="grayscale-[0.2] dark:grayscale-[0.5] dark:invert-[0.9] dark:hue-rotate-[180deg] transition-all duration-700 group-hover:grayscale-0 dark:group-hover:grayscale-[0.2]"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════ FOOTER ═══════════ */}
            <footer className="bg-slate-900 dark:bg-transparent text-white dark:text-inherit pt-24 pb-12 border-t border-white/5 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
                    <div className="space-y-8 lg:col-span-1">
                        <div className="flex items-center gap-4">
                            <div className="size-11 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg"><FiPrinter size={18} /></div>
                            <span className="text-xl font-black uppercase italic tracking-tighter">{storeInfo.name}</span>
                        </div>
                        <p className="text-slate-400 dark:text-slate-500 text-sm font-medium leading-relaxed max-w-xs">
                            Kualitas cetak tanpa kompromi. Melayani Magetan dan sekitarnya dengan teknologi mesin fotocopy terkini.
                        </p>
                        <div className="flex gap-4">
                            {[FaInstagram, FaFacebookF, FaYoutube].map((Icon, idx) => (
                                <a key={idx} href="#" className="size-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 dark:text-slate-400 hover:bg-sky-500 hover:text-white hover:border-sky-500 transition-all cursor-pointer">
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Quick Navigation</h4>
                        <ul className="space-y-4">
                            {NAV_ITEMS.map(link => (
                                <li key={link.label}><a href={link.href} className="text-sm font-bold text-slate-300 dark:text-slate-400 hover:text-sky-400 transition-colors uppercase tracking-tight">{link.label}</a></li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-8">
                        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Core Services</h4>
                        <ul className="space-y-4">
                            {['Digital Print High-Res', 'Copying & Scanning', 'Offset Bulk Printing', 'Expert Technician'].map(item => (
                                <li key={item} className="text-sm font-bold text-slate-300 dark:text-slate-400 uppercase tracking-tight">{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-8">
                        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Support Channel</h4>
                        <div className="p-8 bg-white/5 dark:bg-white/[0.03] border border-white/10 dark:border-white/[0.06] rounded-[2rem] space-y-6">
                            <p className="text-xs font-medium text-slate-400 leading-relaxed uppercase tracking-wider">Punya kendala atau butuh penawaran?</p>
                            <button onClick={() => window.open(waLink, '_blank')} className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 cursor-pointer">
                                <FaWhatsapp size={16} /> Fast Response
                            </button>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 mt-20 pt-10 border-t border-white/5 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] italic">
                    <p>&copy; {new Date().getFullYear()} {storeInfo.name}. Magetan, East Java.</p>
                    <p>Powered by AJ System</p>
                </div>
            </footer>
        </div>
    );
}
