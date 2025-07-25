import PaymentBuilder from '../domain/builders/PaymentBuilder.js';
import Payment from '../domain/Payment.js';

class PaymentRepository {

    /**
     * 
     * @param {import('pg').Pool} pool 
     */
    constructor(pool){
        this.pool = pool
    }

    _rowToPayment(dbrow){
        if(!dbrow) return null;

        return new PaymentBuilder()
            .withId(dbrow.id)
            .withOrderId(dbrow.order_id)
            .withAmount(dbrow.amount)
            .withStatus(dbrow.status)
            .withTransactionId(dbrow.transaction_id)
            .withCreatedAt(dbrow.created_at)
            .build();
    }

    /**
     * 
     * @param {number} orderId - The referred Order ID 
     * @returns {Promise<boolean>} - True if payment already exists  
     */
    async existsByOrderId(orderId){
        let client;
        try {
            client = await this.pool.connect();
            const query = 'SELECT 1 FROM PAYMENTS WHERE ORDER_ID = $1';
            const res = await client.query(query, [orderId]);
            return res.rows.length > 0;
        } catch (error) {
            console.error(`PaymentRepository: Could not fetch Payment by Order ID ${orderId} on database`, error);
            throw error;
        } finally{
            if(client) client.release();
        }
    }

    /**
     * 
     * @param {Payment} payment 
     * @returns {Promise<Payment>}
     */
    async create(payment){
        let client;
        try {
            client = await this.pool.connect();
            const query = `INSERT INTO PAYMENTS (ORDER_ID, AMOUNT, STATUS, TRANSACTION_ID) 
                            VALUES ($1, $2, $3, $4) 
                            RETURNING *
            `;

            const res = await client.query(query, [payment.orderId, payment.amount, payment.status, payment.transactionId]);
            return this._rowToPayment(res.rows[0]);
        } catch (error) {
            console.error(`Payment Repository: Error creating a payment for Order ID ${payment.orderId}`, error);
            throw error;
        } finally {
            if(client) client.release();
        }
    }
}

export default PaymentRepository;