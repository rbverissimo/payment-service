const express = require('express');

const app = express();

app.get('/health', (req, res) => {
    res.status(200).send('Payment service is up and running');
});

