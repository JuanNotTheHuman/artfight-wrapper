const {ArtfightScrapper} = require("./scrapper");
const {Manager,Cache } = require("./manager");
class SubmitionInformation{
    /**
     * @type {String} The user that submitted the attack
     */
    from;
    /**
     * @type {String} The user the attack got submitted to
     */
    to;
    /**
     * @type {String} The attacker's team
     */
    team;
    /**
     * @type {SubmitionCharacter[]} List of characters present in the attack
     */
    characters;
    /**
     * 
     * @param {String} from The user that submitted the attack
     * @param {String} to The user the attack got submitted to
     * @param {String} team The attacker's team
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
     * @type {Number} Number of points awarded for the submition
     */
    points;
    /**
     * @type {Number} Amount of characters in the submition
     */
    character_count; 
    /**
     * @type {String} The submition type
     */
    type;
    /**
     * @type {String} The finish state of the submition
     */
    finish;
    /**
     * @type {String} The coloring state of the submition
     */
    color;
    /**
     * @type {String} The shading state of the submition
     */
    shading;
    /**
     * @type {String} The background state of the submition
     */
    background;
    /**
     * @param {Number} points Number of points awarded for the submition
     * @param {Number} character_count Amount of characters in the submition
     * @param {String} type The submition type
     * @param {String} finish The finish state of the submition
     * @param {String} color The coloring state of the submition
     * @param {String} shading The shading state of the submition
     * @param {String} background The background state of the submition
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
     * @type {String} The timestamp of when the submition was posted
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
     * @param {String} timestamp The timestamp of when the submition was posted
     * @param {Boolean} friendlyfire
     * @param {{movement_amount:String,technique:String}} animation TBA
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
     * @type {String} The revenge's link
     */
    link
    /**
     * @type {String} The revenge's title
     */
    title;
    /**
     * @type {Number} The revenge's level
     */
    level;
    /**
     * @type {String} The revenge's icon url
     */
    image;
    /**
     * @param {String} title The revenge's title
     * @param {Number} level The revenge's level
     * @param {String} image The revenge's icon url
     * @param {String} link The revenge's link
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
     * @type {String} Type of character features (fullbody, halfbody, ect.)
     */
    type;
    /**
     * @type {String} Url to the character
     */
    link;
    /**
     * @type {String} Url to the character's icon
     */
    image;
    /**
     * @param {String} type Type of character features (fullbody, halfbody, ect.)
     * @param {String} image Url to the character's icon
     * @param {String} link Url to the character
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
     * @param {String} type The manager's type
     */
    constructor(scrapper,cache,type){
        super(cache)
        this.#scrapper=scrapper;
        this.type = type;
    }
    /**
     * @param {String} username The user's username
     * @param {number} limit Max amount of submitions fetched
     * @returns {Promise<Submition[]>}
     */
    async fetch(username,limit=5){
        return await this.#scrapper.fetchSubmitions(username,limit,this.type);
    }
}
module.exports={Submition,Revenge,SubmitionManager,SubmitionInformation,SubmitionStatistics,SubmitionCharacter}
/**
 * TODO:
 * Impletent complete
 * TBA - To be added
 * More...
 */