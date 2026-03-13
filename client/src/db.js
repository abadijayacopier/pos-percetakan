// ============================================
// LOCAL DATA LAYER — POS FOTOCOPY ABADI JAYA
// Temporary localStorage until backend is ready
// ============================================

const DB_PREFIX = 'pos_abadi_';

const db = {
    getAll(table) {
        const data = localStorage.getItem(DB_PREFIX + table);
        return data ? JSON.parse(data) : [];
    },

    setAll(table, data) {
        localStorage.setItem(DB_PREFIX + table, JSON.stringify(data));
    },

    getById(table, id) {
        return this.getAll(table).find(item => item.id === id) || null;
    },

    insert(table, record) {
        const data = this.getAll(table);
        record.id = record.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 9));
        record.createdAt = record.createdAt || new Date().toISOString();
        record.updatedAt = new Date().toISOString();
        data.push(record);
        this.setAll(table, data);
        return record;
    },

    update(table, id, updates) {
        const data = this.getAll(table);
        const idx = data.findIndex(item => item.id === id);
        if (idx === -1) return null;
        data[idx] = { ...data[idx], ...updates, updatedAt: new Date().toISOString() };
        this.setAll(table, data);
        return data[idx];
    },

    delete(table, id) {
        const data = this.getAll(table).filter(item => item.id !== id);
        this.setAll(table, data);
    },

    count(table) {
        return this.getAll(table).length;
    },

    clear(table) {
        localStorage.removeItem(DB_PREFIX + table);
    },

    exportAll() {
        const tables = ['users', 'categories', 'products', 'customers', 'suppliers', 'transactions', 'transaction_details', 'print_orders', 'service_orders', 'cash_flow', 'stock_movements', 'activity_log', 'settings', 'fotocopy_prices', 'binding_prices', 'print_prices'];
        const backup = {};
        tables.forEach(t => { backup[t] = this.getAll(t); });
        backup._exportedAt = new Date().toISOString();
        return JSON.stringify(backup, null, 2);
    },

    importAll(jsonStr) {
        const backup = JSON.parse(jsonStr);
        Object.keys(backup).forEach(key => {
            if (key.startsWith('_')) return;
            this.setAll(key, backup[key]);
        });
    },

    logActivity(userName, action, detail) {
        this.insert('activity_log', {
            timestamp: new Date().toISOString(),
            userName: userName || 'System',
            action,
            detail
        });
    }
};

export default db;
