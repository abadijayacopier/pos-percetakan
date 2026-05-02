import Swal from 'sweetalert2';
import EscPosEncoder from 'esc-pos-encoder';
import qz from 'qz-tray';


// ============================================
// UTILITY FUNCTIONS — POS FOTOCOPY ABADI JAYA
// ============================================

export const formatRupiah = (num) => {
  if (num == null || isNaN(num)) return 'Rp 0';
  return 'Rp ' + Number(num).toLocaleString('id-ID');
};

export const formatDate = (date) => {
  if (!date) return '-';
  let validDate = date;
  if (typeof validDate === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(validDate)) {
    validDate = validDate.replace(' ', 'T'); // No 'Z' to treat as local time
  }
  const d = new Date(validDate);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  let d;

  if (typeof dateStr === 'string' && dateStr.includes(' ')) {
    // MySQL format: "YYYY-MM-DD HH:mm:ss"
    // Treat as local time by replacing space with T but NOT adding Z
    d = new Date(dateStr.replace(' ', 'T'));
  } else {
    d = new Date(dateStr);
  }

  if (isNaN(d.getTime())) {
    if (typeof dateStr === 'string' && !dateStr.includes('Invalid')) return dateStr;
    return '-';
  }

  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).replace(/\./g, ':');
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

