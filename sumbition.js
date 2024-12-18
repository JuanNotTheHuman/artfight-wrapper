const {ArtfightScrapper} = require("./scrapper");
const {Manager,Cache } = require("./manager");
class SubmitionInformation{
    /**
     * @type {string} The user that submitted the attack
     */
    from;
    /**
     * @type {string} The user the attack got submitted to
     */
    to;
    /**
     * @type {string} The attacker's team
     */
    team;
    /**
     * @type {SubmitionCharacter[]} List of characters present in the attack
     */
    characters;
    /**
     * 
     * @param {string} from The user that submitted the attack
     * @param {string} to The user the attack got submitted to
     * @param {string} team The attacker's team
     * @param {SubmitionCharacter[]} characters List of characters present in the attack
     */
    constructor(from,to,team,characters){
        this.from=from;
        this.to=to;
        this.team=team;
        this.characters=characters;
    }
}
class SubmitionStatistics{
    /**
     * @type {number} number of points awarded for the submition
     */
    points;
    /**
     * @type {number} Amount of characters in the submition
     */
    character_count; 
    /**
     * @type {string} The submition type
     */
    type;
    /**
     * @type {string} The finish state of the submition
     */
    finish;
    /**
     * @type {string} The coloring state of the submition
     */
    color;
    /**
     * @type {string} The shading state of the submition
     */
    shading;
    /**
     * @type {string} The background state of the submition
     */
    background;
    /**
     * @param {number} points number of points awarded for the submition
     * @param {number} character_count Amount of characters in the submition
     * @param {string} type The submition type
     * @param {string} finish The finish state of the submition
     * @param {string} color The coloring state of the submition
     * @param {string} shading The shading state of the submition
     * @param {string} background The background state of the submition
     */
    constructor(points,character_count,type,finish,color,shading,background){
        if(typeof(points)=="string"){
            this.points=parseFloat(points.replace("Friendly Fire",""))
        }else{
            this.points=points;
        }
        this.character_count=character_count;
        this.type=type;
        this.finish=finish;
        this.color=color;
        this.shading=shading;
        this.background=background;
    }
}
class Submition{
    /**
     * @type {SubmitionInformation} Information about the submition
     */
    information;
    /**
     * @type {SubmitionStatistics} Submition statistics
     */
    statistics;
    /**
     * @type {{previous?:Revenge,next?:Revenge}} The revenges of the submition
     */
    revenge;
    /**
     * @type {string} The timestamp of when the submition was posted
     */
    timestamp;
    /**
     * @type {Boolean} Whether the submition is polished
     */
    polished;
    /**
     * @type {Boolean} Whether the submition is a friendly fire
     */
    friendlyfire
    /**
     * @type {Comment[]} The submition's comments
     */
    comments
    /**
     * @param {SubmitionInformation} information Information about the submition
     * @param {SubmitionStatistics} statistics Submition statistics
     * @param {{previous?:Revenge,next?:Revenge}} revenge The revenges of the submition
     * @param {string} timestamp The timestamp of when the submition was posted
     * @param {Boolean} friendlyfire
     * @param {{movement_amount:string,technique:string}} animation TBA
     * @param {Boolean} polished Whether the submition is polished
     * @param {Comment[]} comments The submition's comments
     */
    constructor(information,statistics,revenge,timestamp,friendlyfire,animation,polished,comments){
        this.information=information;
        this.statistics=statistics;
        this.revenge=revenge;
        this.timestamp=timestamp;
        this.friendlyfire=friendlyfire;
        this.polished=polished;
        if(animation){
            this.animation=animation;
        }
        this.comments=comments;
    }
}
class Revenge{
    /**
     * @type {string} The revenge's link
     */
    link
    /**
     * @type {string} The revenge's title
     */
    title;
    /**
     * @type {number} The revenge's level
     */
    level;
    /**
     * @type {string} The revenge's icon url
     */
    image;
    /**
     * @param {string} title The revenge's title
     * @param {number} level The revenge's level
     * @param {string} image The revenge's icon url
     * @param {string} link The revenge's link
     */
    constructor(title,level,image,link){
        this.title=title;
        this.level=level;
        this.image=image;
        this.link=link;
    }
}
class SubmitionCharacter{
    /**
     * @type {string} Type of character features (fullbody, halfbody, ect.)
     */
    type;
    /**
     * @type {string} Url to the character
     */
    link;
    /**
     * @type {string} Url to the character's icon
     */
    image;
    /**
     * @param {string} type Type of character features (fullbody, halfbody, ect.)
     * @param {string} image Url to the character's icon
     * @param {string} link Url to the character
     */
    constructor(type,image,link){
        this.type=type;
        this.image=image;
        this.link=link;
    }
}
class SubmitionManager extends Manager{
    /**
     * @type {"attack"|"defense"} The manager's type
     */
    type;
    /**
     * @type {ArtfightScrapper} The manager's scapper
     */
    #scrapper
    /**
     * @param {ArtfightScrapper} scrapper The manager's scapper
     * @param {Cache} cache The manager's cache manager
     * @param {string} type The manager's type
     */
    constructor(scrapper,cache,type){
        super(cache)
        this.#scrapper=scrapper;
        this.type = type;
    }
    /**
     * @param {string} username The user's username
     * @param {number} limit Max amount of submitions fetched
     * @returns {Promise<Submition[]>}
     */
    async fetch(username,limit=5){
        let submitions = await this.#scrapper.fetchSubmitions(username,limit,this.type);
        for(let submition of submitions){
            if(this.type=="attack"){
                if(!this.#scrapper.client.attacks.cache.get(username).has(submition)){
                    let arr = this.#scrapper.client.attacks.cache.get(username).push(submition);
                    this.#scrapper.client.attacks.cache.set(username,arr)
                }
            }else{
                if(!this.#scrapper.client.defenses.cache.get(username).has(submition)){
                    let arr = this.#scrapper.client.defenses.cache.get(username).push(submition);
                    this.#scrapper.client.defenses.cache.set(username,arr)
                }
            }
        }
        return submitions
    }
}
module.exports={Submition,Revenge,SubmitionManager,SubmitionInformation,SubmitionStatistics,SubmitionCharacter}
/**
 * TODO:
 * Impletent complete
 * TBA - To be added
 * More...
 */