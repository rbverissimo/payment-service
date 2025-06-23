import express from 'express';
import bodyParser from 'body-parser';
import db from './database.js';

const app = express();
const PORT = process.env.PORT || 3000;
app.use(bodyParser.json());

app.get('/health', (req, res) => {
    res.status(200).send('Payment service is up and running');
});

async function startService(){
    try {

        await db.connectDb();
        console.log('PostgreSQL connection successful.');

        app.listen(3000, () => {
            console.log(`A payment service instance is running on port ${PORT}`);
        });
        
    } catch (error) {
        console.log('Failed to start payment service: ', error);
        process.exit(1);
    }
}

startService();