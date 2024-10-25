const {ArtfightScrapper} = require("./scrapper");
const {Manager,Cache } = require("./manager");
class SubmitionInformation{
    /**
     * @type {String}
     */
    from;
    /**
     * @type {String}
     */
    to;
    /**
     * @type {String}
     */
    team;
    /**
     * @type {SubmitionCharacter[]}
     */
    characters;
    /**
     * 
     * @param {String} from 
     * @param {String} to 
     * @param {String} team 
     * @param {SubmitionCharacter[]} characters 
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
     * @type {Number}
     */
    points;
    /**
     * @type {Number}
     */
    character_count;
    /**
     * @type {String}
     */
    type;
    /**
     * @type {String}
     */
    finish;
    /**
     * @type {String}
     */
    color;
    /**
     * @type {String}
     */
    shading;
    /**
     * @type {String}
     */
    background;
    /**
     * @param {Number|String} points 
     * @param {Number} character_count 
     * @param {String} type 
     * @param {String} finish 
     * @param {String} color 
     * @param {String} shading 
     * @param {String} background 
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
     * @type {SubmitionInformation}
     */
    information;
    /**
     * @type {SubmitionStatistics}
     */
    statistics;
    /**
     * @type {{previous?:Revenge,next?:Revenge}}
     */
    revenge;
    /**
     * @type {String}
     */
    timestamp;
    /**
     * @type {Boolean}
     */
    polished;
    /**
     * @type {Boolean}
     */
    friendlyfire
    /**
     * @type {Comment[]}
     */
    comments
    /**
     * @param {SubmitionInformation} information 
     * @param {SubmitionStatistics} statistics 
     * @param {{previous?:Revenge,next?:Revenge}} revenge 
     * @param {String} timestamp
     * @param {Boolean} friendlyfire
     * @param {{movement_amount:String,technique:String}} animation TBA
     * @param {Boolean} polished
     * @param {Comment[]} comments TBA
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
     * @type {String}
     */
    link
    /**
     * @type {String}
     */
    title;
    /**
     * @type {Number}
     */
    level;
    /**
     * @type {String}
     */
    image;
    /**
     * @param {String} title 
     * @param {Number} level 
     * @param {String} image 
     * @param {String} link 
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
     * @type {String}
     */
    type;
    /**
     * @type {String}
     */
    link;
    /**
     * @type {String}
     */
    image;
    /**
     * @param {String} type 
     * @param {String} image 
     * @param {String} link;
     */
    constructor(type,image,link){
        this.type=type;
        this.image=image;
        this.link=link;
    }
}
class SubmitionManager extends Manager{
    /**
     * @type {"attack"|"defense"}
     */
    type;
    /**
     * @type {ArtfightScrapper}
     */
    #scrapper
    /**
     * @param {ArtfightScrapper} scrapper 
     * @param {Cache} cache 
     * @param {String} type
     */
    constructor(scrapper,cache,type){
        super(cache)
        this.#scrapper=scrapper;
        this.type = type;
    }
}
module.exports={Submition,Revenge,SubmitionManager,SubmitionInformation,SubmitionStatistics,SubmitionCharacter}
/**
 * TODO:
 * Impletent complete
 * Fix Sumbition type
 * TBA - To be added
 * More...
 */