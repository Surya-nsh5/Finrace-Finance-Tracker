const NodeCache = require('node-cache');

// Standard TTL of 5 minutes (300 seconds)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 320 });

/**
 * Middleware to cache API responses.
 * @param {number} duration Cache duration in seconds (defaults to 300)
 */
const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate a unique cache key based on the user ID, URL, and query parameters
    const userId = req.user ? req.user.id : 'anonymous';
    const key = `__express__${userId}__${req.originalUrl || req.url}`;

    const cachedBody = cache.get(key);
    if (cachedBody) {
      return res.json(cachedBody);
    } else {
      // Overwrite res.json to intercept the response body and cache it
      const originalSend = res.json;
      res.json = (body) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(key, body, duration);
        }
        originalSend.call(res, body);
      };
      next();
    }
  };
};

/**
 * Function to manually clear cache for a specific user or globally.
 * Useful when mutations (POST, PUT, DELETE) occur.
 * @param {string} userId The ID of the user whose cache needs to be cleared
 */
const clearUserCache = (userId) => {
  if (!userId) return;
  const keys = cache.keys();
  const userKeys = keys.filter((key) => key.startsWith(`__express__${userId}__`));
  if (userKeys.length > 0) {
    cache.del(userKeys);
  }
};

module.exports = {
  cacheMiddleware,
  clearUserCache,
  cache
};
