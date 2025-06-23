import express from 'express';
import bodyParser from 'body-parser';
import db from './database.js';
import kafka from './kafka.js';

const app = express();
const PORT = process.env.PORT || 3000;
app.use(bodyParser.json());

app.get('/health', (req, res) => {
    res.status(200).send('Payment service is up and running');
});

app.post('/payments', async (req, res) => {
    const { orderId, amount } = req.body;

    if(!orderId || !amount){
        return res.status(400).json({message: 'Order ID and amount are required.'});
    }

    try {
        
        const status = 'completed';
        const transaction_id = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const result = await db.query(
            'INSERT INTO payments(order_id, amount, status, transaction_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [orderId, amount, status, transaction_id]
        )

        const payment = result.rows[0];
        console.log('New payment processed and saved into database: ', payment);

        return res.status(202).json({message: 'Payment processed successfully', obj: payment});
    } catch (error) {
        
    }

});

async function startService(){
    try {

        await db.connectDb();
        console.log('PostgreSQL connection successful.');

        await kafka.connectKafka();
        console.log('Kafka connection successful. ');

        app.listen(3000, () => {
            console.log(`A payment service instance is running on port ${PORT}`);
        });
        
    } catch (error) {
        console.log('Failed to start payment service: ', error);
        process.exit(1);
    }
}

startService();