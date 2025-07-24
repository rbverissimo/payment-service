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

function generateTransactionId(){
    return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

app.post('/payments', async (req, res) => {
    const { orderId, amount } = req.body;

    if(!orderId || !amount){
        return res.status(400).json({message: 'Order ID and amount are required.'});
    }

    try {
        const payment = await processPayment(orderId, amount);
        if(payment.message && payment.message.includes('already exists')) return res.status(409).json(payment);

        return res.status(201).json({message: 'Payment processed successfully', obj: payment});
    } catch (error) {
        return res.status(500).json({message: 'Failed to process payment', error: error.message});
    }
});

async function processPayment(orderId, amount){
    try {
        const existingPayment = await db.query(`SELECT * FROM PAYMENTS WHERE ORDER_ID = $1 ` [orderId]);
        if(existingPayment.rows.length > 0){
            console.log(`Payment for order ${orderId} already exists. Skipping.`);
            return { message: `Payment for order ${orderId} already exists`};
        }

        const transactionId = generateTransactionId();
        const status = 'completed';
        const createdAt = new Date();

        const result = db.query(`INSERT INTO (order_id, amount, status, transaction_id) VALUES ($1, $2, $3, $4, $5) RETURNING *`, 
            [orderId, amount, status, transactionId, createdAt]);

        const payment = result.rows[0];
        console.log('New payment processed and saved into database', payment);

        await kafka.sendMessage(kafka.TOPIC_PAYMENT_PROCESSED, {
            value: JSON.stringify({
                paymentId: payment.id,
                orderId: payment.order_id,
                amount: payment.amount,
                transactionId: payment.transaction_id,
                timestamp: new Date().toISOString()
            })
        });

        return payment;
    } catch (error) {
        console.error(`Error processing payment to Order ${orderId}`, error);
        if(error.code === '23505') {
            console.warn(`Attemped to create duplicate payment to order ${orderId}`);
            return { message: `Payment for order ${orderId} already exists`};
        }
        throw new Error(`Failed to process payment for order ${orderId}: ${error.message}`);
    } finally {
        // db.release(); TODO: manage releasing of the connection into pg
    }
}

async function handleOrderCreatedMessage(orderData){

    if(orderData && orderData.orderId && orderData.total_amount){
        try {
            const result = await processPayment(orderData.orderId, orderData.total_amount);
            if(result.message && result.message.includes('already exists')){
                console.log(`Payment Service: A payment for Order ID ${orderId} has already been successfully processed.`);
            } else {
                console.log(`Payment Service: A payment for OrderID ${orderData.orderId} was successfully processed. `, result);
            }

        } catch (error) {
            console.error(`Payment Service: Failed to process payment for Order ID ${orderData.orderId}`);
        }
    } else {
        console.warn(`PaymentService: Received malformed order-created message: `, orderData);
    }
}

async function startService(){
    try {

        await db.connectDb();
        console.log('PostgreSQL connection successful.');

        await kafka.connectKafka();
        console.log('Kafka connection successful. ');

        await kafka.startConsumer(kafka.TOPIC_ORDER_CREATED, kafka.ORDER_CONSUMER_GROUP_ID, handleOrderCreatedMessage);

        app.listen(3000, () => {
            console.log(`A payment service instance is running on port ${PORT}`);
        });
        
    } catch (error) {
        console.log('Failed to start payment service: ', error);
        process.exit(1);
    }
}

startService();