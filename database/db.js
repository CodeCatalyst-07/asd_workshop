const fs = require('fs/promises');
const path = require('path');

const dbPath = path.join(__dirname, 'db.json');
const rootDbPath = path.join(__dirname, '..', 'db.json');

async function readData() {
    try {
        const data = await fs.readFile(dbPath, 'utf-8');
        return data ? JSON.parse(data) : [];
    } catch {
        const data = await fs.readFile(rootDbPath, 'utf-8');
        return data ? JSON.parse(data) : [];
    }
}

async function writeData(data) {
    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(dbPath, content, 'utf-8');
    try {
        await fs.writeFile(rootDbPath, content, 'utf-8');
    } catch {}
}

const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

async function findAll() {
    await delay();
    return await readData();
}

async function findById(id) {
    await delay();
    const products = await readData();
    return products.find((item) => item.id === Number(id)) || null;
}

async function create(data) {
    const products = await readData();
    const newId = products.length ? Math.max(...products.map((p) => p.id || 0)) + 1 : 1;
    const newProduct = {
        id: newId,
        name: data.name,
        price: Number(data.price)
    };
    products.push(newProduct);
    await writeData(products);
    return newProduct;
}

async function update(id, data) {
    const products = await readData();
    const index = products.findIndex((item) => item.id === Number(id));
    if (index === -1) return null;

    products[index] = {
        id: Number(id),
        name: data.name,
        price: Number(data.price)
    };
    await writeData(products);
    return products[index];
}

async function patch(id, data) {
    const products = await readData();
    const index = products.findIndex((item) => item.id === Number(id));
    if (index === -1) return null;

    if (data.name !== undefined) products[index].name = data.name;
    if (data.price !== undefined) products[index].price = Number(data.price);

    await writeData(products);
    return products[index];
}

async function remove(id) {
    const products = await readData();
    const index = products.findIndex((item) => item.id === Number(id));
    if (index === -1) return null;

    const [deleted] = products.splice(index, 1);
    await writeData(products);
    return deleted;
}

module.exports = {
    findAll,
    findById,
    create,
    update,
    patch,
    remove
};
