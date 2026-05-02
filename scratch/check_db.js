const mysql = require('mysql2/promise');
async function check() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'abadijaya',
        database: 'pos_percetakan'
    });
    try {
        const [tables] = await connection.query('SHOW TABLES');
        console.log('Tables:', tables);
        
        const [ordersDesc] = await connection.query('DESCRIBE orders');
        console.log('Orders Table:', ordersDesc);

        const [printOrdersDesc] = await connection.query('DESCRIBE print_orders');
        console.log('Print Orders Table:', printOrdersDesc);

        const [results] = await connection.query(`
            SELECT customer_id, SUM(total_harga) as sum_val FROM orders GROUP BY customer_id LIMIT 5
        `);
        console.log('Sample Data Orders:', results);
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}
check();
