import NodeCache, { Key, Options } from 'node-cache';
import { EventEmitter } from 'events';
/**
 * @class Cache
 * @extends NodeCache
 */
class Cache extends NodeCache {
  /**
   * @type {number} Size of the cache
   */
  get size(): number {
    return this.keys().length;
  }

  /**
   * @param {Options} [args] Native NodeCache options
   */
  constructor(args: Options = {}) {
    super(args);
  }

  /**
   * @returns {Array<CacheItem>} All of the values of the cache
   */
  values(): CacheItem[] {
    return Object.values(this.mget(this.keys()));
  }

  /**
   * @param {Key} key The key to cache
   * @param {any[]|any} values values to be added to the key
   */
  add(key: Key, values: any[] | any): void {
    if (!(values instanceof Array)) {
      values = [values];
    }
    const existingValues: any[] = this.get(key) || [];
    this.set(key, existingValues.concat(values));
  }
  /**
   * @param {Key} key The key to cache
   * @returns {number} Amount of keys deleted
   */
  delete(key: Key): number {
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
  key: Key;
  /**
   * @type {any[]} The value accessed by providing the key
   */
  value: any[];
  constructor(key:Key,value:any[]){
    this.key=key;
    this.value=value;
  }
}

/**
 * @class Manager
 */
class Manager {
  /**
   * @type {Cache} Cached fetched entries from the manager
   */
  cache: Cache;

  /**
   * @param {Cache} cacheInstance the cache's instance
   */
  constructor(cacheInstance: Cache) {
    this.cache = cacheInstance;
  }
}
export { Manager, Cache, CacheItem };