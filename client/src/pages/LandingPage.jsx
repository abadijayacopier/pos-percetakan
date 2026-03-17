import { useState, useEffect, useRef, useMemo } from 'react';
import {
    FiPrinter, FiCpu, FiFileText, FiLayers, FiImage, FiSettings,
    FiMapPin, FiPhone, FiMail, FiClock, FiUser, FiArrowRight,
    FiCheckCircle, FiTag, FiDollarSign, FiMenu, FiX, FiCheck,
    FiChevronRight, FiChevronLeft, FiInfo, FiGithub, FiMessageSquare, FiSend,
    FiGlobe
} from 'react-icons/fi';

// Fallbacks for missing social icons in Fi
const SocialInstagram = FiImage;
const SocialTwitter = FiSend;
const SocialFacebook = FiGlobe;
const SocialYoutube = FiPrinter;

// Re-assign to the names used in the component
const FiInstagram = SocialInstagram;
const FiTwitter = SocialTwitter;
const FiFacebook = SocialFacebook;
const FiYoutube = SocialYoutube;

import { motion, AnimatePresence } from 'framer-motion';
import db from '../db';

const HERO_IMAGE = '/hero_main.png';
const getQrUrl = (data) => `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;

export default function LandingPage({ onNavigate }) {
    const [scrolled, setScrolled] = useState(false);
    const [formSent, setFormSent] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');
    const containerRef = useRef(null);

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
        const allSettings = db.getAll('settings');
        const getSetting = (key, defaultVal) => allSettings.find(s => s.key === key)?.value || defaultVal;

        setStoreInfo({
            name: getSetting('store_name', 'ABADI JAYA COPIER'),
            address: getSetting('store_address', 'Desa Kediren RT 06 RW 01, Kec. Lembeyan, Kab. Magetan, Jawa Timur'),
            phone: getSetting('store_phone', '+62 812 3456 7890'),
            mapsUrl: getSetting('store_maps_url', 'https://maps.app.goo.gl/DD3kUGfTmqaZ9iDd7')
        });

        setPrices({
            fotocopy: db.getAll('fotocopy_prices').slice(0, 4),
            print: db.getAll('print_prices').slice(0, 4),
            binding: db.getAll('binding_prices').slice(0, 4)
        });

        setFeaturedProducts(db.getAll('products').filter(p => (p.stock || 0) > 0).slice(0, 8));

        const savedGallery = getSetting('landing_gallery');
        try { if (savedGallery) setGalleryImages(JSON.parse(savedGallery)); } catch (e) { console.error(e); }

        setStoreLogo(getSetting('landing_logo', ''));

        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const services = [
        { title: 'ATK & Stationery', desc: 'Kebutuhan alat tulis kantor lengkap dengan kualitas terbaik.', icon: <FiFileText />, color: 'blue' },
        { title: 'Fotocopy & Jilid', desc: 'Layanan fotocopy cepat, jilid spiral, lakban, hingga hard cover.', icon: <FiLayers />, color: 'indigo' },
        { title: 'Digital Printing', desc: 'Cetak kartu nama, brosur, stiker, hingga banner berkualitas tinggi.', icon: <FiImage />, color: 'emerald' },
        { title: 'Cetak Offset', desc: 'Solusi cetak dalam jumlah besar untuk majalah, undangan, dan form.', icon: <FiCpu />, color: 'amber' },
        { title: 'Service Fotocopy', desc: 'Teknisi berpengalaman siap menangani kendala mesin fotocopy Anda.', icon: <FiSettings />, color: 'rose' },
        { title: 'Digitalizing', desc: 'Scan dokumen ke berbagai format digital dengan resolusi tinggi.', icon: <FiPrinter />, color: 'cyan' },
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

    const categories = ['All', 'Kertas', 'Buku', 'Alat Tulis', 'Lainnya'];
    const filteredProducts = activeCategory === 'All'
        ? featuredProducts
        : featuredProducts.filter(p => (p.category === activeCategory) || (activeCategory === 'Lainnya' && !categories.includes(p.category)));

    return (
        <div className="bg-white text-slate-900 font-display selection:bg-blue-600 selection:text-white overflow-x-hidden">
            {/* Header SEO */}
            <h1 className="sr-only">{storeInfo.name} - Solusi Cetak & Fotocopy Magetan</h1>

            {/* Navigation */}
            <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/80 backdrop-blur-xl py-4 shadow-sm border-b border-slate-100' : 'bg-transparent py-8'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="size-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                            {storeLogo ? <img src={storeLogo} className="size-full object-contain p-1" alt="Logo" /> : <FiPrinter className="text-xl" />}
                        </div>
                        <span className="text-lg font-black tracking-tighter uppercase italic text-slate-900 leading-none">
                            {storeInfo.name.split(' ')[0]} <span className="text-blue-600">{storeInfo.name.split(' ').slice(1).join(' ')}</span>
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-10">
                        {['Services', 'Prices', 'Service Machine', 'Location'].map((item) => (
                            <a
                                key={item}
                                href={`#${item.toLowerCase().replace(' ', '-')}`}
                                className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-blue-600 transition-colors"
                            >
                                {item}
                            </a>
                        ))}
                        <button
                            onClick={() => onNavigate('login')}
                            className="bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 active:scale-95 transition-all"
                        >
                            Portal Kasir
                        </button>
                    </div>

                    <button className="md:hidden size-10 flex items-center justify-center bg-slate-100 rounded-xl" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        className="fixed inset-0 z-60 bg-white p-10 flex flex-col items-center justify-center gap-8"
                    >
                        <button className="absolute top-10 right-10 size-12 bg-slate-100 rounded-2xl flex items-center justify-center" onClick={() => setIsMobileMenuOpen(false)}>
                            <FiX size={24} />
                        </button>
                        {['Services', 'Prices', 'Service Machine', 'Location'].map((item) => (
                            <a
                                key={item}
                                href={`#${item.toLowerCase().replace(' ', '-')}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-2xl font-black uppercase tracking-widest text-slate-900 hover:text-blue-600 italic"
                            >
                                {item}
                            </a>
                        ))}
                        <button
                            onClick={() => { setIsMobileMenuOpen(false); onNavigate('login'); }}
                            className="w-full bg-blue-600 text-white py-5 rounded-4xl text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-500/20"
                        >
                            Portal Kasir
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hero Section */}
            <section id="home" className="relative pt-32 pb-20 lg:pt-52 lg:pb-40 overflow-hidden">
                <div className="absolute top-0 right-0 w-[60%] h-full bg-slate-50/50 -z-10 skew-x-[-15deg] translate-x-1/4"></div>
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-16 items-center">
                    <div className="lg:col-span-7 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-full border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest"
                        >
                            <span className="size-2 bg-blue-600 rounded-full animate-pulse"></span>
                            Best Printing Partner in Magetan
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-[0.95] uppercase italic"
                        >
                            Solusi <span className="text-blue-600">Cetak &</span> <br />
                            Fotocopy <span className="text-blue-600">Anda.</span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg text-slate-500 max-w-xl leading-relaxed"
                        >
                            Menyediakan layanan ATK, Fotocopy, Digital Printing hingga Service Mesin Fotocopy
                            dengan kualitas premium dan pelayanan cepat untuk mendukung bisnis dan pendidikan Anda.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col sm:flex-row gap-4"
                        >
                            <a href="#services" className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-4xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/40 transition-all flex items-center justify-center gap-3 group">
                                Lihat Layanan <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </a>
                            <a href="#service-machine" className="bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-200 px-10 py-5 rounded-4xl text-[11px] font-black uppercase tracking-[0.2em] transition-all text-center">
                                Request Service
                            </a>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="grid grid-cols-3 gap-8 pt-10 border-t border-slate-100"
                        >
                            {[
                                { val: '10+', label: 'Years Exp' },
                                { val: '5k+', label: 'Clients' },
                                { val: '24h', label: 'Max Turnaround' },
                            ].map((s, i) => (
                                <div key={i}>
                                    <p className="text-3xl font-black text-slate-900 italic tracking-tighter">{s.val}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    <div className="lg:col-span-5 relative group">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, delay: 0.4 }}
                            className="relative z-10 rounded-4xl overflow-hidden shadow-2xl shadow-blue-600/10 border-8 border-white group-hover:rotate-1 transition-transform duration-700"
                        >
                            <img src={HERO_IMAGE} alt="Abadi Jaya Printing" className="w-full aspect-4/5 object-cover group-hover:scale-110 transition-transform duration-1000" />
                        </motion.div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-600/5 rounded-full blur-3xl z-0 group-hover:scale-125 transition-transform duration-1000"></div>
                        <div className="absolute -bottom-10 -right-10 bg-white p-6 rounded-4xl shadow-xl z-20 flex flex-col items-center gap-2 border border-slate-50 max-w-[140px] animate-bounce">
                            <FiCheckCircle className="text-emerald-500 text-3xl" />
                            <p className="text-[10px] font-black text-center uppercase tracking-widest leading-none">Garansi Kualitas</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="py-32 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
                        <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.4em]">Expert Expertise</h3>
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter uppercase italic">Layanan Unggulan Kami</h2>
                        <div className="size-16 h-1.5 bg-blue-600 mx-auto rounded-full"></div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {services.map((s, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                className="bg-white p-10 rounded-4xl border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-600/5 transition-all group"
                            >
                                <div className={`size-16 rounded-3xl mb-8 flex items-center justify-center text-2xl transition-all group-hover:scale-110 rotate-3 group-hover:rotate-0 ${s.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                                    s.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                                        s.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                                            s.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                                                s.color === 'rose' ? 'bg-rose-50 text-rose-600' :
                                                    'bg-cyan-50 text-cyan-600'
                                    }`}>
                                    {s.icon}
                                </div>
                                <h4 className="text-xl font-black tracking-tight uppercase italic mb-4">{s.title}</h4>
                                <p className="text-slate-500 leading-relaxed text-sm">{s.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Price List Section */}
            <section id="prices" className="py-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col lg:flex-row justify-between items-end gap-8 mb-20">
                        <div className="space-y-4 text-center lg:text-left">
                            <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.4em]">Transparent Pricing</h3>
                            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter uppercase italic">Daftar Harga Terbuka</h2>
                        </div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic flex items-center gap-2">
                            <FiInfo className="text-blue-500" /> Harga sewaktu-waktu dapat berubah mengikuti pasar
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {[
                            { name: 'Fotocopy', icon: <FiFileText />, data: prices.fotocopy, defaults: [{ p: 'A4 B/W', v: 300 }, { p: 'F4 B/W', v: 350 }, { p: 'Warna Standard', v: 2000 }] },
                            { name: 'Print Dokumen', icon: <FiPrinter />, data: prices.print, defaults: [{ p: 'A4 B/W', v: 500 }, { p: 'A4 Warna', v: 2000 }, { p: 'Foto Premium', v: 5000 }] },
                            { name: 'Penjilidan', icon: <FiLayers />, data: prices.binding, defaults: [{ p: 'Spiral Kawat', v: 5000 }, { p: 'Lakban Rapih', v: 3000 }, { p: 'Custom Cover', v: 25000 }] },
                        ].map((cat, i) => (
                            <div key={i} className="bg-slate-950 rounded-4xl p-10 text-white shadow-2xl relative group overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform"></div>
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-500 text-xl font-bold italic shadow-xl">
                                        {cat.icon}
                                    </div>
                                    <h3 className="text-lg font-black tracking-widest uppercase italic">{cat.name}</h3>
                                </div>

                                <div className="space-y-1">
                                    {cat.data.length > 0 ? cat.data.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center py-4 border-b border-white/5 group/item cursor-default">
                                            <span className="text-xs font-bold text-slate-400 group-hover/item:text-white transition-colors">{item.paper || item.name} {item.color ? `(${item.color.toUpperCase()})` : ''}</span>
                                            <span className="text-sm font-black italic tracking-tight text-blue-400">Rp {parseInt(item.price || 0).toLocaleString()}</span>
                                        </div>
                                    )) : cat.defaults.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center py-4 border-b border-white/5">
                                            <span className="text-xs font-bold text-slate-400">{item.p}</span>
                                            <span className="text-sm font-black italic tracking-tight text-blue-400">Rp {item.v.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-10 flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">
                                    <div className="size-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                                    Verified Rates ID-Mag-0{i + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Products Section */}
            {featuredProducts.length > 0 && (
                <section className="py-32 bg-white">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex flex-col lg:flex-row justify-between items-center gap-8 mb-20 text-center lg:text-left">
                            <div className="space-y-4">
                                <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.4em]">Store Inventory</h3>
                                <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter uppercase italic">Hot Items & ATK</h2>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeCategory === cat ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/10' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
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
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    whileHover={{ y: -10, scale: 1.02 }}
                                    transition={{ duration: 0.4, delay: i * 0.1, type: "spring", stiffness: 200, damping: 20 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    className="bg-gradient-to-b from-white to-slate-50 rounded-4xl border-2 border-slate-100 overflow-hidden group shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-500/20 hover:border-blue-200 transition-all duration-500 cursor-pointer flex flex-col"
                                >
                                    <div className="aspect-square bg-gradient-to-br from-slate-50 to-white relative overflow-hidden flex items-center justify-center p-12">
                                        <div className="absolute top-4 left-4 bg-blue-600 backdrop-blur-md px-3 py-1.5 rounded-xl text-[9px] font-black text-white uppercase tracking-widest z-10 border border-blue-500 shadow-lg shadow-blue-500/30">In Stock</div>
                                        <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        <FiTag className="text-6xl text-slate-300 group-hover:text-blue-500 group-hover:scale-125 transition-all duration-700 group-hover:rotate-12 relative z-10 drop-shadow-sm group-hover:drop-shadow-md" />
                                        {/* In a real scenario use p.imageUrl if exists */}
                                    </div>
                                    <div className="p-8 space-y-5 flex-1 flex flex-col bg-white">
                                        <div className="min-h-[40px]">
                                            <h4 className="text-[11px] font-black uppercase tracking-tight italic text-slate-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{p.name}</h4>
                                        </div>
                                        <div className="flex items-center justify-between pb-6 border-b border-slate-200/80">
                                            <p className="text-lg font-black italic tracking-tighter text-slate-900 group-hover:text-blue-600 transition-colors">Rp {parseInt(p.sellPrice || 0).toLocaleString()}</p>
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">Qty: {p.stock}</span>
                                        </div>
                                        <div className="pt-2 mt-auto">
                                            <button
                                                onClick={() => {
                                                    const message = `Halo ${storeInfo.name}, saya ingin memesan produk:%0A- Nama: ${p.name}%0A- Harga: Rp ${parseInt(p.sellPrice || 0).toLocaleString()}%0A%0AApakah stok masih tersedia?`;
                                                    window.open(`https://wa.me/${storeInfo.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
                                                }}
                                                className="w-full py-4 bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 group/btn shadow-md hover:shadow-xl hover:shadow-blue-600/30 border border-slate-200 hover:border-blue-500"
                                            >
                                                <FiSend className="text-sm group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5 transition-transform" />
                                                Pesan via WhatsApp
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Gallery Section */}
            <section id="gallery" className="py-32 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
                        <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.4em]">Portfolio</h3>
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter uppercase italic">Dokumentasi Kerja</h2>
                    </div>

                    <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8">
                        {galleryImages.length > 0 ? galleryImages.map((img, i) => (
                            <div key={i} className="break-inside-avoid rounded-4xl overflow-hidden group shadow-sm hover:shadow-2xl transition-all border-4 border-white">
                                <img src={img} className="w-full group-hover:scale-105 transition-transform duration-1000" alt="Work Gallery" />
                            </div>
                        )) : [1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="break-inside-avoid h-64 bg-slate-200 animate-pulse rounded-4xl flex items-center justify-center text-slate-400">
                                <FiImage size={40} className="opacity-20" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Service Machine Section */}
            <section id="service-machine" className="py-32">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="bg-slate-900 rounded-4xl overflow-hidden flex flex-col lg:flex-row shadow-3xl shadow-blue-500/10 border border-slate-800 relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32 blur-[100px] animate-pulse"></div>

                        <div className="lg:w-1/2 p-12 lg:p-20 space-y-8 relative z-10">
                            <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.4em]">Technical Support</h3>
                            <h2 className="text-4xl lg:text-6xl font-black text-white tracking-tighter uppercase italic leading-[0.9]">Butuh Service <br /> <span className="text-blue-500 italic font-medium tracking-normal text-5xl">Mesin Fotocopy?</span></h2>
                            <p className="text-slate-400 leading-relaxed max-w-sm">
                                Mesin Anda bermasalah? Teknisi kami siap datang ke lokasi Anda.
                                Isi formulir berikut dan teknisi kami akan segera menghubungi Anda.
                            </p>
                            <div className="space-y-4">
                                {[
                                    'Teknisi Berpengalaman & Tersertifikasi',
                                    'Sparepart Original / Grade A Quality',
                                    'Respon Cepat Khusus Area Magetan'
                                ].map((txt, i) => (
                                    <div key={i} className="flex items-center gap-4 text-xs font-bold text-slate-300">
                                        <div className="size-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                                            <FiCheck size={14} />
                                        </div>
                                        {txt}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="lg:w-1/2 p-10 lg:p-16 bg-white/5 backdrop-blur-sm border-l border-slate-800">
                            {formSent ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="h-full flex flex-col items-center justify-center text-center space-y-6"
                                >
                                    <div className="size-20 bg-emerald-500 rounded-full flex items-center justify-center text-white text-4xl shadow-2xl shadow-emerald-500/40">
                                        <FiCheckCircle />
                                    </div>
                                    <h3 className="text-2xl font-black text-white tracking-tight uppercase italic">Permintaan Terkirim!</h3>
                                    <p className="text-slate-400 text-sm max-w-xs uppercase font-bold tracking-widest italic leading-relaxed">Teknisi kami akan segera menghubungi Anda melalui nomor WhatsApp yang diberikan.</p>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleApplyService} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2 sm:col-span-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
                                        <input name="name" type="text" required placeholder="Sesuai KTP/Nama Toko" className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 px-5 text-white text-xs font-bold focus:ring-4 focus:ring-blue-500/20 transition-all outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">WhatsApp No.</label>
                                        <input name="phone" type="tel" required placeholder="0812xxxx" className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 px-5 text-white text-xs font-bold focus:ring-4 focus:ring-blue-500/20 transition-all outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Model Mesin</label>
                                        <input name="model" type="text" required placeholder="Canon iR 6000, dll" className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 px-5 text-white text-xs font-bold focus:ring-4 focus:ring-blue-500/20 transition-all outline-none" />
                                    </div>
                                    <div className="space-y-2 sm:col-span-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Lokasi Kerja / Alamat Unit</label>
                                        <textarea name="address" required rows="2" placeholder="Detail alamat untuk penjemputan/kunjungan..." className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 px-5 text-white text-xs font-bold focus:ring-4 focus:ring-blue-500/20 transition-all outline-none resize-none"></textarea>
                                    </div>
                                    <div className="space-y-2 sm:col-span-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Keluhan / Problem Diagnosis</label>
                                        <textarea name="issue" required rows="4" placeholder="Jelaskan secara detail kerusakan yang dialami..." className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 px-5 text-white text-xs font-bold focus:ring-4 focus:ring-blue-500/20 transition-all outline-none resize-none"></textarea>
                                    </div>
                                    <button type="submit" className="sm:col-span-2 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/40 transition-all flex items-center justify-center gap-3 mt-4">
                                        Kirim Authorize Request
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-32 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
                        <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.4em]">Testimonials</h3>
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter uppercase italic">Kepuasan Pelanggan</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((t, i) => (
                            <div key={i} className="bg-white p-10 rounded-4xl border border-slate-100 shadow-sm relative group overflow-hidden">
                                <div className="absolute -top-10 -left-10 text-[120px] font-black text-slate-50 opacity-10 leading-none select-none">"</div>
                                <div className="flex gap-1 mb-6">
                                    {[...Array(t.stars)].map((_, idx) => <FiCheckCircle key={idx} className="text-emerald-500" />)}
                                </div>
                                <p className="text-slate-600 text-sm leading-relaxed mb-8 relative z-10 italic">"{t.text}"</p>
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-lg italic tracking-tighter shadow-lg shadow-slate-900/20">
                                        {t.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{t.name}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Location Section */}
            <section id="location" className="py-32 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-12 gap-16 items-center">
                        <div className="lg:col-span-12 xl:col-span-5 space-y-10">
                            <div className="space-y-4">
                                <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.4em]">Direction</h3>
                                <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-[0.9]">Kunjungi Toko <br /> <span className="text-blue-600 italic font-medium tracking-normal text-4xl">Fisik Kami.</span></h2>
                            </div>

                            <div className="space-y-8">
                                <div className="flex gap-6">
                                    <div className="size-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                                        <FiMapPin size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Corporate Office / Workshop</p>
                                        <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight leading-relaxed">{storeInfo.address}</p>
                                    </div>
                                </div>
                                <div className="flex gap-6">
                                    <div className="size-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                                        <FiPhone size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer Support Line</p>
                                        <p className="text-lg font-black text-slate-900 italic tracking-tighter">{storeInfo.phone}</p>
                                    </div>
                                </div>
                                <div className="flex gap-6">
                                    <div className="size-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                                        <FiClock size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Operational Hours</p>
                                        <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight">Senin - Sabtu: 07:00 - 20:00</p>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Minggu: 08:00 - 16:00 (Limited Support)</p>
                                    </div>
                                </div>
                            </div>

                            <div
                                onClick={() => window.open(storeInfo.mapsUrl, '_blank')}
                                className="p-8 bg-slate-950 rounded-4xl flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-all group"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="bg-white rounded-2xl p-2 group-hover:rotate-12 transition-transform">
                                        <img src={getQrUrl(storeInfo.mapsUrl)} className="size-16" alt="Maps QR" />
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-black italic uppercase tracking-tight">Navigasi Langsung</p>
                                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Klik/Scan via Google Maps</p>
                                    </div>
                                </div>
                                <FiArrowRight className="text-blue-500 text-2xl group-hover:translate-x-2 transition-transform" />
                            </div>
                        </div>

                        <div className="lg:col-span-12 xl:col-span-7 h-[500px] xl:h-[600px] rounded-4xl overflow-hidden shadow-2xl shadow-blue-600/5 border-8 border-slate-50 relative group">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15814.71714856037!2d111.4111306!3d-7.71752!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7960334860b73b%3A0x26550607bd9b19e9!2sKediren%2C%20Lembeyan%2C%20Magetan%20Regency%2C%20East%20Java!5e0!3m2!1sen!2sid!4v1700000000000!5m2!1sen!2sid"
                                width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy">
                            </iframe>
                            <div className="absolute inset-0 bg-blue-600/5 pointer-events-none group-hover:opacity-0 transition-opacity"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-950 text-white pt-24 pb-12 overflow-hidden relative">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 relative z-10">
                    <div className="space-y-8 col-span-1 lg:col-span-1">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-blue-600 rounded-xl flex items-center justify-center text-white italic font-black text-xl">
                                <FiPrinter />
                            </div>
                            <span className="text-xl font-black italic tracking-tighter uppercase">{storeInfo.name}</span>
                        </div>
                        <p className="text-slate-500 text-sm leading-relaxed max-w-xs italic font-medium">
                            Solusi cetak terpercaya di Magetan dengan teknologi terkini dan harga kompetitif. Melayani sepenuh hati untuk kualitas dokumen terbaik.
                        </p>
                        <div className="flex gap-4">
                            {[FiInstagram, FiTwitter, FiFacebook].map((Icon, idx) => (
                                <a key={idx} href="#" className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-600 hover:border-blue-600 transition-all">
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-8 col-span-1 lg:col-span-1">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 italic">Quick Links</h4>
                        <ul className="space-y-4">
                            {['Home', 'Services', 'Prices', 'Location'].map(link => (
                                <li key={link}>
                                    <a href={`#${link.toLowerCase()}`} className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-500 transition-colors flex items-center gap-2 group">
                                        <span className="size-1 bg-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-8 col-span-1 lg:col-span-1">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 italic">Core Services</h4>
                        <ul className="space-y-4">
                            {['Digital Printing', 'Fotocopy', 'Cetak Offset', 'Service Mesin'].map(item => (
                                <li key={item} className="text-xs font-black uppercase tracking-widest text-slate-400 italic">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-8 col-span-1 lg:col-span-1">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 italic">Instant Support</h4>
                        <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed tracking-wider">Punya pertanyaan mendesak? Chat dengan kami melalui WhatsApp.</p>
                            <button
                                onClick={() => window.open(`https://wa.me/${storeInfo.phone.replace(/\D/g, '')}`, '_blank')}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20"
                            >
                                Fast Response
                            </button>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 italic">
                    <p>&copy; {new Date().getFullYear()} {storeInfo.name}. All Rights Reserved.</p>
                    <p>Designed by ❤️ for Supriyanto Abadi Jaya</p>
                </div>

                {/* Bottom Decorative Swirl */}
                <div className="absolute bottom-0 right-0 w-[40%] h-[60%] bg-blue-600/5 z-0 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2"></div>
            </footer>
        </div>
    );
}
