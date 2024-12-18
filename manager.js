const NodeCache = require("node-cache");
class Cache extends NodeCache{
  /**
   * @type {number} Size of the cache
   */
  size;
  get size(){
    return this.keys().length;
  }
  /**
   * 
   * @param {NodeCache.Options} args Native NodeCache options
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
  /**
   * 
   * @param {string} key The key to cache
   * @param {any[]|any} values values to be added to the key
   */
  add(key,values){
    if(!(values instanceof Array)){
      values=[values]
    }
    this.set(key,this.get(key).push(...values))
  }
}
class CacheItem{
  /**
   * @type {string} The string needed to access the value
   */
  key;
  /**
   * @type {any[]} The value accessed by providing the key
   */
  value;
}
class Manager {
    /**
     * @type {Cache} Cached fetched enties from the manager
     */
    cache;
    /**
     * @param {Cache} cacheInstance the cache's instance
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