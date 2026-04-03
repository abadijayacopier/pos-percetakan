import Swal from 'sweetalert2';
import EscPosEncoder from 'esc-pos-encoder';


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

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    // Try to clean/extract if it's already a partial string or contains "Invalid Date"
    if (typeof dateStr === 'string' && !dateStr.includes('Invalid')) return dateStr;
    return new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
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

export const generateRawReceipt = (receipt, storeInfo, printerType = '58mm', forceBinary = false) => {
  const isBluetooth = forceBinary || printerType === 'bluetooth';
  const W = printerType === '80mm' ? 42 : printerType === 'lx310' ? 36 : printerType === 'inkjet' ? 60 : 32;

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

  if (isBluetooth) {
    const encoder = new EscPosEncoder();
    encoder.initialize();

    // Header (Center)
    encoder.align('center')
      .bold(true).size('normal', 'normal') // Try bold default size
      .line((storeInfo.name || 'FOTOCOPY ABADI JAYA').toUpperCase())
      .bold(false).size('normal', 'normal');

    const addressLines = wrapText(storeInfo.address || '', W);
    addressLines.forEach(l => encoder.line(l));

    if (storeInfo.phone) encoder.line('Telp: ' + storeInfo.phone);
    encoder.line('-'.repeat(W)).align('left');

    // Info Transaksi
    encoder.line(`No      : ${receipt.invoiceNo || '-'}`);
    encoder.line(`Tanggal : ${safeDate}`);
    encoder.line(`Kasir   : ${receipt.userName || storeInfo.userName || 'Kasir'}`);
    if (receipt.customerName && receipt.customerName !== 'Umum') {
      encoder.line(`Customer: ${receipt.customerName}`);
    }
    encoder.line('-'.repeat(W));

    // Items
    const items = receipt.items || [];
    items.forEach(item => {
      const qty = item.qty ?? item.quantity ?? 1;
      const subtotal = item.total ?? item.subtotal ?? 0;
      // Extract proper unit price:
      let price = item.price ?? item.sellPrice ?? item.unit_price ?? item.harga_satuan ?? 0;
      if (price === 0 && subtotal > 0 && qty > 0) price = Math.round(subtotal / qty);

      const nameLines = wrapText(item.name || item.desc || 'Item', W);
      nameLines.forEach(l => encoder.line(l));

      const leftPart = `  ${qty}x ${formatRupiah(price)}`;
      const rightPart = formatRupiah(subtotal);
      const sp = W - leftPart.length - rightPart.length;
      encoder.line(leftPart + ' '.repeat(sp > 0 ? sp : 1) + rightPart);
    });
    encoder.line('-'.repeat(W));

    // Totals
    const rightAlign = (left, right) => {
      const sp = W - left.length - right.length;
      return left + ' '.repeat(sp > 0 ? sp : 1) + right;
    };

    const subtotalTx = receipt.subtotal ?? items.reduce((acc, item) => acc + (item.total ?? item.subtotal ?? ((item.qty ?? item.quantity ?? 1) * (item.price ?? item.sellPrice ?? 0))), 0);
    const totalTx = receipt.total ?? (subtotalTx - (receipt.discount ?? 0));

    if ((receipt.discount ?? 0) > 0) {
      encoder.line(rightAlign('Subtotal :', formatRupiah(subtotalTx)));
      encoder.line(rightAlign('Diskon   :', '-' + formatRupiah(receipt.discount)));
    }
    encoder.bold(true).line(rightAlign('TOTAL    :', formatRupiah(totalTx))).bold(false);
    encoder.line(rightAlign('BAYAR    :', formatRupiah(receipt.paid ?? totalTx)));
    if ((receipt.change ?? 0) > 0) {
      encoder.line(rightAlign('KEMBALI  :', formatRupiah(receipt.change)));
    }
    if (receipt.paymentType) {
      encoder.line(rightAlign('Metode   :', (receipt.paymentType).toUpperCase()));
    }

    // Footer
    encoder.line('-'.repeat(W)).align('center')
      .line(storeInfo.footer || 'Terima kasih atas kunjungan Anda!')
      .newline().newline().newline().newline().newline().newline().newline().newline().cut();

    return encoder.encode();
  }

  // --- FALLBACK: RAW TEXT (LX-310 / Inkjet) ---
  const ESC = '\x1b';
  const BOLD_ON = ESC + 'E';
  const BOLD_OFF = ESC + 'F';
  const boldText = (t) => (printerType === 'lx310' ? BOLD_ON + t + BOLD_OFF : t);

  const MARGIN = printerType === 'lx310' ? '  ' : '';
  const centerText = (str) => {
    const pad = Math.max(0, Math.floor((W - str.length) / 2));
    return ' '.repeat(pad) + str;
  };
  const rightAlignText = (left, right) => {
    const sp = W - left.length - right.length;
    return left + ' '.repeat(sp > 0 ? sp : 1) + right;
  };

  const lines = [];
  lines.push(centerText(boldText((storeInfo.name || 'FOTOCOPY ABADI JAYA').toUpperCase())));
  const addressLinesRaw = wrapText(storeInfo.address || '', W);
  addressLinesRaw.forEach(l => lines.push(centerText(l)));

  if (storeInfo.phone) lines.push(centerText('Telp: ' + storeInfo.phone));

  if (printerType === 'lx310' || printerType === 'inkjet') {
    lines.push('='.repeat(W));
    lines.push(centerText(boldText('NOTA PEMBAYARAN')));
    lines.push('='.repeat(W));
  } else {
    lines.push('-'.repeat(W));
  }

  lines.push(`No      : ${receipt.invoiceNo || '-'}`);
  lines.push(`Tanggal : ${safeDate}`);
  lines.push(`Kasir   : ${receipt.userName || storeInfo.userName || 'Kasir'}`);
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

  lines.push('-'.repeat(W));
  lines.push(centerText(storeInfo.footer || 'Terima kasih atas kunjungan Anda!'));
  lines.push('');
  lines.push(`Dicetak: ${new Date().toLocaleString('id-ID')}`);

  let textResult = lines.map(l => MARGIN + l).join('\n') + '\n';
  if (printerType === 'lx310') {
    // For Dot Matrix LX-310, we feed and then Form Feed to hit the next perforation
    textResult += '\n\n\n\n\n\n\n\n\n\n\n\x0c';
  } else {
    // For Thermal, usually 6-8 lines is enough to reach the cutter
    textResult += '\n\n\n\n\n\n\n\n';
  }

  return textResult;
};

