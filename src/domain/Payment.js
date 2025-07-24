class Payment {
 
    /**
     * 
     * @param {Object} data
     * @param {number} data.id
     * @param {string} data.orderId 
     * @param {number} data.amount
     * @param {string} data.status
     * @param {string} data.transactionId
     * @param {Date} data.createdAt 
     */
    constructor({id, orderId, amount, status, transactionId, createdAt}){
        this.id = id;
        this.orderId = orderId;
        this.amount = amount;
        this.status = status;
        this.transactionId = transactionId;
        this.createdAt = createdAt || new Date();
    }

}

export default Payment;