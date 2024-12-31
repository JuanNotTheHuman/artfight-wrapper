import NodeCache from 'node-cache';
/**
 * @class Cache
 * @extends NodeCache
 */
class Cache extends NodeCache {
    /**
     * @type {number} Size of the cache
     */
    get size() {
        return this.keys().length;
    }
    /**
     * @param {Options} [args] Native NodeCache options
     */
    constructor(args = {}) {
        super(args);
    }
    /**
     * @returns {Array<CacheItem>} All of the values of the cache
     */
    values() {
        return Object.values(this.mget(this.keys()));
    }
    /**
     * @param {Key} key The key to cache
     * @param {any[]|any} values values to be added to the key
     */
    add(key, values) {
        if (!(values instanceof Array)) {
            values = [values];
        }
        const existingValues = this.get(key) || [];
        this.set(key, existingValues.concat(values));
        this.emit('valueAdded', { key, values });
    }
    /**
     * @param {Key} key The key to cache
     * @returns {number} Amount of keys deleted
     */
    delete(key) {
        this.emit('valueDeleted', { key });
        return this.del(key);
    }
}
/**
 * @class CacheItem
 */
class CacheItem {
    /**
     * @type {Key} The string needed to access the value
     */
    key;
    /**
     * @type {any[]} The value accessed by providing the key
     */
    value;
    constructor(key, value) {
        this.key = key;
        this.value = value;
    }
}
/**
 * @class Manager
 */
class Manager {
    /**
     * @type {Cache} Cached fetched entries from the manager
     */
    cache;
    /**
     * @param {Cache} cacheInstance the cache's instance
     */
    constructor(cacheInstance) {
        this.cache = cacheInstance;
    }
}
export { Manager, Cache, CacheItem };
