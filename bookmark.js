const {ArtfightScrapper} = require("./scrapper")
const {ArtfightClient} = require("./client")
const {Manager} = require("./manager")
class BookmarkCharacter{
    /**
     * @type {string}
     */
    id;
    /**
     * @type {string}
     */
    name;
    /**
     * @type {string}
     */
    icon;
    /**
     * @type {string}
     */
    owner;
    /**
     * @type {string}
     */
    description;
    /**
     * @type {string}
     */
    updated;
    /**
     * @type {string}
     */
    order;
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
}
module.exports={BookmarkManager,BookmarkCharacter}