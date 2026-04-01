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
        name: 'ABADI JAYA COPIER',
        address: 'Desa Kediren RT 06 RW 01, Kec. Lembeyan, Kab. Magetan, Jawa Timur',
        phone: '+62 5655620979',
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
                    api.get('/products/public').catch(() => ({ data: [] }))
                ]);

                const allSettings = Array.isArray(settingsRes.data) ? settingsRes.data : [];
                const getSetting = (key, defaultVal) => allSettings.find(s => s.key === key)?.value || defaultVal;

                setStoreInfo({
                    name: getSetting('store_name', 'ABADI JAYA COPIER'),
                    address: getSetting('store_address', 'Desa Kediren RT 06 RW 01, Kec. Lembeyan, Kab. Magetan, Jawa Timur'),
                    phone: getSetting('store_phone', '+62 812 3456 7890'),
                    mapsUrl: getSetting('store_maps_url', 'https://maps.app.goo.gl/DD3kUGfTmqaZ9iDd7')
                });

                if (fotoRes.data && fotoRes.data.length > 0) {
                    setPrices(prev => ({ ...prev, fotocopy: fotoRes.data.slice(0, 4) }));
                }

                let printP = DEFAULT_PRINT_PRICES;
                let bindP = DEFAULT_BINDING_PRICES;
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
        { title: 'ATK & Stationery', desc: 'Kebutuhan alat tulis kantor lengkap dengan kualitas terbaik.', icon: <FiFileText />, gradient: 'from-sky-500 to-blue-600' },
        { title: 'Fotocopy & Jilid', desc: 'Layanan fotocopy cepat, jilid spiral, lakban, hingga hard cover.', icon: <FiLayers />, gradient: 'from-violet-500 to-indigo-600' },
        { title: 'Digital Printing', desc: 'Cetak kartu nama, brosur, stiker, hingga banner berkualitas tinggi.', icon: <FiImage />, gradient: 'from-emerald-500 to-teal-600' },
        { title: 'Cetak Offset', desc: 'Solusi cetak dalam jumlah besar untuk majalah, undangan, dan form.', icon: <FiCpu />, gradient: 'from-amber-500 to-orange-600' },
        { title: 'Service Fotocopy', desc: 'Teknisi berpengalaman siap menangani kendala mesin fotocopy Anda.', icon: <FiSettings />, gradient: 'from-rose-500 to-pink-600' },
        { title: 'Scan Dokumen', desc: 'Scan dokumen ke berbagai format digital dengan resolusi tinggi.', icon: <FiPrinter />, gradient: 'from-cyan-500 to-sky-600' },
    ];

    const testimonials = [
        { name: 'Budi Santoso', role: 'Mahasiswa', text: 'Pelayanan sangat cepat, hasil jilid rapi banget. Harganya juga bersahabat buat kantong mahasiswa.', stars: 5 },
        { name: 'Siti Aminah', role: 'Sekretaris Desa', text: 'Langganan cetak laporan dan ATK di sini. Selalu puas dengan hasilnya, terutama cetak warna yang tajam.', stars: 5 },
        { name: 'Aris Prasetyo', role: 'Pemilik Toko', text: 'Mesin fotocopy saya sering macet, panggil teknisi Abadi Jaya Copier langsung beres di hari yang sama. Mantap!', stars: 5 }
    ];

    const handleApplyService = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());
        const message = `Halo ${storeInfo.name}, saya ingin request service mesin:%0A- Nama: ${data.name}%0A- WhatsApp: ${data.phone}%0A- Model: ${data.model}%0A- SN: ${data.sn || '-'}%0A- Alamat: ${data.address}%0A- Keluhan: ${data.issue}`;
        window.open(`https://wa.me/${storeInfo.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
        setFormSent(true);
        setTimeout(() => setFormSent(false), 5000);
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
        <div className="bg-slate-950 text-white selection:bg-sky-500 selection:text-white overflow-x-hidden" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
            <h1 className="sr-only">{storeInfo.name} - Solusi Cetak & Fotocopy Magetan</h1>

            {/* ═══════════ NAVBAR ═══════════ */}
            <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-slate-950/80 backdrop-blur-2xl py-3 border-b border-white/5' : 'bg-transparent py-5'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="size-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25 group-hover:shadow-sky-500/40 transition-shadow">
                            {storeLogo ? <img src={storeLogo} className="size-full object-contain p-1.5 rounded-xl" alt="Logo" /> : <FiPrinter className="text-lg" />}
                        </div>
                        <span className="text-base font-bold tracking-tight hidden sm:block">
                            {storeInfo.name.split(' ')[0]} <span className="text-sky-400">{storeInfo.name.split(' ').slice(1).join(' ')}</span>
                        </span>
                    </div>

                    <div className="hidden lg:flex items-center gap-8">
                        {NAV_ITEMS.map((item) => (
                            <a key={item.label} href={item.href} className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors duration-200">{item.label}</a>
                        ))}
                        <button onClick={() => onNavigate('login')} className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-6 py-2.5 rounded-xl text-[13px] font-semibold shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 active:scale-95 transition-all cursor-pointer">Portal Kasir</button>
                    </div>

                    <button className="lg:hidden size-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
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
                        className="fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center gap-6"
                    >
                        <button className="absolute top-6 right-6 size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>
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
                                className="text-2xl font-bold text-white/80 hover:text-sky-400 transition-colors"
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
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-500/8 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]" />
                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div className="space-y-8">
                        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
                            <span className="size-1.5 bg-sky-400 rounded-full animate-pulse" />
                            Printing Partner Terpercaya di Magetan
                        </motion.div>
                        <motion.h2 variants={fadeUp} initial="hidden" animate="visible" custom={1} className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.05]">
                            Solusi <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">Cetak &</span><br />
                            Fotocopy <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">Anda.</span>
                        </motion.h2>
                        <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2} className="text-lg text-slate-400 max-w-lg leading-relaxed">
                            Menyediakan layanan ATK, Fotocopy, Digital Printing hingga Service Mesin Fotocopy
                            dengan kualitas premium dan pelayanan cepat.
                        </motion.p>
                        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="flex flex-col sm:flex-row gap-4">
                            <a href="#services" className="group bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-8 py-4 rounded-2xl text-sm font-bold shadow-2xl shadow-sky-500/25 hover:shadow-sky-500/40 transition-all flex items-center justify-center gap-3 cursor-pointer">
                                Lihat Layanan <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </a>
                            <a href="#service-machine" className="bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 px-8 py-4 rounded-2xl text-sm font-bold transition-all text-center cursor-pointer">
                                Request Service
                            </a>
                        </motion.div>

                        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4} className="grid grid-cols-3 gap-8 pt-8 border-t border-white/5">
                            {[
                                { val: '10+', label: 'Tahun' },
                                { val: '5k+', label: 'Klien' },
                                { val: '24h', label: 'Maks. Waktu' },
                            ].map((s, i) => (
                                <div key={i}>
                                    <p className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">{s.val}</p>
                                    <p className="text-xs text-slate-500 font-medium mt-1">{s.label}</p>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.3 }} className="relative group hidden lg:block">
                        <div className="relative z-10 rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-sky-500/10">
                            <img src={HERO_IMAGE} alt="Abadi Jaya Printing" className="w-full aspect-[4/5] object-cover group-hover:scale-105 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                        </div>
                        <div className="absolute -bottom-6 -left-6 bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-white/10 z-20 flex items-center gap-3 shadow-xl" style={{ animation: 'subtleFloat 3s ease-in-out infinite' }}>
                            <div className="size-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400"><FiCheckCircle size={20} /></div>
                            <div>
                                <p className="text-sm font-bold">Garansi Kualitas</p>
                                <p className="text-[11px] text-slate-500">Hasil dijamin memuaskan</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ═══════════ SERVICES ═══════════ */}
            <section id="services" className="py-24 sm:py-32 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950" />
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                        <span className="text-sky-400 text-xs font-semibold tracking-widest uppercase">Layanan Kami</span>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">Layanan Unggulan</h2>
                        <p className="text-slate-400">Semua kebutuhan cetak dan alat tulis dalam satu tempat.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {services.map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08, duration: 0.5 }}
                                viewport={{ once: true, margin: "-50px" }}
                                className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-8 transition-all duration-300 cursor-pointer"
                            >
                                <div className={`size-12 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white text-xl mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                                    {s.icon}
                                </div>
                                <h4 className="text-lg font-bold mb-2">{s.title}</h4>
                                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════ PRICES ═══════════ */}
            <section id="prices" className="py-24 sm:py-32 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-sky-500/5 rounded-full blur-[150px]" />
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col lg:flex-row justify-between items-end gap-6 mb-16">
                        <div className="space-y-3 text-center lg:text-left">
                            <span className="text-sky-400 text-xs font-semibold tracking-widest uppercase">Transparan</span>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">Daftar Harga</h2>
                        </div>
                        <p className="text-slate-500 text-xs font-medium flex items-center gap-2">
                            <FiInfo className="text-sky-500" /> Harga sewaktu-waktu dapat berubah
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        {[
                            { name: 'Fotocopy', icon: <FiFileText />, data: prices.fotocopy, defaults: [{ p: 'A4 B/W', v: 300 }, { p: 'F4 B/W', v: 350 }, { p: 'Warna Standard', v: 2000 }] },
                            { name: 'Print Dokumen', icon: <FiPrinter />, data: prices.print, defaults: [{ p: 'A4 B/W', v: 500 }, { p: 'A4 Warna', v: 2000 }, { p: 'Foto Premium', v: 5000 }] },
                            { name: 'Penjilidan', icon: <FiLayers />, data: prices.binding, defaults: [{ p: 'Spiral Kawat', v: 5000 }, { p: 'Lakban Rapih', v: 3000 }, { p: 'Custom Cover', v: 25000 }] },
                        ].map((cat, i) => (
                            <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 hover:border-sky-500/20 transition-colors duration-300 group">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="size-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-lg">
                                        {cat.icon}
                                    </div>
                                    <h3 className="text-lg font-bold">{cat.name}</h3>
                                </div>

                                <div className="space-y-0">
                                    {cat.data.length > 0 ? cat.data.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center py-3.5 border-b border-white/5 last:border-0">
                                            <span className="text-sm text-slate-400">
                                                {item.paper_size || item.paper || item.name} {(item.color_type || item.color) ? `(${String(item.color_type || item.color).toUpperCase()})` : ''}
                                            </span>
                                            <span className="text-sm font-bold text-sky-400">Rp {parseInt(item.price || 0).toLocaleString()}</span>
                                        </div>
                                    )) : cat.defaults.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center py-3.5 border-b border-white/5 last:border-0">
                                            <span className="text-sm text-slate-400">{item.p}</span>
                                            <span className="text-sm font-bold text-sky-400">Rp {item.v.toLocaleString()}</span>
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
                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <div className="flex flex-col lg:flex-row justify-between items-center gap-8 mb-16 text-center lg:text-left">
                            <div className="space-y-3">
                                <span className="text-sky-400 text-xs font-semibold tracking-widest uppercase">Produk</span>
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">Hot Items & ATK</h2>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`px-5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${activeCategory === cat ? 'bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-500/25' : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20 hover:text-white'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {filteredProducts.map((p, i) => (
                                <motion.div
                                    key={p.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06, duration: 0.4 }}
                                    viewport={{ once: true }}
                                    className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-sky-500/20 transition-all duration-300 flex flex-col cursor-pointer"
                                >
                                    <div className="aspect-square bg-gradient-to-br from-slate-800/50 to-slate-900 relative overflow-hidden flex items-center justify-center">
                                        <div className="absolute top-3 left-3 bg-sky-500 px-2.5 py-1 rounded-lg text-[10px] font-bold z-10">Tersedia</div>
                                        <FiTag className="text-5xl text-slate-700 group-hover:text-sky-500/50 group-hover:scale-110 transition-all duration-500" />
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col gap-4">
                                        <h4 className="text-sm font-bold line-clamp-2 group-hover:text-sky-400 transition-colors">{p.name}</h4>
                                        <div className="flex items-center justify-between mt-auto">
                                            <p className="text-lg font-extrabold text-sky-400">Rp {parseInt(p.sellPrice || 0).toLocaleString()}</p>
                                            <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-1 rounded-md border border-white/5">Stok: {p.stock}</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const message = `Halo ${storeInfo.name}, saya ingin memesan produk:%0A- Nama: ${p.name}%0A- Harga: Rp ${parseInt(p.sellPrice || 0).toLocaleString()}%0AApakah stok masih tersedia?`;
                                                window.open(`https://wa.me/${storeInfo.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
                                            }}
                                            className="w-full py-3 bg-white/5 hover:bg-sky-500 border border-white/10 hover:border-sky-500 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
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
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/30 to-slate-950" />
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                        <span className="text-sky-400 text-xs font-semibold tracking-widest uppercase">Portfolio</span>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">Dokumentasi Kerja</h2>
                    </div>

                    <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                        {galleryImages.length > 0 ? galleryImages.map((img, i) => (
                            <div key={i} className="break-inside-avoid rounded-2xl overflow-hidden group border border-white/[0.06]">
                                <img src={img} className="w-full group-hover:scale-105 transition-transform duration-700" alt="Work Gallery" />
                            </div>
                        )) : [1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="break-inside-avoid rounded-2xl overflow-hidden bg-white/[0.02] border border-white/[0.06] flex items-center justify-center" style={{ height: `${180 + (i % 3) * 60}px` }}>
                                <FiImage size={32} className="text-slate-800" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════ SERVICE MACHINE ═══════════ */}
            <section id="service-machine" className="py-24 sm:py-32">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-3xl overflow-hidden border border-white/[0.06] relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full -mr-32 -mt-32 blur-[100px]" />

                        <div className="flex flex-col lg:flex-row">
                            <div className="lg:w-1/2 p-10 lg:p-16 space-y-8 relative z-10">
                                <span className="text-sky-400 text-xs font-semibold tracking-widest uppercase">Technical Support</span>
                                <h2 className="text-3xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                                    Butuh Service<br /><span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">Mesin Fotocopy?</span>
                                </h2>
                                <p className="text-slate-400 leading-relaxed max-w-sm">
                                    Mesin Anda bermasalah? Teknisi kami siap datang ke lokasi Anda. Isi formulir dan kami akan segera menghubungi.
                                </p>
                                <div className="space-y-3">
                                    {['Teknisi Berpengalaman & Tersertifikasi', 'Sparepart Original Quality', 'Respon Cepat Area Magetan'].map((txt, i) => (
                                        <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                                            <div className="size-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20"><FiCheck size={14} /></div>
                                            {txt}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="lg:w-1/2 p-8 lg:p-12 bg-white/[0.02] border-t lg:border-t-0 lg:border-l border-white/[0.06]">
                                {formSent ? (
                                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center space-y-5 py-16">
                                        <div className="size-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 text-3xl"><FiCheckCircle /></div>
                                        <h3 className="text-xl font-bold">Permintaan Terkirim!</h3>
                                        <p className="text-slate-400 text-sm max-w-xs">Teknisi kami akan segera menghubungi Anda melalui WhatsApp.</p>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleApplyService} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        {[
                                            { name: 'name', label: 'Nama Lengkap', type: 'text', required: true, placeholder: 'Sesuai KTP/Nama Toko', colSpan: true },
                                            { name: 'phone', label: 'WhatsApp', type: 'tel', required: true, placeholder: '0812xxxx' },
                                            { name: 'model', label: 'Model Mesin', type: 'text', required: true, placeholder: 'Canon iR 6000, dll' },
                                            { name: 'sn', label: 'Serial Number', type: 'text', placeholder: 'Opsional' },
                                        ].map(field => (
                                            <div key={field.name} className={`space-y-2 ${field.colSpan ? 'sm:col-span-2' : ''}`}>
                                                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{field.label}</label>
                                                <input name={field.name} type={field.type} required={field.required} placeholder={field.placeholder} className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-white text-sm focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/50 transition-all outline-none placeholder:text-slate-600" />
                                            </div>
                                        ))}
                                        <div className="space-y-2 sm:col-span-2">
                                            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Alamat Unit</label>
                                            <textarea name="address" required rows="2" placeholder="Detail alamat..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-white text-sm focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/50 transition-all outline-none resize-none placeholder:text-slate-600" />
                                        </div>
                                        <div className="space-y-2 sm:col-span-2">
                                            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Keluhan / Diagnosis</label>
                                            <textarea name="issue" required rows="3" placeholder="Jelaskan kerusakan..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-white text-sm focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/50 transition-all outline-none resize-none placeholder:text-slate-600" />
                                        </div>
                                        <button type="submit" className="sm:col-span-2 py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl font-bold shadow-xl shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer">
                                            <FiSend /> Kirim Permintaan
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
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/30 to-slate-950" />
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                        <span className="text-sky-400 text-xs font-semibold tracking-widest uppercase">Testimoni</span>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">Kepuasan Pelanggan</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {testimonials.map((t, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                viewport={{ once: true }}
                                className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 hover:border-white/[0.12] transition-colors duration-300"
                            >
                                <div className="flex gap-1 mb-5">
                                    {[...Array(t.stars)].map((_, idx) => <FiStar key={idx} className="text-amber-400 fill-amber-400" size={14} />)}
                                </div>
                                <p className="text-slate-300 text-sm leading-relaxed mb-6">"{t.text}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center font-bold text-sm">
                                        {t.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">{t.name}</p>
                                        <p className="text-[11px] text-slate-500">{t.role}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════ LOCATION ═══════════ */}
            <section id="location" className="py-24 sm:py-32">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-5 space-y-8">
                            <div className="space-y-3">
                                <span className="text-sky-400 text-xs font-semibold tracking-widest uppercase">Lokasi</span>
                                <h2 className="text-3xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                                    Kunjungi Toko<br /><span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">Fisik Kami.</span>
                                </h2>
                            </div>

                            <div className="space-y-6">
                                {[
                                    { icon: <FiMapPin size={20} />, label: 'Alamat', value: storeInfo.address },
                                    { icon: <FiPhone size={20} />, label: 'Telepon', value: storeInfo.phone },
                                    { icon: <FiClock size={20} />, label: 'Jam Operasi', value: 'Senin–Sabtu: 07:00–20:00', sub: 'Minggu: 08:00–16:00' },
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="size-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{item.label}</p>
                                            <p className="text-sm font-semibold">{item.value}</p>
                                            {item.sub && <p className="text-xs text-slate-500 mt-0.5">{item.sub}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div
                                onClick={() => window.open(storeInfo.mapsUrl, '_blank')}
                                className="group p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex items-center justify-between cursor-pointer hover:border-sky-500/20 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="bg-white rounded-xl p-1.5 group-hover:rotate-3 transition-transform">
                                        <img src={getQrUrl(storeInfo.mapsUrl)} className="size-14 rounded-lg" alt="Maps QR" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">Navigasi Langsung</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">Klik/Scan via Google Maps</p>
                                    </div>
                                </div>
                                <FiArrowUpRight className="text-sky-400 text-xl group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </div>
                        </div>

                        <div className="lg:col-span-7 h-[400px] lg:h-[500px] rounded-2xl overflow-hidden border border-white/[0.06] relative group">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15814.71714856037!2d111.4111306!3d-7.71752!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7960334860b73b%3A0x26550607bd9b19e9!2sKediren%2C%20Lembeyan%2C%20Magetan%20Regency%2C%20East%20Java!5e0!3m2!1sen!2sid!4v1700000000000!5m2!1sen!2sid"
                                width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════ FOOTER ═══════════ */}
            <footer className="border-t border-white/5 pt-20 pb-10">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    <div className="space-y-5 lg:col-span-1">
                        <div className="flex items-center gap-3">
                            <div className="size-9 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center text-white"><FiPrinter size={16} /></div>
                            <span className="font-bold">{storeInfo.name}</span>
                        </div>
                        <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                            Solusi cetak terpercaya di Magetan dengan teknologi terkini dan harga kompetitif.
                        </p>
                        <div className="flex gap-3">
                            {[FaInstagram, FaFacebookF, FaYoutube].map((Icon, idx) => (
                                <a key={idx} href="#" className="size-9 rounded-xl bg-white/5 border border-white/[0.06] flex items-center justify-center text-slate-400 hover:bg-sky-500/10 hover:text-sky-400 hover:border-sky-500/20 transition-all cursor-pointer">
                                    <Icon size={16} />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-5">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quick Links</h4>
                        <ul className="space-y-3">
                            {NAV_ITEMS.map(link => (
                                <li key={link.label}><a href={link.href} className="text-sm text-slate-400 hover:text-sky-400 transition-colors">{link.label}</a></li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-5">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Layanan Utama</h4>
                        <ul className="space-y-3">
                            {['Digital Printing', 'Fotocopy', 'Cetak Offset', 'Service Mesin'].map(item => (
                                <li key={item} className="text-sm text-slate-400">{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-5">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Instant Support</h4>
                        <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl space-y-4">
                            <p className="text-xs text-slate-400 leading-relaxed">Punya pertanyaan mendesak? Chat langsung via WhatsApp.</p>
                            <button onClick={() => window.open(waLink, '_blank')} className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer">
                                <FaWhatsapp /> Fast Response
                            </button>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600">
                    <p>&copy; {new Date().getFullYear()} {storeInfo.name}. All Rights Reserved.</p>
                    <p>Designed with ❤️ for Supriyanto Abadi Jaya</p>
                </div>
            </footer>
        </div>
    );
}