export const generateOrderReceipt = (order, storeInfo, printerType = '58mm', forceBinary = false) => {
  const isBluetooth = forceBinary || printerType === 'bluetooth';
  const W = printerType === '80mm' ? 42 : printerType === 'lx310' ? 36 : printerType === 'inkjet' ? 60 : 32;

  if (isBluetooth) {
    const encoder = new EscPosEncoder();
    encoder.initialize();

    encoder.align('center')
      .line(storeInfo.name.toUpperCase())
      .text(storeInfo.address).newline()
      .text('Telp: ' + storeInfo.phone).newline()
      .line('-'.repeat(W))
      .align('left')
      .text(`No Order : ${order.orderNo}`).newline()
      .text(`Tanggal  : ${formatDateTime(order.createdAt || order.date || new Date())}`).newline()
      .text(`Pelanggan: ${order.customerName}`).newline()
      .line('-'.repeat(W))
      .text(`Jenis  : ${order.type}`).newline()
      .text(`Rincian: ${(order.description || '-')}`).newline()
      .text(`Specs  : ${(order.specs || '-')}`).newline()
      .text(`Jumlah : ${order.qty} ${order.unit}`).newline()
      .text(`Selesai: ${formatDate(order.deadline)}`).newline()
      .line('-'.repeat(W));

    const rightAlign = (left, right) => {
      const sp = W - left.length - right.length;
      return left + ' '.repeat(sp > 0 ? sp : 1) + right;
    };

    encoder.bold(true).text(rightAlign('Total  :', formatRupiah(order.totalPrice))).bold(false).newline();
    if (order.shippingCost > 0) {
      encoder.text(rightAlign('Ongkir :', formatRupiah(order.shippingCost))).newline();
    }
    encoder.text(rightAlign('DP     :', formatRupiah(order.dpAmount))).newline();
    encoder.bold(true).text(rightAlign('SISA   :', formatRupiah(order.remaining))).bold(false).newline();

    encoder.line('-'.repeat(W)).align('center')
      .text(storeInfo.footer || 'Terima kasih telah memesan').newline()
      .newline().newline().newline().newline().newline().newline().newline().newline().cut();

    return encoder.encode();
  }

  // --- RAW FALLBACK ---
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
  text += `Rincian: ${(order.description || '-').substring(0, W)}\n`;
  text += `Specs  : ${(order.specs || '-').substring(0, W)}\n`;
  text += `Jumlah : ${order.qty} ${order.unit}\n`;
  text += `Selesai: ${formatDate(order.deadline)}\n`;
  text += `-`.repeat(W) + `\n`;

  const padR = (l, r) => {
    const sp = W - l.length - r.length;
    return l + ' '.repeat(sp > 0 ? sp : 1) + r;
  };

  text += padR('Total  :', formatRupiah(order.totalPrice)) + '\n';
  if (order.shippingCost > 0) {
    text += padR('Ongkir :', formatRupiah(order.shippingCost)) + '\n';
  }
  text += padR('DP     :', formatRupiah(order.dpAmount)) + '\n';
  text += padR('SISA   :', formatRupiah(order.remaining)) + '\n';

  text += `\n`;
  text += `${storeInfo.footer || 'Terima kasih telah memesan'}\n`;
  text += `\n\n\n\n\n\n\n\n`;
  if (printerType === 'lx310') text += '\x0c';

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
    Swal.fire({ icon: 'error', title: 'Tidak Didukung', text: 'Browser ini tidak mendukung Bluetooth. Gunakan Chrome di Android.', timer: 4000 });
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