export const generateRawReceipt = (receipt, storeInfo, printerType = '58mm', forceBinary = false, paperSize = 'standard') => {
  const isBluetooth = forceBinary || printerType === 'bluetooth';

  // W calculation based on printer type and paper size
  let W = 32; // Default for 58mm
  if (printerType === '80mm') W = 42;
  else if (printerType === 'inkjet') W = 80;
  else if (printerType === 'lx310') {
    if (paperSize === 'wartel' || paperSize === '12x14') W = 38; // Reduced to 38 to prevent cutoff
    else if (paperSize === 'half' || paperSize === '9.5x5.5') W = 85;
    else W = 85; // Standard 9.5x11
  }

  const wrapText = (text, maxWidth) => {
    if (!text) return [];
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
      if ((currentLine + word).length > maxWidth) {
        if (currentLine) lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    });
    if (currentLine) lines.push(currentLine.trim());
    return lines;
  };

  // Safe Date string
  const dateStr = receipt.date || new Date();
  const safeDate = typeof dateStr === 'string' && dateStr.includes(',') ? dateStr : formatDateTime(dateStr);

  const centerText = (str) => {
    const pad = Math.max(0, Math.floor((W - str.length) / 2));
    return ' '.repeat(pad) + str;
  };

  const btCenterLine = (enc, str) => {
    const pad = Math.max(0, Math.floor((W - str.length) / 2));
    if (pad > 0) enc.raw(new Array(pad).fill(0x20));
    enc.text(str).newline();
  };

  if (isBluetooth) {
    const encoder = new EscPosEncoder();
    encoder.initialize();

    // Header (Raw Byte Padding to bypass ESC whitespace trimming)
    encoder.align('left')
      .bold(true).size('normal', 'normal');
    btCenterLine(encoder, (storeInfo.name || 'FOTOCOPY ABADI JAYA').toUpperCase());
    encoder.bold(false).size('normal', 'normal');

    const addressLines = wrapText(storeInfo.address || '', W);
    addressLines.forEach(l => btCenterLine(encoder, l));

    if (storeInfo.phone) btCenterLine(encoder, 'Telp: ' + storeInfo.phone);
    encoder.line('-'.repeat(W));

    // NOTA PEMBAYARAN Banner
    encoder.newline();
    encoder.invert(true);
    btCenterLine(encoder, ' NOTA PEMBAYARAN ');
    encoder.invert(false);
    encoder.newline();

    // Info Transaksi
    const rightAlign = (left, right) => {
      const sp = W - left.length - right.length;
      return left + ' '.repeat(Math.max(1, sp)) + right;
    };

    encoder.line(rightAlign('INVOICE', `# ${receipt.invoiceNo || '-'}`));
    encoder.line(rightAlign('TANGGAL', safeDate.toUpperCase()));
    encoder.line(rightAlign('KASIR', (receipt.userName || storeInfo.userName || 'KASIR').toUpperCase()));
    if (receipt.customerName && receipt.customerName !== 'Umum') {
      encoder.line(rightAlign('PELANGGAN', receipt.customerName.toUpperCase()));
    }
    encoder.line('-'.repeat(W));

    // Items
    const items = receipt.items || [];
    items.forEach(item => {
      const qty = item.qty ?? item.quantity ?? 1;
      const subtotal = item.total ?? item.subtotal ?? 0;
      let price = item.price ?? item.sellPrice ?? item.unit_price ?? item.harga_satuan ?? 0;
      if (price === 0 && subtotal > 0 && qty > 0) price = Math.round(subtotal / qty);

      const nameLines = wrapText(item.name || item.desc || 'Item', W);
      nameLines.forEach(l => encoder.line(l));
      encoder.line(rightAlign(`  ${qty} x ${price.toLocaleString('id-ID')}`, formatRupiah(subtotal)));
    });
    encoder.line('-'.repeat(W));

    // Totals
    const subtotalTx = receipt.subtotal ?? items.reduce((acc, item) => acc + (item.total ?? item.subtotal ?? ((item.qty ?? item.quantity ?? 1) * (item.price ?? item.sellPrice ?? 0))), 0);
    const totalTx = receipt.total ?? (subtotalTx - (receipt.discount ?? 0));

    encoder.line(rightAlign('SUBTOTAL', subtotalTx.toLocaleString('id-ID')));
    if ((receipt.discount ?? 0) > 0) {
      encoder.line(rightAlign('DISKON', '-' + receipt.discount.toLocaleString('id-ID')));
    }

    encoder.line('-'.repeat(W));
    encoder.invert(true).bold(true).line(rightAlign('TOTAL', formatRupiah(totalTx))).bold(false).invert(false);
    encoder.newline();

    const payType = (receipt.paymentType || 'TUNAI').toUpperCase();
    encoder.line(rightAlign('PEMBAYARAN', payType));
    encoder.line(rightAlign('DITERIMA', (receipt.paid ?? totalTx).toLocaleString('id-ID')));
    if ((receipt.change ?? 0) > 0) {
      encoder.line(rightAlign('KEMBALIAN', receipt.change.toLocaleString('id-ID')));
    }
    const isUnpaid = (Number(receipt.paid) < Number(totalTx)) ||
      ['pending', 'debt'].includes(String(receipt.status || '').toLowerCase()) ||
      ['pending', 'debt'].includes(String(receipt.paymentType || '').toLowerCase());
    encoder.line(rightAlign('STATUS', isUnpaid ? 'BELUM LUNAS' : 'LUNAS'));
    encoder.newline();

    // Footer
    encoder.line('-'.repeat(W)).align('left');
    const footerLines = wrapText(storeInfo.footer || 'Terima kasih atas kunjungan Anda!', W);
    footerLines.forEach(l => btCenterLine(encoder, l));
    encoder.newline().cut();

    return encoder.encode();
  }

  const ESC = '\x1b';
  const BOLD_ON = ESC + 'E';
  const BOLD_OFF = ESC + 'F';
  const boldText = (t) => (printerType === 'lx310' ? BOLD_ON + t + BOLD_OFF : t);

  // Strip ESC codes for accurate length calculation
  const visibleLength = (str) => str.replace(/\x1b[A-Za-z@]/g, '').length;

  // Margin calculation for centering LX-310
  // Increased to 8 spaces for Wartel to shift it significantly to the RIGHT as requested
  const MARGIN = (printerType === 'lx310' && paperSize === 'wartel') ? '        ' : (printerType === 'lx310' ? '  ' : '');
  const rightAlignText = (left, right) => {
    const sp = W - visibleLength(left) - visibleLength(right);
    return left + ' '.repeat(sp > 0 ? sp : 1) + right;
  };

  const centerTextExact = (str) => {
    const vLen = visibleLength(str);
    const pad = Math.max(0, Math.floor((W - vLen) / 2));
    return ' '.repeat(pad) + str;
  };

  const lines = [];
  // Add top margin for LX-310 to prevent printing too close to the edge
  if (printerType === 'lx310') {
    lines.push('');
    lines.push('');
  }

  lines.push(centerTextExact(boldText((storeInfo.name || 'FOTOCOPY ABADI JAYA').toUpperCase())));
  // Wrap address at half width for centered multi-line header
  const addrWrapWidth = Math.min(W, Math.floor(W * 0.7));
  const addressLinesRaw = wrapText(storeInfo.address || '', addrWrapWidth);
  addressLinesRaw.forEach(l => lines.push(centerTextExact(l)));

  if (storeInfo.phone) lines.push(centerTextExact('Telp: ' + storeInfo.phone));

  if (printerType === 'lx310' || printerType === 'inkjet') {
    lines.push('='.repeat(W));
    lines.push(centerTextExact(boldText('NOTA PEMBAYARAN')));
    lines.push('='.repeat(W));
  } else {
    lines.push('-'.repeat(W));
  }

  lines.push(`No       : ${receipt.invoiceNo || '-'}`);
  lines.push(`Tanggal  : ${safeDate}`);
  lines.push(`Kasir    : ${receipt.userName || storeInfo.userName || 'Kasir'}`);
  lines.push(`Pelanggan: ${receipt.customerName || receipt.customer || 'Umum'}`);
  lines.push('-'.repeat(W));

  const items = receipt.items || [];
  items.forEach(item => {
    const qty = item.qty ?? item.quantity ?? 1;
    const subtotal = item.total ?? item.subtotal ?? 0;
    let price = item.price ?? item.sellPrice ?? item.unit_price ?? item.harga_satuan ?? 0;
    // Calculation fallback if price is missing or zero
    if (!price || price === 0) {
      if (subtotal > 0 && qty > 0) price = Math.round(subtotal / qty);
    }

    const nameLines = wrapText(item.name || item.desc || 'Item', W);
    nameLines.forEach(l => lines.push(l));

    // --- SINKRONISASI SERVICE FOTOCOPY & DETAIL LAINNYA ---
    // Tampilkan detail spesifikasi jika ada (meta data)
    if (item.meta) {
      let metaText = '';
      if (item.type === 'fotocopy') {
        metaText = `${item.meta.paper || ''} ${item.meta.color === 'bw' ? 'B/W' : 'Warna'} ${item.meta.side === '2' ? '2-Sisi' : '1-Sisi'}`;
      } else if (item.type === 'digital') {
        metaText = `${item.meta.width}x${item.meta.height}m ${item.meta.notes || ''}`;
      } else if (item.type === 'service_order') {
        metaText = `${item.meta.device || ''} ${item.meta.issue ? `(${item.meta.issue})` : ''}`;
      }

      if (metaText) {
        const metaLines = wrapText(metaText.trim(), W - 2);
        metaLines.forEach(ml => lines.push('  ' + ml));
      }
    }

    lines.push(rightAlignText(`  ${qty}x ${formatRupiah(price)}`, formatRupiah(subtotal)));
  });
  lines.push('-'.repeat(W));

  const subtotalTx = receipt.subtotal ?? items.reduce((acc, item) => acc + (item.total ?? item.subtotal ?? ((item.qty ?? item.quantity ?? 1) * (item.price ?? item.sellPrice ?? 0))), 0);
  const totalTx = receipt.total ?? (subtotalTx - (receipt.discount ?? 0));

  if ((receipt.discount ?? 0) > 0) {
    lines.push(rightAlignText('Subtotal :', formatRupiah(subtotalTx)));
    lines.push(rightAlignText('Diskon   :', '-' + formatRupiah(receipt.discount)));
  }

  lines.push(rightAlignText(boldText('TOTAL    :'), formatRupiah(totalTx)));
  lines.push(rightAlignText('BAYAR    :', formatRupiah(receipt.paid ?? totalTx)));
  if ((receipt.change ?? 0) > 0) {
    lines.push(rightAlignText('KEMBALI  :', formatRupiah(receipt.change)));
  }
  const isUnpaidRaw = (Number(receipt.paid) < Number(totalTx)) ||
    ['pending', 'debt'].includes(String(receipt.status || '').toLowerCase()) ||
    ['pending', 'debt'].includes(String(receipt.paymentType || '').toLowerCase());
  lines.push(rightAlignText('STATUS   :', isUnpaidRaw ? boldText('BELUM LUNAS') : boldText('LUNAS')));

  // Add Notes section if exists
  if (receipt.notes) {
    lines.push('-'.repeat(W));
    lines.push('Catatan:');
    const noteLines = wrapText(receipt.notes, W - 2);
    noteLines.forEach(ln => lines.push('  ' + ln));
  }

  lines.push('-'.repeat(W));
  lines.push(centerTextExact(storeInfo.footer || 'Terima kasih atas kunjungan Anda!'));
  lines.push('');

  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':');
  const dateStrShort = now.toLocaleDateString('id-ID');
  lines.push(`Dicetak: ${dateStrShort}, ${timeStr}`);

  let textResult = lines.map(l => MARGIN + l).join('\n') + '\n';
  if (printerType === 'lx310') {
    // ESC/P init: ESC @ (reset) + ESC P (10 CPI) + ESC 2 (6 LPI) + ESC O (Cancel bottom margin)
    // We use ESC l 0 (Left margin 0) to maximize printing area
    let init = '\x1b@\x1bP\x1b2\x1bO\x1bl\x00';

    // Set Page Length for Dot Matrix
    if (paperSize === 'wartel' || paperSize === '12x14') {
      // 14cm is approx 5.5 inches. At standard 6 LPI, that's 33 lines.
      init += '\x1bC\x21';
    } else if (paperSize === 'half' || paperSize === '9.5x5.5') {
      // 5.5 inches = 33 lines
      init += '\x1bC\x21';
    } else {
      // Standard 11 inches = 66 lines
      init += '\x1bC\x42';
    }

    textResult = init + textResult + '\x0c';
  }

  return textResult;
};

