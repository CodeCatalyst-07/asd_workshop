const express = require('express');
const productRoutes = require('./routes/productRoutes');
const { getCacheState } = require('./middleware/cacheMiddleware');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Welcome to the Store API! Visit /products to view all items.');
});

app.get('/cache-status', (req, res) => {
    res.status(200).json(getCacheState());
});

app.use('/products', productRoutes);

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
}

module.exports = app;