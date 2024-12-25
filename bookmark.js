const {ArtfightScrapper} = require("./scrapper")
const {ArtfightClient} = require("./client")
const {Manager} = require("./manager")
class BookmarkCharacter{
    /**
     * @type {string} The character's identification index
     */
    id;
    /**
     * @type {string} The character's name
     */
    name;
    /**
     * @type {string} Url to the character's icon
     */
    icon;
    /**
     * @type {string} Nickname of the character's owner
     */
    owner;
    /**
     * @type {string} The bookmarks's description
     */
    description;
    /**
     * @type {string} The timestamp of when the bookmark was last updated
     */
    updated;
    /**
     * @type {string} The ordering index of the bookmark
     */
    order;
    /**
     * 
     * @param {string} id The character's identification index
     * @param {string} name The character's name
     * @param {string} icon Url to the character's icon
     * @param {string} owner Nickname of the character's owner
     * @param {string} description The bookmarks's description
     * @param {string} updated The timestamp of when the bookmark was last updated
     * @param {string} order The ordering index of the bookmark
     */
    constructor(id,name,icon,owner,description,updated,order){
        this.id=id;
        this.name=name;
        this.icon=icon;
        this.owner=owner;
        this.description=description;
        this.updated=updated;
        this.order=order;
    }
    link(){
        return `https://artfight.net/character/${this.id}.${this.name}`
    }
    /**
     * To be added, removes the bookmark
     */
    async remove(){

    }
}
class BookmarkManager extends Manager{
    /**
     * @type {ArtfightClient} The Artfight client           
     */
    client;
    /**
    * @type {ArtfightScrapper} The Artfight scrapper
    */
    #scrapper;
    /**
    * @param {ArtfightScrapper} scrapper The Artfight scrapper
    * @param {Cache} cache The cache
    * @param {ArtfightClient} client The Artfight client 
    */
    constructor(scrapper,cache,client){
        super(cache);
        this.#scrapper=scrapper;
        this.client=client;
    }
    /**
     * @param {number} limit Maximum amount of bookmarks returned
     * @return {Promise<BookmarkCharacter[]>} List of bookmarks
     */
    async fetch(limit){
        return (await this.#scrapper.fetchClientUserBookmarks(limit)).map(r=>{
            let bookmark = new BookmarkCharacter(...r)
            if(!this.cache.has(bookmark.id)){
                this.cache.set(bookmark.id,bookmark)
            }
            return bookmark;
        })
    }
    /**
     * @param {number} index Index of the bookmark to be fetched starting from 0
     * @returns {Promise<BookmarkCharacter>} The bookmark at the specified index
     */
    async fetchIndex(index){
       let bookmark = new BookmarkCharacter(...(await this.#scrapper.fetchClientUserBookmarksIndex(index)))
       if(!this.cache.has(bookmark.id)){
           this.cache.set(bookmark.id,bookmark)
       }
    }
    /**
     * 
     * @param {number} start The starting index of the range of bookmarks to be fetched
     * @param {number} end The ending index of the range of bookmarks to be fetched
     * @returns {Promise<BookmarkCharacter[]>} List of bookmarks in the specified range
     */
    async fetchRange(start,end){
        return (await this.#scrapper.fetchClientUserBookmarksRange(start,end)).map(r=>{
            let bookmark = new BookmarkCharacter(...r)
            if(!this.cache.has(bookmark.id)){
                this.cache.set(bookmark.id,bookmark)
            }
            return bookmark;
        })
    }
    /**
     * Removes bookmarks from both cache and Artfight
     * @param {number} amount Amount of bookmarks to be removed, starting from beggining
     */
    async remove(amount){
        let ids = await this.#scrapper.deleteClientUserBookmarks(amount);
        for(let id of ids){
            this.cache.delete(id);
        }
    }
    /**
     * Removes the bookmark at the specified index from cache and Artfight
     * @param {number} id Identification index of bookmark's character to be removed
     */
    async removeCharacterById(id){
        if(await this.#scrapper.deleteClientUserBookmarkByCharacterId(id)==true){
            this.cache.delete(id);
        }
    }
    /**
     * Removes all bookmarks from cache and Artfight
     * @returns {Promise<void>} 
     */
    async removeAll(){
        await this.#scrapper.deleteClientUserBookmarksAll();
        this.cache.flushAll();
    }
}
module.exports={BookmarkManager,BookmarkCharacter}