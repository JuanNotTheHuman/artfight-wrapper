const { Comment } = require("./comment");
const { Manager } = require("./manager");
const { ArtfightScrapper } = require("./scrapper");
const {Submition} = require("./sumbition");
class Character{
    /**
     * @type {String} Identification index of the character
     */
    id;
    /**
     * @type {String} Name of the character
     */
    name;
    /**
     * @type {String} Timestamp of when the character got uploaded
     */
    created;
    /**
     * @type {String[]} Links to images of the character
     */
    images;
    /**
     * @type {String} Description of the character
     */
    description;
    /**
     * @type {String} Character permissions
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
     * @type {String[]} Character tags
     */
    tags;
    /**
     * @type {Comment[]} Comments on the character
     */
    comments; 
    /**
     * @param {String} id Identification index of the character
     * @param {String} name Name of the character
     * @param {String} created Timestamp of when the character got uploaded
     * @param {String[]} images Links to images of the character
     * @param {String} description Description of the character
     * @param {String} permissions Character permissions
     * @param {Submition[]} attacks Attacks made on the character
     * @param {CharacterInformation} information The character's information
     * @param {String[]} tags Character tags
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
     * @returns {String} Link to the character
     */
    link(){
        return `https://artfight.net/character/${this.id}.${this.name}`
    }
}
class CharacterInformation{
    /**
     * @type {String} The owner's nickname
     */
    owner;
    /**
     * @type {String} The designer's nickname
     */
    designer;
    /**
     * @param {String} owner Owner of character
     * @param {String} designer Designer of the character
     * @param {String} moreinfo More information about the character (link to external website)
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
     * @type {ArtfightScrapper} The manager's scrapper
     */
    #scrapper;
    /**
     * @param {ArtfightScrapper} scrapper The manager's scrapper
     * @param {Cache} cache The manager's cache manager
     */
    constructor(scrapper,cache){
        super(cache);
        this.#scrapper=scrapper;
    }
    /**
     * @param {String} username The User's username
     * @returns {Promise<Character[]>} All of the User's characters
     */
    async fetch(username){
        let characters = await this.#scrapper.fetchUserCharacters(username);
        this.cache.set(username,characters)
        return characters;
    }
    /**
     * @returns {Promise<Character>} A random character
     */
    async random(){
        /**
         * @type {Character}
         */
        let character = await this.#scrapper.fetchRandomCharacter();
        if(!this.cache.get(character.information.owner).map(r=>r.name).has(character.name)){
            /**
             * @type {Character[]}
             */
            let arr = this.cache.get(character.information.owner).push(character)
            this.cache.set(character.information.owner,arr)
        }
        return character;
    }
    /**
     * @param {String|String[]} tags Character tags
     * @param {Number} limit Maximum amount of characters returned
     * @returns {Character[]} Array of characters
     */
    async tagSearch(tags,limit){
        let characters = await this.#scrapper.fetchCharactersByTag(tags,limit);
        for(let character of characters){
            if(!this.cache.get(character.information.owner).map(r=>r.name).has(character.name)){
                /**
                 * @type {Character[]}
                 */
                let arr = this.cache.get(character.information.owner).push(character)
                this.cache.set(character.information.owner,arr)
            }
        }
        return characters;
    }
}
module.exports={CharacterManager, Character, CharacterInformation};
/**
 * TODO:
 * Implement complete
 */