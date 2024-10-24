const NodeCache = require("node-cache");
class Cache extends NodeCache{
  /**
   * @type {Number} Size of the cache
   */
  size;
  get size(){
    return this.keys().length;
  }
  /**
   * 
   * @param {NodeCache.Options} args 
   */
  constructor(args){
    super(args);
    this.size=this.keys().length;
  }
  /**
   * @returns {Array<CacheItem>} All of the values of the cache
   */
  values(){
    return Object.values(this.mget(this.keys()));
  }
}
class CacheItem{
  /**
   * @type {String} The string needed to access the value
   */
  key;
  /**
   * @type {Array<{}>} The value accessed by providing the key
   */
  value;
}
class Manager {
    /**
     * @type {Cache} Cached fetched enties from the manager
     */
    cache;
    /**
     * @param {Cache} cacheInstance
     */
    constructor(cacheInstance) {
      this.cache=cacheInstance;
    }
  }
module.exports={Manager,Cache};
/**
 * TODO:
 * Expand the manager for easier usability, since node-cache kinda sucks by its own;
 */