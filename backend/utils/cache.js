const NodeCache = require("node-cache");

// Standard cache with 2 minutes TTL, checks for expired keys every 2 minutes
const stdCache = new NodeCache({ stdTTL: 120, checkperiod: 120 });

// Helper function to get or set cache
const getOrSetCache = async (key, fetcher, ttl = 120) => {
    const cachedData = stdCache.get(key);
    if (cachedData) {
        return cachedData;
    }

    // Execute the fetcher if not cached
    const data = await fetcher();
    
    // Cache the result
    stdCache.set(key, data, ttl);
    return data;
};

const clearCache = (keyPattern) => {
    const keys = stdCache.keys();
    const keysToDelete = keys.filter(k => k.includes(keyPattern));
    if (keysToDelete.length > 0) {
        stdCache.del(keysToDelete);
    }
};

module.exports = {
    stdCache,
    getOrSetCache,
    clearCache
};
