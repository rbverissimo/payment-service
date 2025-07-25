import express from 'express';
import bodyParser from 'body-parser';
import db from './database.js';
import kafka from './kafka.js';
import PaymentRepository from './repositories/PaymentRepository.js';
import PaymentEventPublisher from './publishers/PaymentEventPublisher.js';
import PaymentService from './services/PaymentService.js';

const app = express();
const PORT = process.env.PORT || 3000;
app.use(bodyParser.json());

const paymentRepository = new PaymentRepository(db.pool);
const paymentEventPublisher = new PaymentEventPublisher();
const paymentService = new PaymentService(paymentRepository, paymentEventPublisher);


app.get('/health', (req, res) => {
    res.status(200).send('Payment service is up and running');
});

app.post('/payments', async (req, res) => {
    const { orderId, amount } = req.body;

    if(!orderId || !amount){
        return res.status(400).json({message: 'Order ID and amount are required.'});
    }

    try {
        const payment = await paymentService.processPayment(orderId, amount);
        if(payment.message && payment.message.includes('already')) return res.status(409).json(payment);

        return res.status(201).json({message: 'Payment processed successfully', obj: payment});
    } catch (error) {
        return res.status(500).json({message: 'Failed to process payment', error: error.message});
    }
});

async function handleOrderCreatedMessage(orderData){

    if(orderData && orderData.orderId && orderData.total_amount){
        try {
            const result = await paymentService.processPayment(orderData.orderId, orderData.total_amount);
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