export const generateOrderReceipt = (order, storeInfo, printerType = '58mm', forceBinary = false, paperSize = 'standard') => {
  const isBluetooth = forceBinary || printerType === 'bluetooth';

  let W = 32;
  if (printerType === '80mm') W = 42;
  else if (printerType === 'inkjet') W = 80;
  else if (printerType === 'lx310') {
    if (paperSize === 'wartel' || paperSize === '12x14') W = 38;
    else if (paperSize === 'half' || paperSize === '9.5x5.5') W = 85;
    else W = 85; // Standard 
  }

  const rightAlign = (left, right) => {
    const sp = W - left.length - right.length;
    return left + ' '.repeat(Math.max(1, sp)) + right;
  };

  if (isBluetooth) {
    const encoder = new EscPosEncoder();
    encoder.initialize();

    // Header
    encoder.align('left').bold(true).size('normal', 'normal');
    const titleLines = wrapText((storeInfo.name || 'FOTOCOPY ABADI JAYA').toUpperCase(), W);
    titleLines.forEach(l => btCenterLine(encoder, l));
    encoder.bold(false).size('normal', 'normal');

    const addressLines = wrapText((storeInfo.address || '').toUpperCase(), W);
    addressLines.forEach(l => btCenterLine(encoder, l));

    if (storeInfo.phone) btCenterLine(encoder, ('Telp: ' + storeInfo.phone).toUpperCase());
    encoder.line('-'.repeat(W));

    // NOTA PEMESANAN Banner
    encoder.newline();
    encoder.invert(true);
    btCenterLine(encoder, ' NOTA PEMESANAN ');
    encoder.invert(false);
    encoder.newline();

    // Info Transaksi
    encoder.line(rightAlign('NO ORDER', `# ${order.orderNo || '-'}`));
    encoder.line(rightAlign('TANGGAL', formatDateTime(order.createdAt || order.date || new Date()).toUpperCase()));
    encoder.line(rightAlign('PELANGGAN', (order.customerName || 'UMUM').toUpperCase()));
    encoder.line('-'.repeat(W));

    // Rincian
    encoder.line(rightAlign('JENIS', (order.type || '-').toUpperCase()));
    encoder.line(rightAlign('JUMLAH', `${order.qty} ${order.unit}`.toUpperCase()));
    encoder.line(rightAlign('SELESAI', formatDate(order.deadline).toUpperCase()));
    encoder.line('-'.repeat(W));

    const descLines = wrapText('RINCIAN: ' + (order.description || '-'), W);
    descLines.forEach(l => encoder.line(l.toUpperCase()));
    const specLines = wrapText('SPECS: ' + (order.specs || '-'), W);
    specLines.forEach(l => encoder.line(l.toUpperCase()));
    encoder.line('-'.repeat(W));

    // Totals
    encoder.bold(true).text(rightAlign('TOTAL', formatRupiah(order.totalPrice))).bold(false).newline();
    if (order.shippingCost > 0) {
      encoder.text(rightAlign('ONGKIR', formatRupiah(order.shippingCost))).newline();
    }
    encoder.text(rightAlign('DP', formatRupiah(order.dpAmount))).newline();
    encoder.line('-'.repeat(W));
    encoder.bold(true).invert(true).text(rightAlign('SISA BAYAR', formatRupiah(order.remaining))).bold(false).invert(false).newline();
    encoder.newline();

    // Footer
    encoder.line('-'.repeat(W)).align('left');
    const footerLines = wrapText((storeInfo.footer || 'Terima kasih telah memesan').toUpperCase(), W);
    footerLines.forEach(l => btCenterLine(encoder, l));

    encoder.newline();
    btCenterLine(encoder, `DICETAK: ${new Date().toLocaleString('id-ID')}`);
    encoder.newline().cut();

    return encoder.encode();
  }

  // --- RAW FALLBACK (LX-310 / Generic) ---
  const boldText = (str) => printerType === 'lx310' ? `\x1bE${str}\x1bF` : str;
  const centerTextExact = (str) => {
    const cleanStr = str.replace(/\x1b[E|F]/g, '');
    const pad = Math.max(0, Math.floor((W - cleanStr.length) / 2));
    return ' '.repeat(pad) + str;
  };
  const lines = [];
  // Add top margin for LX-310
  if (printerType === 'lx310') {
    lines.push('');
    lines.push('');
  }

  // Header
  lines.push(centerTextExact(boldText((storeInfo.name || 'ABADI JAYA').toUpperCase())));
  const addrWrapWidth = Math.min(W, Math.floor(W * 0.8));
  wrapText(storeInfo.address || '', addrWrapWidth).forEach(l => lines.push(centerTextExact(l)));
  if (storeInfo.phone) lines.push(centerTextExact('Telp: ' + storeInfo.phone));
  
  lines.push('='.repeat(W));
  lines.push(centerTextExact(boldText('NOTA PEMESANAN')));
  lines.push('='.repeat(W));

  lines.push(`No Order : ${order.orderNo || order.invoiceNo || '-'}`);
  lines.push(`Tanggal  : ${formatDateTime(order.createdAt || order.date)}`);
  lines.push(`Pelanggan: ${order.customerName || 'Umum'}`);
  lines.push('-'.repeat(W));

  lines.push(boldText(`JENIS: ${order.type?.toUpperCase() || 'CETAK'}`));
  
  const descTitle = 'RINCIAN: ';
  const descLines = wrapText(order.description || '-', W - descTitle.length);
  descLines.forEach((l, i) => lines.push((i === 0 ? descTitle : ' '.repeat(descTitle.length)) + l));

  const specTitle = 'SPECS  : ';
  const specLines = wrapText(order.specs || '-', W - specTitle.length);
  specLines.forEach((l, i) => lines.push((i === 0 ? specTitle : ' '.repeat(specTitle.length)) + l));

  lines.push(`JUMLAH : ${order.qty || 1} ${order.unit || 'PCS'}`);
  lines.push(`SELESAI: ${formatDate(order.deadline).toUpperCase()}`);
  lines.push('-'.repeat(W));

  lines.push(rightAlign('TOTAL HARGA :', formatRupiah(order.totalPrice || order.total || 0)));
  if (order.shippingCost > 0) {
    lines.push(rightAlign('ONGKIR      :', formatRupiah(order.shippingCost)));
  }
  lines.push(rightAlign('DP / BAYAR  :', formatRupiah(order.dpAmount || order.paid || 0)));
  lines.push('-'.repeat(W));
  lines.push(rightAlign(boldText('SISA BAYAR  :'), formatRupiah(order.remaining || ((order.totalPrice || 0) - (order.dpAmount || 0)))));

  lines.push('\n' + centerTextExact(storeInfo.footer || 'Terima kasih telah memesan'));
  lines.push(centerTextExact(`DICETAK: ${formatDateTime(new Date())}`));

  let text = lines.join('\n');

  if (printerType === 'lx310') {
    // Pad text with spaces for left margin on LX-310 (8 spaces for Wartel)
    const margin = paperSize === 'wartel' ? '        ' : '    ';
    text = text.split('\n').map(l => margin + l).join('\n');

    // Standard initialization for LX-310
    let init = '\x1b@\x1bP\x1b2\x1bO\x1bl\x00';
    if (paperSize === 'wartel' || paperSize === '12x14') {
      init += '\x1bC\x21'; // 33 lines for 14cm
    } else if (paperSize === 'half' || paperSize === '9.5x5.5') {
      init += '\x1bC\x21';
    } else {
      init += '\x1bC\x42';
    }
    text = init + text + '\x0c';
  } else {
    text += `\n\n\n\n\n`;
  }

  return text;
};

