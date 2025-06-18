import express from 'express';

const app = express();

app.get('/health', (req, res) => {
    res.status(200).send('Payment service is up and running');
});

async function startService(){
    app.listen(3000, () => {
        console.log('A payment service instance is running on port 3000');
    });
}

startService();