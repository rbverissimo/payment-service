import { Kafka } from 'kafkajs';

const kafka = new Kafka({
    clientId: 'payment-service',
    brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
});

const producer = kafka.producer();

const BROKER_NAME = 'Kafka';
const TOPIC_PAYMENT_PROCESSED = 'payment-processed';
const TOPIC_ORDER_CREATED = 'order-created';
const ORDER_CONSUMER_GROUP_ID = 'payment-service-order-consumer';

async function connectKafka(){
    try {
        
        await producer.connect();
        console.log('Kafka producer connected.');

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

async function startConsumer(topic, groupId, handler){
    const consumer = kafka.consumer({groupId: groupId});
    try {
        await consumer.connect();
        await consumer.subscribe({topic: topic, fromBeginning: false}); //Avoiding events replay

        await consumer.run({
            eachMessage: async({topic, partition, message}) => {
                try{
                    const payload = JSON.parse(message.value.toString());
                    console.log(`Received message from topic ${topic}: `, payload);
                    await handler(payload);
                } catch (error) {
                    console.error(`Error processing message from topic ${topic}`, error.message, error);
                }
            }
        });
        console.log(`Kafka consumer subscribed to topic ${topic} with group ID ${groupId}`);
    } catch (error) {
        console.error(`Failed to start Kafka consumer for topic ${topic}: `, error);
    }
}

export default {
    connectKafka,
    sendMessage,
    startConsumer,
    TOPIC_PAYMENT_PROCESSED,
    TOPIC_ORDER_CREATED,
    ORDER_CONSUMER_GROUP_ID,
    BROKER_NAME
}
