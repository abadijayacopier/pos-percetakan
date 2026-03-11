// ============================================
// UTILITY FUNCTIONS — POS FOTOCOPY ABADI JAYA
// ============================================

export const formatRupiah = (num) => {
  if (num == null || isNaN(num)) return 'Rp 0';
  return 'Rp ' + Number(num).toLocaleString('id-ID');
};

export const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const formatTime = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
};

export const generateInvoice = (prefix = 'TRX') => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const count = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}-${y}${m}-${count}`;
};

export const generateOrderNo = (prefix = 'ORD') => {
  const now = new Date();
  const y = now.getFullYear();
  const seq = String(parseInt(localStorage.getItem(`seq_${prefix}`) || '0') + 1).padStart(4, '0');
  localStorage.setItem(`seq_${prefix}`, seq);
  return `${prefix}-${y}-${seq}`;
};

export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const today = () => {
  return new Date().toISOString().split('T')[0];
};

export const isToday = (dateStr) => {
  return new Date(dateStr).toDateString() === new Date().toDateString();
};

export const generateRawReceipt = (receipt, storeInfo, printerType = '58mm') => {
  // Lebar area konten (karakter) sesuai tipe printer
  // LX-310 12cm: 36 char + margin 2 spasi
  // Inkjet/Laser: 60 char (Courier New 10pt, margin dihandle PrintDocument)
  const W = printerType === 'lx310' ? 36 : printerType === 'inkjet' ? 60 : printerType === '80mm' ? 42 : 32;
  const MARGIN = printerType === 'lx310' ? '  ' : ''; // 2 spasi margin kiri hanya untuk LX-310
  const isLx310OrInkjet = printerType === 'lx310' || printerType === 'inkjet';

  const center = (str) => {
    const pad = Math.max(0, Math.floor((W - str.length) / 2));
    return ' '.repeat(pad) + str;
  };
  const rightAlign = (left, right) => {
    const sp = W - left.length - right.length;
    return left + ' '.repeat(sp > 0 ? sp : 1) + right;
  };

  const lines = [];

  // === Header Toko (center) ===
  lines.push(center(storeInfo.name.toUpperCase()));
  if (storeInfo.address) lines.push(center(storeInfo.address));
  if (storeInfo.phone) lines.push(center('Telp: ' + storeInfo.phone));

  if (isLx310OrInkjet) {
    // LX-310 & Inkjet: judul NOTA PEMBAYARAN
    lines.push('='.repeat(W));
    lines.push(center('NOTA PEMBAYARAN'));
    lines.push('='.repeat(W));
  } else {
    lines.push('-'.repeat(W));
  }

  // === Info Transaksi ===
  lines.push(`No      : ${receipt.invoiceNo}`);
  lines.push(`Tanggal : ${formatDateTime(receipt.date)}`);
  lines.push(`Kasir   : ${receipt.userName}`);
  if (receipt.customerName && receipt.customerName !== 'Umum') {
    lines.push(`Customer: ${receipt.customerName}`);
  }
  lines.push('-'.repeat(W));

  // === Items ===
  receipt.items.forEach(item => {
    lines.push(item.name.substring(0, W));
    lines.push(rightAlign(`  ${item.qty}x ${formatRupiah(item.price)}`, formatRupiah(item.subtotal)));
  });
  lines.push('-'.repeat(W));

  // === Totals ===
  if (receipt.discount > 0) {
    lines.push(rightAlign('Subtotal :', formatRupiah(receipt.subtotal)));
    lines.push(rightAlign('Diskon   :', '-' + formatRupiah(receipt.discount)));
  }
  lines.push(rightAlign('TOTAL    :', formatRupiah(receipt.total)));
  lines.push(rightAlign('BAYAR    :', formatRupiah(receipt.paid)));
  if (receipt.change > 0) {
    lines.push(rightAlign('KEMBALI  :', formatRupiah(receipt.change)));
  }
  lines.push(rightAlign('Metode   :', (receipt.paymentType || 'tunai').toUpperCase()));

  // === Footer ===
  lines.push('-'.repeat(W));
  lines.push(center(storeInfo.footer || 'Terima kasih telah berbelanja'));
  lines.push('');
  lines.push(`Dicetak: ${new Date().toLocaleString('id-ID')}`);

  // Gabungkan semua baris dengan margin kiri
  let text = lines.map(l => MARGIN + l).join('\n') + '\n';

  if (printerType === 'lx310') {
    // Dot matrix continuous: feed 4 baris untuk spasi sobek (tanpa form feed)
    text += '\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n';
  } else if (printerType === 'inkjet') {
    // Inkjet/Laser: tidak perlu extra feed, PrintDocument handle page
  } else {
    // Thermal: feed lines agar bisa dipotong
    text += '\n\n\n';
  }

  return text;
};

export const generateOrderReceipt = (order, storeInfo, printerType = '58mm') => {
  const W = printerType === 'lx310' ? 36 : printerType === 'inkjet' ? 60 : printerType === '80mm' ? 42 : 32;
  let text = '';
  text += `${storeInfo.name.toUpperCase()}\n`;
  text += `${storeInfo.address}\n`;
  text += `Telp: ${storeInfo.phone}\n`;
  text += `-`.repeat(W) + `\n`;

  text += `No Order : ${order.orderNo}\n`;
  text += `Tanggal  : ${formatDateTime(order.createdAt || order.date || new Date())}\n`;
  text += `Pelanggan: ${order.customerName}\n`;
  text += `-`.repeat(W) + `\n`;

  text += `Jenis  : ${order.type}\n`;
  text += `Rincian: ${(order.description || '-').substring(0, W - 9)}\n`;
  text += `Specs  : ${(order.specs || '-').substring(0, W - 9)}\n`;
  text += `Jumlah : ${order.qty} ${order.unit}\n`;
  text += `Selesai: ${formatDate(order.deadline)}\n`;
  text += `-`.repeat(W) + `\n`;

  text += `Total  : ${formatRupiah(order.totalPrice).padStart(W - 9)}\n`;
  if (order.shippingCost > 0) {
    text += `Ongkir : ${formatRupiah(order.shippingCost).padStart(W - 9)}\n`;
  }
  text += `DP     : ${formatRupiah(order.dpAmount).padStart(W - 9)}\n`;
  text += `SISA   : ${formatRupiah(order.remaining).padStart(W - 9)}\n`;

  text += `\n`;
  text += `${storeInfo.footer || 'Terima kasih telah memesan'}\n`;
  text += `\n\n\n`;

  return text;
};

export const printViaRawBT = (text) => {
  try {
    // Encodes string safely considering potentially non-ASCII characters
    const base64Data = btoa(unescape(encodeURIComponent(text)));
    const intentUrl = `intent:${base64Data}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
    window.location.href = intentUrl;
  } catch (err) {
    console.error('Failed to encode receipt for RawBT:', err);
    alert('Gagal encode nota untuk printer Bluetooth');
  }
};
