const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '../..');

test('critical backend route files are valid JavaScript', () => {
  const files = [
    'server/routes/transactions.js',
    'server/routes/orders.js',
    'server/routes/dp_tasks.js',
    'server/routes/reports.js',
    'server/routes/finance.js'
  ];
  for (const file of files) {
    execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' });
  }
});

test('transaction void preserves the record and writes a refund ledger entry', () => {
  const src = fs.readFileSync(path.join(root, 'server/routes/transactions.js'), 'utf8');
  assert.match(src, /UPDATE transactions SET status = "void"/);
  assert.match(src, /'Void\/Refund'/);
  assert.doesNotMatch(src, /DELETE FROM transactions WHERE id = \?/);
});

test('transaction edits reconcile old and new stock', () => {
  const src = fs.readFileSync(path.join(root, 'server/routes/transactions.js'), 'utf8');
  assert.match(src, /SELECT product_id, qty FROM transaction_details/);
  assert.match(src, /UPDATE products SET stock = stock \+ \?/);
  assert.match(src, /UPDATE products SET stock = stock - \?/);
  assert.match(src, /Edit Transaksi POS/);
});

test('order cancellation reverses material and DP', () => {
  const src = fs.readFileSync(path.join(root, 'server/routes/orders.js'), 'utf8');
  assert.match(src, /UPDATE materials SET stok_saat_ini = stok_saat_ini \+ \?/);
  assert.match(src, /'Void\/Refund'/);
  assert.match(src, /SET ps\.status = 'batal'/);
});

test('reconciliation endpoints exist', () => {
  const src = fs.readFileSync(path.join(root, 'server/routes/reports.js'), 'utf8');
  assert.match(src, /router\.get\('\/reconciliation'/);
  assert.match(src, /router\.get\('\/stock-reconciliation'/);
});
