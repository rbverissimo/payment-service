const PaymentBuilder = require('../PaymentBuilder').default;

describe('PaymentBuilder', () => {
    it('should build a Payment object with all required fields', () => {
        const orderId = 'order123';
        const amount = 100.50;
        const transactionId = 'txn456';
        const status = 'COMPLETED';
        const createdAt = new Date();

        const payment = new PaymentBuilder()
        .withOrderId(orderId)
        .withAmount(amount)
        .withTransactionId(transactionId)
        .withStatus(status)
        .build();

        expect(payment).toEqual({
        orderId,
        amount,
        transactionId,
        status,
        createdAt
        });
    });
});