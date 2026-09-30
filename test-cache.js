const http = require('http');
const app = require('./server');
const { invalidateCache, __setCacheEntryForTesting } = require('./middleware/cacheMiddleware');

const server = http.createServer(app);

function request(options, body = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch {
                    parsed = data;
                }
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    data: parsed
                });
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(typeof body === 'string' ? body : JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;

    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`PASS: ${message}`);
            passed++;
        } else {
            console.error(`FAIL: ${message}`);
            failed++;
        }
    }

    try {
        invalidateCache();

        const res1 = await request({
            hostname: 'localhost',
            port,
            path: '/products',
            method: 'GET'
        });
        assert(res1.status === 200, 'GET /products returns status 200');
        assert(res1.headers['x-cache'] === 'MISS', 'First GET /products has header X-Cache: MISS');
        assert(Array.isArray(res1.data) && res1.data.length > 0, 'Products array returned');

        const res2 = await request({
            hostname: 'localhost',
            port,
            path: '/products',
            method: 'GET'
        });
        assert(res2.status === 200, 'GET /products returns status 200');
        assert(res2.headers['x-cache'] === 'HIT', 'Second GET /products has header X-Cache: HIT');

        const res3 = await request({
            hostname: 'localhost',
            port,
            path: '/products/1',
            method: 'GET'
        });
        assert(res3.status === 200, 'GET /products/1 returns status 200');
        assert(res3.headers['x-cache'] === 'MISS', 'First GET /products/1 has header X-Cache: MISS');
        assert(res3.data.id === 1, 'Product with id 1 returned');

        const res4 = await request({
            hostname: 'localhost',
            port,
            path: '/products/1',
            method: 'GET'
        });
        assert(res4.status === 200, 'GET /products/1 returns status 200');
        assert(res4.headers['x-cache'] === 'HIT', 'Second GET /products/1 has header X-Cache: HIT');

        const testProduct = { name: 'Headphones', price: 99.99 };
        const postRes = await request(
            {
                hostname: 'localhost',
                port,
                path: '/products',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            },
            testProduct
        );
        assert(postRes.status === 201, 'POST /products returns status 201');
        const newProduct = postRes.data.product;
        assert(newProduct && newProduct.id, `Created product with ID ${newProduct?.id}`);

        const resAfterPost = await request({
            hostname: 'localhost',
            port,
            path: '/products',
            method: 'GET'
        });
        assert(resAfterPost.headers['x-cache'] === 'MISS', 'GET /products after POST is X-Cache: MISS');
        const found = resAfterPost.data.some((p) => p.name === 'Headphones');
        assert(found, 'Freshly fetched products include the newly created product');

        const putRes = await request(
            {
                hostname: 'localhost',
                port,
                path: `/products/${newProduct.id}`,
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            },
            { name: 'Wireless Headphones', price: 129.99 }
        );
        assert(putRes.status === 200, 'PUT /products/:id returns status 200');

        const patchRes = await request(
            {
                hostname: 'localhost',
                port,
                path: `/products/${newProduct.id}`,
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' }
            },
            { price: 119.99 }
        );
        assert(patchRes.status === 200, 'PATCH /products/:id returns status 200');

        await request({ hostname: 'localhost', port, path: `/products/${newProduct.id}`, method: 'GET' });

        const deleteRes = await request({
            hostname: 'localhost',
            port,
            path: `/products/${newProduct.id}`,
            method: 'DELETE'
        });
        assert(deleteRes.status === 200, 'DELETE /products/:id returns status 200');

        const ttlMissRes = await request({ hostname: 'localhost', port, path: '/products/1', method: 'GET' });
        assert(ttlMissRes.headers['x-cache'] === 'MISS', 'Initial request is MISS');

        const ttlHitRes = await request({ hostname: 'localhost', port, path: '/products/1', method: 'GET' });
        assert(ttlHitRes.headers['x-cache'] === 'HIT', 'Immediate follow-up request is HIT');

        const staleProductData = { id: 1, name: 'Stale Keyboard', price: 10 };
        const sixtyFiveSecondsAgo = Date.now() - 65 * 1000;
        __setCacheEntryForTesting('/products/1', staleProductData, sixtyFiveSecondsAgo);

        const expiredReqRes = await request({ hostname: 'localhost', port, path: '/products/1', method: 'GET' });
        assert(expiredReqRes.headers['x-cache'] === 'MISS', 'Expired request returns X-Cache: MISS');
        assert(expiredReqRes.data.name !== 'Stale Keyboard', 'Expired cached value was discarded');
        assert(expiredReqRes.data.id === 1, 'Fresh value fetched from database');

        const freshHitRes = await request({ hostname: 'localhost', port, path: '/products/1', method: 'GET' });
        assert(freshHitRes.headers['x-cache'] === 'HIT', 'Subsequent request after re-fetching is X-Cache: HIT');
        assert(freshHitRes.data.id === 1, 'Data returned correctly from fresh cache');
    } finally {
        server.close();
    }

    console.log(`Tests Completed: ${passed} Passed, ${failed} Failed`);
    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch((err) => {
    console.error('Test run error:', err);
    process.exit(1);
});
