const { Page } = require("puppeteer");
const {CharacterManager } = require("./character");
const {TaskManager} = require("./task");
const {SubmitionManager } = require("./sumbition");
const { Manager, Cache } = require("./manager");
const { ArtfightClient } = require("./client");
const { ArtfightScrapper } = require("./scrapper");
class UserStatus{
    /**
     * @type {String}
     */
    lastseen;
    /**
     * @type {String}
     */
    joined;
    /**
     * @type {String}
     */
    team;
    /**
     * 
     * @param {String} lastseen 
     * @param {String} joined 
     * @param {String} team 
     */
    constructor(lastseen,joined,team){
        this.lastseen=lastseen;
        this.joined=joined;
        this.team=team;
    }
}
class BattleStatistics{
    /**
     * @type {Number}
     */
    ratio;
    /**
     * @type {Number}
     */
    points;
    /**
     * @type {Number}
     */
    attacks;
    /**
     * @type {Number}
     */
    friendlyfire;
    /**
     * @type {Number}
     */
    defenses;
    /**
     * 
     * @param {Number} ratio 
     * @param {Number} points 
     * @param {Number} attacks 
     * @param {Number} friendlyfire 
     * @param {Number} defenses 
     * @param {Number?} followers 
     * @param {Number?} following
     * @param {Number?} characters
     */
    constructor(ratio,points,attacks,friendlyfire,defenses,characters,followers,following){
        if(typeof(ratio)=="string"){
            this.ratio=points;
            this.points=attacks;
            this.attacks=friendlyfire;
            this.friendlyfire=defenses;
            this.defenses=characters;
        }else{
            this.ratio=ratio;
            this.points=points;
            this.attacks=attacks;
            this.friendlyfire=friendlyfire;
            this.defenses=defenses;
            if(followers){
                this.followers=followers;
            }
            if(following){
                this.following=following;
            }
            if(characters){
                this.characters=characters;
            }
        }
    }
}
class UserStatistics{
    /**
     * @type {BattleStatistics}
     */
    overall;
    /**
     * @type {BattleStatistics}
     */
    current;
    /**
     * @type {String[]}
     */
    achivements;
    /**
     * @param {BattleStatistics} overall 
     * @param {BattleStatistics} current 
     * @param {String[]} achivements
     */
    constructor(overall,current,achivements){
        this.overall=overall;
        this.current=current;
        this.achivements=achivements;
    }
}
class User{
    /**
     * @type {ArtfightClient}
     */
    client;
    /**
     * @type {String}
     */
    username;
    /**
     * @type {UserStatus}
     */
    status;
    /**
     * @type {SubmitionManager}
     */
    attacks;
    /**
     * @type {SubmitionManager}
     */
    defenses;
    /**
     * @type {CharacterManager}
     */
    characters;
    /**
     * @type {UserStatistics}
     */
    statistics;
    /**
     * @type {String}
     */
    image;
    /**
     * @type {Comment[]}
     */
    comments;
    /**
     * 
     * @param {ArtfightClient} client 
     * @param {String} username 
     */
    constructor(client,username){
        this.client=client;
        this.username=username;
        this.attacks=this.client.attacks;
        this.defenses=this.client.defenses;
        this.characters = this.client.characters;
        //Need to add comments
    }
}
class ClientUser extends User{
    /**
     * @param {ArtfightClient} client 
     * @param {String} username 
     */
    constructor(client,username){
        super(client,username);
    }
    /**
     * @returns {ClientUser}
     */
    async init(){
        const manager = new TaskManager();
        /**
         * @type {User}
         */
        let user;
        manager.tasks.push(new Promise(async r=>{
            user=await this.client.users.fetch(this.username);
            r();
        }));
        await manager.execute();
        return user;
    }
}
class UserManager extends Manager{
    /**
     * @type {ArtfightClient}
     */
    client;
    /**
     * @type {ArtfightScrapper}
     */
    #scrapper;
    /**
     * @param {ArtfightScrapper} scrapper
     * @param {Cache} cache 
     */
    constructor(scrapper,cache,client){
        super(cache);
        this.#scrapper=scrapper;
        this.client=client;
    }
    /**
     * @param {String} username 
     * @returns {Promise<User>}
     */
    async fetch(username){
        const user = new User(this.client,username);
        const manager = new TaskManager();
        manager.tasks.push(new Promise(async r=>{
          user.status=new UserStatus(...Object.values(await this.#scrapper.fetchUserStatus(username)));
          r();
        }),new Promise(async r=>{
            user.image=await this.#scrapper.fetchUserImage(username);
            r();
        }),new Promise(async r=>{
            let [current,overall,achivements] = await Object.values(await this.#scrapper.fetchUserStatistics(username));
            let ov = new BattleStatistics(...overall);
            user.statistics=new UserStatistics(new BattleStatistics(...overall),new BattleStatistics(...current),achivements.map(r=>r[1]));
            r();
        }));
        await manager.execute();
        return user;
    }
    /**
     * @returns {Promise<User}
     */
    async random(){
        return await this.fetch(await this.#scrapper.fetchRandomUsername());    
    }
}
class Member{
    /**
     * @type {String}
     */
    username;
    /**
     * @type {String}
     */
    lastseen;
    /**
     * @type {Number}
     */
    points;
    /**
     * @type {Number}
     */
    battleratio;
}
class MemberManager extends Manager{
    /**
     * @type {ArtfightClient}
     */
    client;
    /**
     * @type {ArtfightScrapper}
     */
    #scrapper;
    constructor(scrapper,cache,client){
        super(cache);
        this.#scrapper=scrapper;
        this.client=client;
    }
    /**
     * @param {Number} limit
     * @returns {Promise<Member[]>} 
     */
    async fetch(limit){
       return await this.#scrapper.fetchMembers(limit);
    }
}
module.exports={User,UserManager,ClientUser,UserStatus,MemberManager,Member}
/**
 * TODO:
 * Expand ClientUser
 * Implement cache (for all managers basically)
 * Implement completes
 */