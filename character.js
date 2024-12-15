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
     * @type {CharacterInformation}
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
     * @param {String} id 
     * @param {String} name 
     * @param {String} created 
     * @param {String[]} images 
     * @param {String} description 
     * @param {String} permissions 
     * @param {Submition[]} attacks 
     * @param {CharacterInformation} information 
     * @param {String[]} tags 
     * @param {Comment[]} comments
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
/**
 * @classdesc Information about the character
 */
class CharacterInformation{
    /**
     * @type {String}
     */
    owner;
    /**
     * @type {String}
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
        return await this.#scrapper.fetchUserCharacters(username);
    }
    /**
     * @returns {Promise<Character>} A random character
     */
    async random(){
        return await this.#scrapper.fetchRandomCharacter();
    }
    /**
     * @param {String|String[]} tags Character tags
     * @param {Number} limit Maximum amount of characters returned
     * @returns {Character[]} Array of characters
     */
    async tagSearch(tags,limit){
        return await this.#scrapper.fetchCharactersByTag(tags,limit);
    }
}
module.exports={CharacterManager, Character, CharacterInformation};
/**
 * TODO:
 * Implement complete
 */