// Known Bluetooth Serial Port Profile UUIDs for thermal printers
const BT_SERIAL_SERVICE = '000018f0-0000-1000-8000-00805f9b34fb';
const BT_SERIAL_CHAR = '00002af1-0000-1000-8000-00805f9b34fb';
const BT_SPP_SERVICE = '00001101-0000-1000-8000-00805f9b34fb';

// Fallback generic UUIDs used by many Chinese thermal printers
const BT_GENERIC_SERVICE = '0000ff00-0000-1000-8000-00805f9b34fb';
const BT_GENERIC_CHAR = '0000ff02-0000-1000-8000-00805f9b34fb';

// Cache the last connected device to avoid re-scanning
let _cachedBtDevice = null;

export const printViaBluetooth = async (text) => {
  if (!navigator.bluetooth) {
    Swal.fire({
      icon: 'error',
      title: 'Bluetooth Tidak Aktif',
      text: 'Fitur Bluetooth membutuhkan koneksi HTTPS (Secure Context). Jika testing via localhost/IP di HP, aktifkan flag keamanan browser chrome.',
      timer: 5000
    });
    return false;
  }

  try {
    let device = _cachedBtDevice;

    // If no cached device or it's disconnected, scan for a new one
    if (!device || !device.gatt?.connected) {
      device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [BT_SERIAL_SERVICE] },
          { services: [BT_GENERIC_SERVICE] },
          { namePrefix: 'Printer' },
          { namePrefix: 'RPP' },
          { namePrefix: 'BlueTooth' },
          { namePrefix: 'BT' },
          { namePrefix: 'PT-' },
          { namePrefix: 'MPT-' },
          { namePrefix: 'POS' },
        ],
        optionalServices: [BT_SERIAL_SERVICE, BT_GENERIC_SERVICE]
      });
      _cachedBtDevice = device;
    }

    Swal.fire({ title: 'Menghubungkan...', text: `Menyambung ke ${device.name || 'Printer'}`, allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const server = await device.gatt.connect();

    // Try known service/characteristic pairs
    let characteristic = null;
    const tryPairs = [
      { svc: BT_SERIAL_SERVICE, chr: BT_SERIAL_CHAR },
      { svc: BT_GENERIC_SERVICE, chr: BT_GENERIC_CHAR },
    ];

    for (const pair of tryPairs) {
      try {
        const service = await server.getPrimaryService(pair.svc);
        characteristic = await service.getCharacteristic(pair.chr);
        break;
      } catch {
        continue;
      }
    }

    // Fallback: discover all services and find any writable characteristic
    if (!characteristic) {
      const services = await server.getPrimaryServices();
      for (const svc of services) {
        try {
          const chars = await svc.getCharacteristics();
          const writable = chars.find(c => c.properties.write || c.properties.writeWithoutResponse);
          if (writable) { characteristic = writable; break; }
        } catch { continue; }
      }
    }

    if (!characteristic) {
      Swal.close();
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat menemukan channel cetak pada printer ini.', timer: 4000 });
      server.disconnect();
      return false;
    }

    // Encode text to bytes ONLY if it's a string
    let data;
    if (text instanceof Uint8Array) {
      data = text;
    } else {
      const encoder = new TextEncoder();
      data = encoder.encode(text);
    }

    // Send in chunks of 100 bytes (BLE MTU safe)
    const CHUNK = 100;
    for (let i = 0; i < data.length; i += CHUNK) {
      const chunk = data.slice(i, i + CHUNK);
      if (characteristic.properties.writeWithoutResponse) {
        await characteristic.writeValueWithoutResponse(chunk);
      } else {
        await characteristic.writeValue(chunk);
      }
    }

    Swal.close();
    Swal.fire({ icon: 'success', title: 'Berhasil', text: `Nota telah dicetak ke ${device.name || 'Printer Bluetooth'}!`, timer: 2500, showConfirmButton: false });
    return true;

  } catch (err) {
    Swal.close();
    if (err.name === 'NotFoundError') {
      // User cancelled the device picker — do nothing
      return false;
    }
    console.error('Bluetooth print failed:', err);
    Swal.fire({ icon: 'error', title: 'Gagal Cetak', text: err.message || 'Koneksi Bluetooth gagal. Pastikan printer menyala dan terhubung.', timer: 4000 });
    _cachedBtDevice = null; // Clear cache on failure
    return false;
  }
};

