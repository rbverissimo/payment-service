import PaymentBuilder from "../domain/builders/PaymentBuilder.js";
import Payment from "../domain/Payment.js";
import PaymentEventPublisher from "../publishers/PaymentEventPublisher.js";
import PaymentRepository from "../repositories/PaymentRepository.js";

class PaymentService {

    /**
     * 
     * @param {PaymentRepository} paymentRepository 
     * @param {PaymentEventPublisher} paymentEventPublisher 
     */
    constructor(paymentRepository, paymentEventPublisher){
        this.paymentRepository = paymentRepository;
        this.paymentEventPublisher = paymentEventPublisher;
    }

    _generateTransactionId(){
        return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    /**
     * 
     * @param {number} orderId 
     * @param {number} amount 
     * @returns {Promise<Payment|Object>}
     */
    async processPayment(orderId, amount){
        try {
            
            const existingPayment = await this.paymentRepository.existsByOrderId(orderId);
            if(existingPayment) {
                console.log(`PaymentService: Payment for Order ID ${orderId} has already been processed.`);
                return {message: `Payment for Order ID ${orderId} has already been processed.` };
            }

            const transactionId = this._generateTransactionId();
            const status = 'completed';

            const paymentToCreate = new PaymentBuilder()
                .withOrderId(orderId)
                .withAmount(amount)
                .withTransactionId(transactionId)
                .withStatus(status)
                .build();

            
            console.log('generated a payment to create', paymentToCreate);
            
            const newPayment = await this.paymentRepository.create(paymentToCreate);
            console.log(`PaymentService: New payment saved into database with ID ${newPayment.id}, transaction number ${newPayment.transactionId}`);

            await this.paymentEventPublisher.publishPaymentProcessed(newPayment);
            return newPayment;
        } catch (error) {
            console.log(`PaymentService: Payment to Order ID ${orderId} couldn't be processed. `, error.message);
            throw new Error(`PaymentService: Failed to process payment for order ${orderId}: ${error.message}`);
        }

    }

}

export default PaymentService;