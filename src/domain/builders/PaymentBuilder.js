import Payment from "../Payment.js";

class PaymentBuilder {
    constructor(){
        this.data = {};
    }

    withId(id){
        this.data.id = id;
        return this;
    }

    withOrderId(orderId){
        this.data.orderId = orderId;
        return this;
    }

    withAmount(amount){
        this.data.amount = amount;
        return this;
    }

    withStatus(status){
        this.data.status = status;
        return this;
    }

    withTransactionId(transactionId){
        this.data.transactionId = transactionId;
        return this;
    }

    withCreatedAt(createdAt){
        this.data.createdAt = createdAt;
        return this;
    }

    build(){
        return new Payment(this.data);
    }
}

export default PaymentBuilder;