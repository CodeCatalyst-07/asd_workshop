const db = require('../database/db');

async function getAllProducts() {
    return await db.findAll();
}

async function getProductById(id) {
    return await db.findById(id);
}

async function createProduct(data) {
    if (!data?.name || data?.price === undefined) {
        const error = new Error('Name and price are required');
        error.status = 400;
        throw error;
    }

    const price = Number(data.price);
    if (isNaN(price) || price < 0) {
        const error = new Error('Price must be a valid number');
        error.status = 400;
        throw error;
    }

    return await db.create({
        name: data.name.trim(),
        price
    });
}

async function updateProduct(id, data) {
    if (!data?.name || data?.price === undefined) {
        const error = new Error('Name and price are required');
        error.status = 400;
        throw error;
    }

    const price = Number(data.price);
    if (isNaN(price) || price < 0) {
        const error = new Error('Price must be a valid number');
        error.status = 400;
        throw error;
    }

    const updated = await db.update(id, {
        name: data.name.trim(),
        price
    });

    if (!updated) {
        const error = new Error('Product not found');
        error.status = 404;
        throw error;
    }

    return updated;
}

async function patchProduct(id, data) {
    if (!data || (data.name === undefined && data.price === undefined)) {
        const error = new Error('At least one field is required');
        error.status = 400;
        throw error;
    }

    const payload = {};
    if (data.name !== undefined) {
        if (typeof data.name !== 'string' || !data.name.trim()) {
            const error = new Error('Invalid product name');
            error.status = 400;
            throw error;
        }
        payload.name = data.name.trim();
    }

    if (data.price !== undefined) {
        const price = Number(data.price);
        if (isNaN(price) || price < 0) {
            const error = new Error('Price must be a valid number');
            error.status = 400;
            throw error;
        }
        payload.price = price;
    }

    const patched = await db.patch(id, payload);
    if (!patched) {
        const error = new Error('Product not found');
        error.status = 404;
        throw error;
    }

    return patched;
}

async function deleteProduct(id) {
    const deleted = await db.remove(id);
    if (!deleted) {
        const error = new Error('Product not found');
        error.status = 404;
        throw error;
    }
    return deleted;
}

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    patchProduct,
    deleteProduct
};
