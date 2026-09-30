const productService = require('../services/productService');
const { invalidateCache } = require('../middleware/cacheMiddleware');

async function getAllProducts(req, res) {
    try {
        const products = await productService.getAllProducts();
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products', message: err.message });
    }
}

async function getProductById(req, res) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }
        const product = await productService.getProductById(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch product', message: err.message });
    }
}

async function createProduct(req, res) {
    try {
        const { name, price } = req.body;
        if (!name || price === undefined) {
            return res.status(400).json({ error: 'Name and price are required' });
        }
        const product = await productService.createProduct({ name, price });
        invalidateCache();
        res.status(201).json({ message: 'Product created successfully', product });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
}

async function updateProduct(req, res) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }
        const { name, price } = req.body;
        if (!name || price === undefined) {
            return res.status(400).json({ error: 'Name and price are required' });
        }
        const product = await productService.updateProduct(id, { name, price });
        invalidateCache();
        res.status(200).json({ message: 'Product updated successfully', product });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
}

async function patchProduct(req, res) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }
        const { name, price } = req.body;
        if (name === undefined && price === undefined) {
            return res.status(400).json({ error: 'At least one field is required' });
        }
        const product = await productService.patchProduct(id, { name, price });
        invalidateCache();
        res.status(200).json({ message: 'Product patched successfully', product });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
}

async function deleteProduct(req, res) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }
        const product = await productService.deleteProduct(id);
        invalidateCache();
        res.status(200).json({ message: 'Product deleted successfully', product });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
}

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    patchProduct,
    deleteProduct
};
