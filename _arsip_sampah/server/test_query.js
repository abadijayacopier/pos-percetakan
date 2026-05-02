const { pool } = require('./config/database');

pool.query(`SELECT p.id, p.code, p.name, p.category_id as categoryId, 
             p.buy_price as buyPrice, p.sell_price as sellPrice, 
             p.stock, p.min_stock as minStock, p.unit, p.emoji,
             c.name as category_name, c.emoji as category_emoji 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id`)
    .then(([rows]) => { console.log('Products:', rows.length); process.exit(0); })
    .catch(e => { console.error('DB_ERROR:', e.message); process.exit(1); });
