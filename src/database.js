import { Pool } from 'pg';

const pool = new Pool({
    user: process.env.DB_USER || 'paymentuser',
    host: process.env.DB_HOST || 'payment_db',
    database: process.env.DB_NAME || 'payment_db',
    password: process.env.DB_PASSWORD || 'paymentpassword',
    port: process.env.DB_PORT || 5432
});

pool.on('error', (err, client) => {
    console.log('Unexpected error ', err);
    process.exit(-1);
});

async function connectDb() {
    try {

        await pool.query('SELECT NOW()');
        console.log('Connected to database!');

        await pool.query(`
        CREATE TABLE IF NOT EXISTS payments (
            id SERIAL PRIMARY KEY,
            order_id VARCHAR(255) UNIQUE NOT NULL,
            amount NUMERIC(10, 2) NOT NULL,
            status VARCHAR(50) NOT NULL,
            transaction_id VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log('Payments table successfully created!');
        
    } catch (error) {
        console.error('Failed to connect to database', error.message);
        process.exit(-1);
    }
}

export default {
    query: (text, params) => pool.query(text, params),
    connectDb,
    pool
}