// Legacy fallback kept for backward compat
export const printViaRawBT = (text) => {
  try {
    const base64Data = btoa(unescape(encodeURIComponent(text)));
    const intentUrl = `intent:${base64Data}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
    window.location.href = intentUrl;
  } catch (err) {
    console.error('Failed to encode receipt for RawBT:', err);
    Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal encode nota untuk printer Bluetooth', timer: 3000 });
  }
};

// ============================================
// QZ TRAY INTEGRATION (LX-310 / DOT MATRIX)
// ============================================

export const initQZ = async () => {
  if (qz.websocket.isActive()) return true;

  try {
    // Basic config for QZ Tray (unsigned/dev mode)
    // To suppress popups, we would need a proper signing certificate
    await qz.websocket.connect();
    console.log('QZ Tray Connected');
    return true;
  } catch (err) {
    console.warn('QZ Tray not running or connection failed:', err);
    return false;
  }
};

/**
 * List local printers via QZ Tray
 * @returns {Promise<string[]>}
 */
export const listQZPrinters = async () => {
  try {
    const isConnected = await initQZ();
    if (!isConnected) return [];

    return await qz.printers.find();
  } catch (err) {
    console.error('QZ List Printers Error:', err);
    return [];
  }
};

export const printViaQZ = async (data, printerName = 'LX-310') => {
  try {
    const isConnected = await initQZ();
    if (!isConnected) {
      Swal.fire({
        icon: 'warning',
        title: 'QZ Tray Tidak Aktif',
        text: 'Pastikan aplikasi QZ Tray sudah berjalan di komputer ini.',
        confirmButtonText: 'Oke'
      });
      return false;
    }

    // Find the printer
    const printer = await qz.printers.find(printerName);

    // Determine paper dimensions based on paperSize
    let paperSizeConfig = { width: 4.72, height: 5.51 }; // Wartel default
    const pSize = (data && data.paperSize) || 'wartel';

    if (pSize === 'standard' || pSize === '9.5x11') paperSizeConfig = { width: 9.5, height: 11 };
    else if (pSize === 'half' || pSize === '9.5x5.5') paperSizeConfig = { width: 9.5, height: 5.5 };
    else if (pSize === 'wartel' || pSize === '12x14') paperSizeConfig = { width: 4.72, height: 5.51 };

    const config = qz.configs.create(printer, {
      size: paperSizeConfig,
      units: 'in',
      margins: 0, // Removed margins for raw dot matrix printing to avoid misalignment
      interpolation: 'nearest-neighbor'
    });

    // Send raw data (ESC/P or Text) directly to the printer
    // Ensure we only send the raw string data, not the full object
    const rawData = typeof data === 'object' ? (data.data || '') : data;

    const printData = [{
      type: 'raw',
      format: 'plain',
      data: rawData
    }];

    await qz.print(config, printData);

    Swal.fire({
      icon: 'success',
      title: 'Berhasil',
      text: `Nota dikirim ke ${printerName} via QZ Tray!`,
      timer: 2000,
      showConfirmButton: false
    });
    return true;
  } catch (err) {
    console.error('QZ Print Error:', err);
    Swal.fire({
      icon: 'error',
      title: 'Gagal Cetak LX-310',
      text: 'Error: ' + err.message
    });
    return false;
  }
};

export const resizeImage = (file, maxWidth, maxHeight, quality = 0.7) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/webp', quality));
      };
    };
  });
};

