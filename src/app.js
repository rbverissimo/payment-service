import express from 'express';
import db from './database.js';

const app = express();

app.get('/health', (req, res) => {
    res.status(200).send('Payment service is up and running');
});

async function startService(){
    try {

        await db.connectDb();
        console.log('PostgreSQL connection successful.');

        app.listen(3000, () => {
            console.log('A payment service instance is running on port 3000');
        });
        
    } catch (error) {
        console.log('Failed to start payment service: ', error);
        process.exit(1);
    }
}

startService();