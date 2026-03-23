const fs = require('fs');
let c = fs.readFileSync('d:/WEB/pos/client/src/pages/DashboardPage.jsx', 'utf8');
c = c.replace(/blue-([0-9]+)/g, 'cyan-$1');
c = c.replace(/#3b82f6/g, '#0891b2');

// Add font-code to specific high-visibility numbers
// 1. Stat cards
c = c.replace(/<h3 className="text-2xl font-black italic tracking-tighter mt-1 text-slate-900 dark:text-white relative z-10">\{s\.value\}<\/h3>/g, '<h3 className="font-code text-2xl font-black italic tracking-tighter mt-1 text-slate-900 dark:text-white relative z-10">{s.value}</h3>');

// 2. Transaksi Terakhir (Invoice No & Total)
c = c.replace(/<span className="font-black text-slate-900 dark:text-white group-hover:text-cyan-600 uppercase tracking-tighter italic transition-colors">/g, '<span className="font-code font-black text-slate-900 dark:text-white group-hover:text-cyan-600 uppercase tracking-tighter italic transition-colors">');
c = c.replace(/<div className="font-black text-slate-900 dark:text-white tracking-widest text-sm italic">\{formatRupiah\(trx\.total \|\| 0\)\}<\/div>/g, '<div className="font-code font-black text-slate-900 dark:text-white tracking-widest text-sm italic">{formatRupiah(trx.total || 0)}</div>');

fs.writeFileSync('d:/WEB/pos/client/src/pages/DashboardPage.jsx', c);
console.log("Colors and fonts replaced securely.");
