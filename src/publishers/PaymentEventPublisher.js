import Payment from "../domain/Payment.js";
import kafka from "../kafka.js";

/**
 * @param {*} broker - Takes a broker such as kafka to publish messages into
 */
class PaymentEventPublisher {

    constructor(){
        this.broker = kafka;
    }

    /**
     * 
     * @param {Payment} payment 
     */
    async publishPaymentProcessed(payment){
        const eventPayload = {
            paymentId: payment.id,
            orderId: payment.orderId,
            amount: payment.amount,
            transactionId: payment.transactionId,
            timestamp: new Date().toISOString()
        };

        try {
            await this.broker.sendMessage(this.broker.TOPIC_PAYMENT_PROCESSED, {value: JSON.stringify(eventPayload)});
            console.log(`PaymentEventPublisher: Payment ${payment.id} processed successfully published into ${this.broker.TOPIC_PAYMENT_PROCESSED} topic using ${this.broker.BROKER_NAME}`);
        } catch (error) {
            console.error(`PaymentEventPublisher: Publishing Payment ${payment.id} for Order ${payment.orderId} processed into ${this.broker.BROKER_NAME} failed. Known reason: `, error.message);   
        }
    }

}

export default PaymentEventPublisher;