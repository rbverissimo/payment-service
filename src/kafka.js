import { Kafka } from 'kafkajs';

const kafka = new Kafka({
    clientId: 'payment-service',
    brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
});

const producer = kafka.producer();
const consumer = kafka.consumer({groupId: 'payment-group'});

const TOPIC_PAYMENT_PROCESSED = 'payment-processed';
const TOPIC_ORDER_CREATED = 'order-created';

async function connectKafka(){
    try {
        
        await producer.connect();
        console.log('Kafka producer connected.');
        
        await consumer.connect();
        console.log('Kafka consumer connected.');

        await consumer.subscribe({topic: TOPIC_ORDER_CREATED, fromBeginning: true});

        await consumer.run({
            eachMessage: async ({topic, partition, message}) => {
               console.log({
                value: message.value.toString(),
                topic, 
                partition
               });
               
               if(topic === TOPIC_ORDER_CREATED){
                try {
                    const orderData = JSON.parse(message.value.toString());
                    console.log(`Received order-created event for order: ${orderData.orderId}`);
                } catch (error) {
                    console.error(`Error parsing message from order-created event`, error);
                }
               }
            }
        });
        console.log('Kafka consumer subscribed and running.');
    } catch (error) {
        console.error('Failed to connect to Kafka:', error.message);
    }
}

async function sendMessage(topic, messages){
    try {
        await producer.send({
            topic,
            messages: Array.isArray(messages) ? messages : [messages]
        });
        console.log(`Message successfully sent to topic ${topic}`, messages);
    } catch (error) {
        console.error(`Error sending message to topic ${topic}`);
    }
}

export default {
    connectKafka,
    sendMessage,
    TOPIC_PAYMENT_PROCESSED
}
