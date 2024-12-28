const { ArtfightClient } = require("./client");
const { Comment } = require("./comment");
const { Manager } = require("./manager");
const { ArtfightScrapper } = require("./scrapper");
const {Submition} = require("./sumbition");
const {CacheUpdateTypes} = require("./Enumarables")
class Character{
    /**
     * @type {string} Identification index of the character
     */
    id;
    /**
     * @type {string} Name of the character
     */
    name;
    /**
     * @type {string} Timestamp of when the character got uploaded
     */
    created;
    /**
     * @type {string[]} Links to images of the character
     */
    images;
    /**
     * @type {string} Description of the character
     */
    description;
    /**
     * @type {string} Character permissions
     */
    permissions;
    /**
     * @type {Submition[]} Attacks made on the character
     */
    attacks;
    /**
     * @type {CharacterInformation} The character's information
     */
    information;
    /**
     * @type {string[]} Character tags
     */
    tags;
    /**
     * @type {Comment[]} Comments on the character
     */
    comments; 
    /**
     * @param {string} id Identification index of the character
     * @param {string} name Name of the character
     * @param {string} created Timestamp of when the character got uploaded
     * @param {string[]} images Links to images of the character
     * @param {string} description Description of the character
     * @param {string} permissions Character permissions
     * @param {Submition[]} attacks Attacks made on the character
     * @param {CharacterInformation} information The character's information
     * @param {string[]} tags Character tags
     * @param {Comment[]} comments Comments on the character
     */
    constructor(id,name,created,images,description,permissions,attacks,information,tags,comments){
        this.id=id;
        this.name=name;
        this.created=created;
        this.images=images;
        this.description=description;
        this.permissions=permissions;
        this.attacks=attacks;
        this.information=information;
        this.tags=tags;
        this.comments=comments;
    }
    /**
     * @param {ArtfightClient} client The Artfight client
     * @param {number} order Order of the character
     * @param {string} description Description of the bookmark `(not working)`
     * @returns {Promise<void>} Bookmarks the character
     */
    async bookmark(client,order,description){
     await client.scrapper.bookmarkCharacter(this.id,order,description);
     if(!client.user.bookmarks.cache.has(this.id)){
         client.user.bookmarks.cache.set(this.id,this)
     }
     client.emit("bookmarkCacheUpdate",{type:CacheUpdateTypes.Add,data:this})
    }
    /**
     * @param {ArtfightClient} client The Artfight client
     * @returns {Promise<void>} Unbookmarks the character
     */
    async unbookmark(client){
        await client.scrapper.unbookmarkCharacter(this.id);
        if(client.user.bookmarks.cache.has(this.id)){
            client.user.bookmarks.cache.delete(this.id);
        }
        client.emit("bookmarkCacheUpdate",{type:"remove",data:this})
    }
    /**
     * @returns {string} Link to the character
     */
    link(){
        return `https://artfight.net/character/${this.id}.${this.name}`
    }
}
class CharacterInformation{
    /**
     * @type {string} The owner's nickname
     */
    owner;
    /**
     * @type {string} The designer's nickname
     */
    designer;
    /**
     * @param {string} owner Owner of character
     * @param {string} designer Designer of the character
     * @param {string} moreinfo More information about the character (link to external website)
     */
    constructor(owner,designer,moreinfo){
        this.owner=owner;
        this.designer=designer;
        if(moreinfo){
            this.moreinfo=moreinfo;
        }
    }
}
class CharacterManager extends Manager{
    /**
     * @type {ArtfightClient} The manager's client
     */
    client;
    /**
     * @param {ArtfightClient} client The manager's client
     * @param {Cache} cache The manager's cache manager
     */
    constructor(client,cache){
        super(cache);
        this.client=client;
    }
    /**
     * @param {string} username The User's username
     * @returns {Promise<Character[]>} All of the User's characters
     */
    async fetch(username){
        let characters = await this.client.scrapper.fetchUserCharacters(username);
        this.cache.set(username,characters)
        this.client.emit("characterCacheUpdate",{type:CacheUpdateTypes.Add,value:characters})
        return characters;
    }
    /**
     * @param {string} id The character's identification index
     * 
     */
    async fetchById(id){
        let character = await this.client.scrapper.fetchUserCharacter(`https://artfight.net/character/${id}`);
        if(!this.cache.has(character.information.owner)){
            this.cache.set(character.information.owner,[character])
            this.client.emit("characterCacheUpdate",{type:CacheUpdateTypes.Add,value:character})
        }else if(!this.cache.get(character.information.owner)?.map(r=>r.name).has(character.name)){
            /**
             * @type {Character[]}
             */
            let arr = this.cache.get(character.information.owner).push(character)
            this.cache.set(character.information.owner,arr)
            this.client.emit("characterCacheUpdate",{type:CacheUpdateTypes.Add,value:character})
        }
        return character;
    }
    /**
     * @returns {Promise<Character>} A random character
     */
    async random(){
        /**
         * @type {Character}
         */
        let character = await this.client.scrapper.fetchRandomCharacter();
        if(!this.cache.has(character.information.owner)){
            this.cache.set(character.information.owner,[character])
            this.client.emit("characterCacheUpdate",{type:CacheUpdateTypes.Add,value:character})
        }else if(!this.cache.get(character.information.owner)?.map(r=>r.name).has(character.name)){
            /**
             * @type {Character[]}
             */
            let arr = this.cache.get(character.information.owner).push(character)
            this.cache.set(character.information.owner,arr)
            this.client.emit("characterCacheUpdate",{type:CacheUpdateTypes.Add,value:character})
        }
        return character;
    }
    /**
     * @param {string|string[]} tags Character tags
     * @param {number} limit Maximum amount of characters returned
     * @returns {Character[]} Array of characters
     */
    async tagSearch(tags,limit){
        let characters = await this.client.scrapper.fetchCharactersByTag(tags,limit);
        for(let character of characters){
            if(!this.cache.get(character.information.owner).map(r=>r.name).has(character.name)){
                /**
                 * @type {Character[]}
                 */
                let arr = this.cache.get(character.information.owner).push(character)
                this.cache.set(character.information.owner,arr)
                this.client.emit("characterCacheUpdate",{type:CacheUpdateTypes.Add,value:character})
            }
        }
        return characters;
    }
}
module.exports={CharacterManager, Character, CharacterInformation};