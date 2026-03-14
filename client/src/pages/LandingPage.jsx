import { useState, useEffect } from 'react';
import { FiPrinter, FiCpu, FiFileText, FiLayers, FiImage, FiSettings, FiMapPin, FiPhone, FiMail, FiClock, FiUser, FiArrowRight, FiCheckCircle, FiTag, FiDollarSign, FiMenu, FiX } from 'react-icons/fi';
import './LandingPage.css';
import db from '../db';

// Re-using assets generated
const HERO_IMAGE = '/hero_main.png';
const getQrUrl = (data) => `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;

export default function LandingPage({ onNavigate }) {
    const [scrolled, setScrolled] = useState(false);
    const [formSent, setFormSent] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');
    const [storeInfo, setStoreInfo] = useState({
        name: 'FOTOCOPY ABADI JAYA',
        address: 'Desa Kediren RT 06 RW 01, Kec. Lembeyan, Kab. Magetan, Jawa Timur',
        phone: '+62 812 3456 7890',
        mapsUrl: 'https://maps.app.goo.gl/DD3kUGfTmqaZ9iDd7'
    });
    const [prices, setPrices] = useState({ fotocopy: [], print: [], binding: [] });
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [galleryImages, setGalleryImages] = useState([]);
    const [storeLogo, setStoreLogo] = useState('');

    useEffect(() => {
        // Fetch Settings
        const allSettings = db.getAll('settings');
        const getSetting = (key, defaultVal) => allSettings.find(s => s.key === key)?.value || defaultVal;

        setStoreInfo({
            name: getSetting('store_name', 'FOTOCOPY ABADI JAYA'),
            address: getSetting('store_address', 'Desa Kediren RT 06 RW 01, Kec. Lembeyan, Kab. Magetan, Jawa Timur'),
            phone: getSetting('store_phone', '+62 812 3456 7890'),
            mapsUrl: getSetting('store_maps_url', 'https://maps.app.goo.gl/DD3kUGfTmqaZ9iDd7')
        });

        // Fetch Prices
        setPrices({
            fotocopy: db.getAll('fotocopy_prices').slice(0, 4),
            print: db.getAll('print_prices').slice(0, 4),
            binding: db.getAll('binding_prices').slice(0, 4)
        });

        // Fetch Products
        setFeaturedProducts(db.getAll('products').filter(p => (p.stock || 0) > 0).slice(0, 4));

        // Fetch Gallery
        const savedGallery = getSetting('landing_gallery');
        try {
            if (savedGallery) setGalleryImages(JSON.parse(savedGallery));
        } catch (e) { console.error("Gagal load galeri", e); }

        // Fetch Logo & Favicon
        const logo = getSetting('landing_logo', '');
        const fav = getSetting('landing_favicon', '');
        setStoreLogo(logo);

        if (fav) {
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.getElementsByTagName('head')[0].appendChild(link);
            }
            link.href = fav;
        }

        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleApplyService = (e) => {
        e.preventDefault();
        const name = e.target[0].value;
        const phone = e.target[1].value;
        const model = e.target[2].value;
        const serialNo = e.target[3].value;
        const address = e.target[4].value;
        const issue = e.target[5].value;

        const message = `Halo ${storeInfo.name}, saya ingin request service mesin:%0A- Nama: ${name}%0A- WhatsApp: ${phone}%0A- Model: ${model}%0A- SN: ${serialNo || '-'}%0A- Alamat: ${address}%0A- Keluhan: ${issue}`;
        const waUrl = `https://wa.me/${storeInfo.phone.replace(/\D/g, '')}?text=${message}`;

        window.open(waUrl, '_blank');
        setFormSent(true);
        setTimeout(() => setFormSent(false), 5000);
    };

    const handleOrderProduct = (product) => {
        const message = `Halo ${storeInfo.name}, saya ingin memesan produk:%0A- Nama: ${product.name}%0A- Harga: Rp ${product.sellingPrice.toLocaleString()}%0A%0AApakah stok masih tersedia?`;
        const waUrl = `https://wa.me/${storeInfo.phone.replace(/\D/g, '')}?text=${message}`;
        window.open(waUrl, '_blank');
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMenuAndNavigate = (id) => {
        setIsMobileMenuOpen(false);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const services = [
        {
            title: 'ATK & Stationery',
            desc: 'Kebutuhan alat tulis kantor lengkap dengan kualitas terbaik.',
            icon: <FiFileText />
        },
        {
            title: 'Fotocopy & Jilid',
            desc: 'Layanan fotocopy cepat, jilid spiral, lakban, hingga hard cover.',
            icon: <FiLayers />
        },
        {
            title: 'Digital Printing',
            desc: 'Cetak kartu nama, brosur, stiker, hingga banner berkualitas tinggi.',
            icon: <FiImage />
        },
        {
            title: 'Cetak Offset',
            desc: 'Solusi cetak dalam jumlah besar untuk majalah, undangan, dan form.',
            icon: <FiCpu />
        },
        {
            title: 'Service Fotocopy',
            desc: 'Teknisi berpengalaman siap menangani kendala mesin fotocopy Anda.',
            icon: <FiSettings />
        },
        {
            title: 'Digitalizing',
            desc: 'Scan dokumen ke berbagai format digital dengan resolusi tinggi.',
            icon: <FiPrinter />
        },
    ];

    const faqData = [
        {
            q: 'Berapa lama waktu pengerjaan fotocopy dan jilid?',
            a: 'Untuk fotocopy satuan bisa ditunggu. Jilid lakban/biasa sekitar 15-30 menit, sedangkan jilid Hardcover/Skripsi membutuhkan waktu 1-2 hari kerja.'
        },
        {
            q: 'Apakah bisa cetak dokumen langsung dari WhatsApp atau Email?',
            a: 'Sangat bisa! Anda bisa mengirimkan file PDF/Doc ke WhatsApp kami atau email toko, dan kami akan segera mencetaknya untuk Anda.'
        },
        {
            q: 'Apakah melayani panggilan service mesin fotocopy ke rumah/kantor?',
            a: 'Ya, teknisi kami siap datang ke lokasi Anda khusus untuk wilayah Magetan dan sekitarnya. Silakan isi form request service di landing page ini.'
        },
        {
            q: 'Apakah ada minimal order untuk cetak offset atau banner?',
            a: 'Untuk banner tidak ada minimal order (hitung per meter). Untuk cetak cetak offset seperti nota/brosur, ada minimal order yang bervariasi tergantung jenis produknya.'
        }
    ];

    const testimonials = [
        {
            name: 'Budi Santoso',
            role: 'Mahasiswa',
            text: 'Pelayanan sangat cepat, hasil jilid rapi banget. Harganya juga bersahabat buat kantong mahasiswa.',
            stars: 5
        },
        {
            name: 'Siti Aminah',
            role: 'Sekretaris Desa',
            text: 'Langganan cetak laporan dan ATK di sini. Selalu puas dengan hasilnya, terutama cetak warna yang tajam.',
            stars: 5
        },
        {
            name: 'Aris Prasetyo',
            role: 'Pemilik Toko',
            text: 'Mesin fotocopy saya sering macet, panggil teknisi Abadi Jaya Copier langsung beres di hari yang sama. Mantap!',
            stars: 5
        }
    ];

    const categories = ['All', 'Kertas', 'Buku', 'Alat Tulis', 'Lainnya'];
    const filteredProducts = activeCategory === 'All'
        ? featuredProducts
        : featuredProducts.filter(p => (p.category === activeCategory) || (activeCategory === 'Lainnya' && !categories.includes(p.category)));

    return (
        <div className="landing-page-root">
            {/* Meta tags for SEO */}
            <div style={{ display: 'none' }}>
                <h1>{storeInfo.name} - Fotocopy, Percetakan & Service Mesin Magetan</h1>
                <p>Layanan Fotocopy terdekat di Magetan. Sedia ATK, Jilid, Cetak Digital, dan Service Mesin Fotocopy Profesional di {storeInfo.address}.</p>
            </div>
            {/* Navigation */}
            <nav className={`lp-nav ${scrolled ? 'scrolled' : ''}`}>
                <div className="lp-logo">
                    {storeLogo ? (
                        <img src={storeLogo} alt="Logo" style={{ height: '32px', marginRight: '8px', objectFit: 'contain' }} />
                    ) : (
                        <div className="lp-logo-icon"><FiPrinter /></div>
                    )}
                    <span>{storeInfo.name}</span>
                </div>
                <div className="lp-nav-links desktop-only">
                    <a href="#home" className="lp-nav-item">Home</a>
                    <a href="#services" className="lp-nav-item">Layanan</a>
                    <a href="#pricelist" className="lp-nav-item">Daftar Harga</a>
                    <a href="#service-mesin" className="lp-nav-item">Service Mesin</a>
                    <a href="#location" className="lp-nav-item">Lokasi</a>
                    <button className="lp-btn-login" onClick={() => onNavigate('login')}>
                        Portal Kasir
                    </button>
                </div>

                <button className="lp-mobile-toggle" onClick={toggleMobileMenu}>
                    {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                </button>

                <div className={`lp-mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
                    <a href="#home" className="lp-mobile-nav-item" onClick={() => closeMenuAndNavigate('home')}>Home</a>
                    <a href="#services" className="lp-mobile-nav-item" onClick={() => closeMenuAndNavigate('services')}>Layanan</a>
                    <a href="#pricelist" className="lp-mobile-nav-item" onClick={() => closeMenuAndNavigate('pricelist')}>Daftar Harga</a>
                    <a href="#service-mesin" className="lp-mobile-nav-item" onClick={() => closeMenuAndNavigate('service-mesin')}>Service Mesin</a>
                    <a href="#location" className="lp-mobile-nav-item" onClick={() => closeMenuAndNavigate('location')}>Lokasi</a>
                    <button className="lp-btn-login" style={{ marginTop: '20px' }} onClick={() => { setIsMobileMenuOpen(false); onNavigate('login'); }}>
                        Portal Kasir
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section id="home" className="lp-hero">
                <div className="lp-hero-content">
                    <div className="lp-hero-badge">BEST PRINTING PARTNER IN MAGETAN</div>
                    <h1>Solusi <span>Cetak & Fotocopy</span> Profesional Anda</h1>
                    <p>
                        Menyediakan layanan ATK, Fotocopy, Digital Printing hingga Service Mesin Fotocopy
                        dengan kualitas premium dan pelayanan cepat untuk mendukung bisnis dan pendidikan Anda.
                    </p>
                    <div className="lp-hero-ctas">
                        <a href="#services" className="lp-btn-login" style={{ padding: '14px 32px' }}>Lihat Layanan</a>
                        <a href="#service-mesin" className="lp-btn-login" style={{ background: 'transparent', border: '2px solid var(--lp-primary)', color: 'var(--lp-primary)', padding: '14px 32px' }}>Request Service</a>
                    </div>
                </div>
                <div className="lp-hero-image">
                    <div className="lp-img-wrapper">
                        {/* Note: In a real app we'd move this to public folder, for now using direct generated path */}
                        <img src={HERO_IMAGE} alt="Abadi Jaya Printing Shop" />
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="lp-section">
                <div className="lp-section-header">
                    <h2>Layanan Kami</h2>
                    <p>Apapun kebutuhan dokumen Anda, kami punya solusinya.</p>
                </div>
                <div className="lp-services-grid">
                    {services.map((s, i) => (
                        <div key={i} className="lp-service-card">
                            <div className="lp-service-icon">{s.icon}</div>
                            <h3>{s.title}</h3>
                            <p>{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Dynamic Price List Section */}
            <section id="pricelist" className="lp-section" style={{ background: 'var(--lp-bg-alt)' }}>
                <div className="lp-section-header">
                    <h2>Daftar Harga Layanan</h2>
                    <p>Transparansi harga untuk kenyamanan Anda berbelanja.</p>
                </div>

                <div className="lp-price-grid">
                    {/* Fotocopy */}
                    <div className="lp-price-card">
                        <div className="lp-price-header"><FiFileText /> <h4>Fotocopy</h4></div>
                        <div className="lp-price-list">
                            {prices.fotocopy.length > 0 ? prices.fotocopy.map(p => (
                                <div key={p.id} className="lp-price-item">
                                    <span>{p.paper} {p.color === 'bw' ? 'B/W' : 'Warna'} {p.side === '2' ? '(B/B)' : ''}</span>
                                    <span className="price">Rp {parseInt(p.price || 0).toLocaleString()}</span>
                                </div>
                            )) : (
                                <>
                                    <div className="lp-price-item"><span>HVS A4 B/W</span><span className="price">Rp 300</span></div>
                                    <div className="lp-price-item"><span>HVS F4 B/W</span><span className="price">Rp 350</span></div>
                                    <div className="lp-price-item"><span>Warna (Standard)</span><span className="price">Rp 2.000</span></div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Print */}
                    <div className="lp-price-card">
                        <div className="lp-price-header"><FiPrinter /> <h4>Print Dokumen</h4></div>
                        <div className="lp-price-list">
                            {prices.print.length > 0 ? prices.print.map(p => (
                                <div key={p.id} className="lp-price-item">
                                    <span>{p.paper} {p.color === 'bw' ? 'B/W' : 'Warna'}</span>
                                    <span className="price">Rp {parseInt(p.price || 0).toLocaleString()}</span>
                                </div>
                            )) : (
                                <>
                                    <div className="lp-price-item"><span>HVS A4 Hitam</span><span className="price">Rp 500</span></div>
                                    <div className="lp-price-item"><span>HVS A4 Warna</span><span className="price">Rp 2.000</span></div>
                                    <div className="lp-price-item"><span>Kertas Foto</span><span className="price">Rp 5.000</span></div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Jilid */}
                    <div className="lp-price-card">
                        <div className="lp-price-header"><FiLayers /> <h4>Penjilidan</h4></div>
                        <div className="lp-price-list">
                            {prices.binding.length > 0 ? prices.binding.map(p => (
                                <div key={p.id} className="lp-price-item">
                                    <span>{p.name}</span>
                                    <span className="price">Rp {parseInt(p.price || 0).toLocaleString()}</span>
                                </div>
                            )) : (
                                <>
                                    <div className="lp-price-item"><span>Jilid Spiral</span><span className="price">Rp 5.000</span></div>
                                    <div className="lp-price-item"><span>Jilid Lakban</span><span className="price">Rp 3.000</span></div>
                                    <div className="lp-price-item"><span>Hard Cover</span><span className="price">Rp 25.000</span></div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            {featuredProducts.length > 0 && (
                <section className="lp-section">
                    <div className="lp-section-header">
                        <h2>Produk ATK Populer</h2>
                        <p>Kualitas ATK terbaik untuk kebutuhan sekolah dan kantor.</p>

                        <div className="lp-category-filters">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    className={`lp-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                                    onClick={() => setActiveCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="lp-products-grid">
                        {filteredProducts.map(p => (
                            <div key={p.id} className="lp-product-card">
                                <div className="lp-product-img">
                                    <FiTag size={40} color="var(--lp-primary)" style={{ opacity: 0.2 }} />
                                </div>
                                <h4>{p.name}</h4>
                                <div className="lp-product-footer">
                                    <span className="price">Rp {parseInt(p.sellPrice || 0).toLocaleString()}</span>
                                    <span className="stock">Stok: {p.stock}</span>
                                </div>
                                <button className="lp-btn-buy" onClick={() => handleOrderProduct(p)}>
                                    Pesan via WA
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Gallery Section */}
            <section className="lp-section" id="gallery" style={{ background: 'var(--lp-bg-alt)' }}>
                <div className="lp-section-header">
                    <h2>Galeri Toko & Hasil Kerja</h2>
                    <p>Dokumentasi profesionalitas dan kualitas layanan kami</p>
                </div>
                <div className="lp-gallery-grid">
                    {galleryImages.length > 0 ? (
                        galleryImages.map((img, i) => (
                            <div key={i} className="lp-gallery-item">
                                <div className="lp-gallery-img">
                                    <img src={img} alt={`Karya Abadi Jaya ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            </div>
                        ))
                    ) : (
                        <>
                            <div className="lp-gallery-item"><div className="lp-gallery-img" style={{ background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiImage size={40} color="#ccc" /></div></div>
                            <div className="lp-gallery-item"><div className="lp-gallery-img" style={{ background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiImage size={40} color="#ccc" /></div></div>
                            <div className="lp-gallery-item"><div className="lp-gallery-img" style={{ background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiImage size={40} color="#ccc" /></div></div>
                            <div className="lp-gallery-item"><div className="lp-gallery-img" style={{ background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiImage size={40} color="#ccc" /></div></div>
                            <div className="lp-gallery-item"><div className="lp-gallery-img" style={{ background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiImage size={40} color="#ccc" /></div></div>
                            <div className="lp-gallery-item"><div className="lp-gallery-img" style={{ background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiImage size={40} color="#ccc" /></div></div>
                        </>
                    )}
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="lp-section" id="testimonials">
                <div className="lp-section-header">
                    <h2>Apa Kata Mereka?</h2>
                    <p>Kepercayaan pelanggan adalah prioritas utama kami</p>
                </div>
                <div className="lp-testimonials-grid">
                    {testimonials.map((t, i) => (
                        <div key={i} className="lp-testimonial-card">
                            <div className="lp-stars">{'★'.repeat(t.stars)}</div>
                            <p className="lp-t-text">"{t.text}"</p>
                            <div className="lp-t-author">
                                <strong>{t.name}</strong>
                                <span>{t.role}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ Section */}
            <section className="lp-section" id="faq" style={{ background: 'var(--lp-bg-alt)' }}>
                <div className="lp-section-header">
                    <h2>Sering Ditanyakan</h2>
                    <p>Hubungi kami jika pertanyaan Anda belum terjawab</p>
                </div>
                <div className="lp-faq-container">
                    {faqData.map((item, i) => (
                        <div key={i} className="lp-faq-item">
                            <div className="lp-faq-q">{item.q}</div>
                            <div className="lp-faq-a">{item.a}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Service Request Section */}
            <section id="service-mesin" className="lp-section">
                <div className="lp-form-section">
                    <div className="lp-form-text">
                        <h2>Butuh Service Mesin Fotocopy?</h2>
                        <p style={{ marginTop: '20px', fontSize: '1.1rem', color: 'var(--lp-text-muted)' }}>
                            Mesin Anda bermasalah? Teknisi kami siap datang ke lokasi Anda.
                            Isi formulir berikut dan teknisi kami akan segera menghubungi Anda.
                        </p>
                        <div style={{ marginTop: '40px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                <FiCheckCircle color="var(--lp-primary)" /> <span>Teknisi Berpengalaman</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <FiCheckCircle color="var(--lp-primary)" /> <span>Sparepart Original (Opsional)</span>
                            </div>
                        </div>
                    </div>
                    <div className="lp-form-card">
                        {formSent ? (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <div style={{ width: '60px', height: '60px', background: '#ecfdf5', color: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '2rem' }}>
                                    <FiCheckCircle />
                                </div>
                                <h3>Permintaan Terkirim!</h3>
                                <p style={{ color: 'var(--lp-text-muted)', marginTop: '10px' }}>Teknisi kami akan segera menghubungi Anda melalui nomor WhatsApp yang diberikan.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleApplyService}>
                                <div className="lp-form-group">
                                    <label>Nama Lengkap</label>
                                    <input type="text" className="lp-form-input" placeholder="Masukkan nama Anda" required />
                                </div>
                                <div className="lp-form-group">
                                    <label>No. WhatsApp</label>
                                    <input type="tel" className="lp-form-input" placeholder="Contoh: 08123456789" required />
                                </div>
                                <div className="lp-form-group">
                                    <label>Model Mesin</label>
                                    <input type="text" className="lp-form-input" placeholder="Contoh: Canon iR 6000 / Kyocera" required />
                                </div>
                                <div className="lp-form-group">
                                    <label>Serial Number (Opsional)</label>
                                    <input type="text" className="lp-form-input" placeholder="Masukkan nomor seri mesin Anda" />
                                </div>
                                <div className="lp-form-group">
                                    <label>Alamat Lengkap / Lokasi Unit</label>
                                    <textarea className="lp-form-input" rows="2" placeholder="Masukkan alamat lengkap lokasi mesin" required></textarea>
                                </div>
                                <div className="lp-form-group">
                                    <label>Keluhan / Masalah</label>
                                    <textarea className="lp-form-input" rows="4" placeholder="Jelaskan masalah mesin Anda" required></textarea>
                                </div>
                                <button type="submit" className="lp-btn-login" style={{ width: '100%', marginTop: '10px' }}>
                                    Kirim Permintaan Service
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            {/* Profile & About */}
            <section className="lp-section">
                <div className="lp-section-header">
                    <h2>Profil Toko</h2>
                </div>
                <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                    <p style={{ fontSize: '1.2rem', lineHeight: '1.8' }}>
                        <strong>{storeInfo.name}</strong> telah melayani kebutuhan cetak dan fotocopy masyarakat Magetan selama lebih dari satu dekade.
                        Dimulai dari sebuah ruko kecil di Desa Kediren, kini kami telah berkembang menjadi pusat layanan dokumen terintegrasi
                        yang menyediakan solusi dari hulu ke hilir bagi sekolah, instansi pemerintah, maupun pelaku usaha.
                    </p>
                </div>
            </section>

            {/* Location */}
            <section id="location" className="lp-section" style={{ background: 'var(--lp-bg-alt)' }}>
                <div className="lp-section-header">
                    <h2>Kunjungi Toko Kami</h2>
                    <p>Lokasi strategis dan mudah dijangkau.</p>
                </div>
                <div className="lp-location-grid">
                    <div className="lp-map-box">
                        {/* Simple iframe map for Kediren, Lembeyan */}
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15814.71714856037!2d111.4111306!3d-7.71752!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7960334860b73b%3A0x26550607bd9b19e9!2sKediren%2C%20Lembeyan%2C%20Magetan%20Regency%2C%20East%20Java!5e0!3m2!1sen!2sid!4v1700000000000!5m2!1sen!2sid"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy">
                        </iframe>
                    </div>
                    <div className="lp-info-box">
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Alamat & Kontak</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <FiMapPin size={24} color="var(--lp-primary)" />
                                <p>{storeInfo.address}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <FiPhone size={24} color="var(--lp-primary)" />
                                <p>{storeInfo.phone}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <FiClock size={24} color="var(--lp-primary)" />
                                <p>Senin - Sabtu: 07:00 - 20:00<br />Minggu: 08:00 - 16:00</p>
                            </div>
                        </div>

                        <div className="lp-qr-box" onClick={() => window.open(storeInfo.mapsUrl, '_blank')} style={{ cursor: 'pointer' }}>
                            <img src={getQrUrl(storeInfo.mapsUrl)} alt="Location QR Code" className="lp-qr-img" />
                            <p style={{ fontWeight: '700', color: 'var(--lp-primary)' }}>Klik/Scan untuk Navigasi</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="lp-footer">
                <div className="lp-footer-content">
                    <div>
                        <div className="lp-logo" style={{ marginBottom: '20px' }}>
                            <div className="lp-logo-icon"><FiPrinter /></div>
                            <span>{storeInfo.name}</span>
                        </div>
                        <p style={{ color: 'var(--lp-text-muted)' }}>Solusi cetak terpercaya di Magetan dengan teknologi terkini dan harga kompetitif.</p>
                    </div>
                    <div>
                        <h4 style={{ marginBottom: '20px' }}>Layanan Cepat</h4>
                        <ul style={{ listStyle: 'none', color: 'var(--lp-text-muted)', lineHeight: '2' }}>
                            <li>Fotocopy</li>
                            <li>Digital Printing</li>
                            <li>Service Mesin</li>
                            <li>Alat Tulis Kantor</li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={{ marginBottom: '20px' }}>Hubungi Kami</h4>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button className="lp-btn-login" style={{ padding: '8px 16px', fontSize: '0.8rem' }} onClick={() => window.open(`https://wa.me/${storeInfo.phone.replace(/\D/g, '')}`, '_blank')}>WhatsApp</button>
                            <button className="lp-btn-login" style={{ padding: '8px 16px', fontSize: '0.8rem', background: '#334155' }}>Instagram</button>
                        </div>
                    </div>
                </div>
                <div className="lp-footer-bottom">
                    &copy; {new Date().getFullYear()} {storeInfo.name}. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
