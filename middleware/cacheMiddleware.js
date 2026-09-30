const cache = new Map();
const TTL = 60 * 1000;

function cacheMiddleware(ttl = TTL) {
    return (req, res, next) => {
        if (req.method !== 'GET') {
            return next();
        }

        const key = req.originalUrl || req.url;
        const entry = cache.get(key);
        const now = Date.now();

        if (entry) {
            if (now - entry.createdAt <= ttl) {
                res.setHeader('X-Cache', 'HIT');
                res.setHeader('X-Cache-Created-At', new Date(entry.createdAt).toISOString());
                return res.status(200).json(entry.data);
            }
            cache.delete(key);
        }

        res.setHeader('X-Cache', 'MISS');

        const originalJson = res.json.bind(res);
        res.json = (body) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                cache.set(key, {
                    data: body,
                    createdAt: Date.now()
                });
            }
            return originalJson(body);
        };

        next();
    };
}

function invalidateCache() {
    cache.clear();
}

function getCacheState() {
    const now = Date.now();
    return {
        size: cache.size,
        entries: Array.from(cache.entries()).map(([key, val]) => ({
            key,
            createdAt: new Date(val.createdAt).toISOString(),
            ageSeconds: Math.round((now - val.createdAt) / 1000)
        }))
    };
}

function __setCacheEntryForTesting(key, data, createdAt) {
    cache.set(key, { data, createdAt });
}

module.exports = {
    cacheMiddleware,
    invalidateCache,
    getCacheState,
    __setCacheEntryForTesting,
    ONE_MINUTE_MS: TTL
};
