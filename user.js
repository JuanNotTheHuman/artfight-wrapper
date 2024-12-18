const {CharacterManager } = require("./character");
const {TaskManager} = require("./task");
const {SubmitionManager } = require("./sumbition");
const { Manager, Cache } = require("./manager");
const { ArtfightClient } = require("./client");
const { ArtfightScrapper } = require("./scrapper");
const {BookmarkManager} = require("./bookmark")
class UserStatus{
    /**
     * @type {string} The timestamp of when the user was last seen online
     */
    lastseen;
    /**
     * @type {string} The timestamp of when the user joined Artfight
     */
    joined;
    /**
     * @type {string} The user's current team
     */
    team;
    /**
     * 
     * @param {string} lastseen The timestamp of when the user was last seen online
     * @param {string} joined The timestamp of when the user joined Artfight
     * @param {string} team The user's current team
     */
    constructor(lastseen,joined,team){
        this.lastseen=lastseen;
        this.joined=joined;
        this.team=team;
    }
}
class BattleStatistics{
    /**
     * @type {number} The attack to defense ratio of the user
     */
    ratio;
    /**
     * @type {number} Amount of points accumulated by the user
     */
    points;
    /**
     * @type {number} Amount of attacks done by the user
     */
    attacks;
    /**
     * @type {number} Amount of friendly fire attacks done by the user
     */
    friendlyfire;
    /**
     * @type {number} Amount of defenses done by the user
     */
    defenses;
    /**
     * 
     * @param {number} ratio The attack to defense ratio of the user
     * @param {number} points Amount of points accumulated by the user
     * @param {number} attacks Amount of attacks done by the user
     * @param {number} friendlyfire Amount of friendly fire attacks done by the user
     * @param {number} defenses Amount of defenses done by the user
     * @param {number?} followers Amount of followers the user has
     * @param {number?} following Amount of users followed by the user
     * @param {number?} characters Amount of characters posted by the user
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
     * @type {BattleStatistics} Overall battle statistics
     */
    overall;
    /**
     * @type {BattleStatistics} Current battle statistics
     */
    current;
    /**
     * @type {string[]} User's achivements
     */
    achivements;
    /**
     * @param {BattleStatistics} overall Overall battle statistics
     * @param {BattleStatistics} current Current battle statistics
     * @param {string[]} achivements User's achivements
     */
    constructor(overall,current,achivements){
        this.overall=overall;
        this.current=current;
        this.achivements=achivements;
    }
}
class User{
    /**
     * @type {ArtfightClient} The Artfight client
     */
    client;
    /**
     * @type {string} The user's nickname
     */
    username;
    /**
     * @type {UserStatus} The user's status
     */
    status;
    /**
     * @type {SubmitionManager} The user's attacks manager
     */
    attacks;
    /**
     * @type {SubmitionManager} The user's defenses manager
     */
    defenses;
    /**
     * @type {CharacterManager} The user's characters manager
     */
    characters;
    /**
     * @type {UserStatistics} The user's statistics
     */
    statistics;
    /**
     * @type {string} Url of the user's avatar
     */
    avatar;
    /**
     * @type {Comment[]} Comments made on the user's page
     */
    comments;
    /**
     * 
     * @param {ArtfightClient} client The Artfight client
     * @param {string} username The logged in user's username
     */
    constructor(client,username){
        this.client=client;
        this.username=username;
        this.attacks=this.client.attacks;
        this.defenses=this.client.defenses;
        this.characters = this.client.characters;
    }
    link(){
        return `https://artfight.net/~${this.username}`
    }
}
class ClientUser extends User{
    /**
     * @type {BookmarkManager} The logged in user's bookmark manager
     */
    bookmarks;
    /**
     * @param {ArtfightClient} client The Arfight client
     * @param {string} username The logged in user's username
     */
    constructor(client,username){
        super(client,username);
    }
    /**
     * Initializes the client's user
     * @returns {ClientUser} The client's user
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
     */
    constructor(scrapper,cache,client){
        super(cache);
        this.#scrapper=scrapper;
        this.client=client;
    }
    /**
     * @param {string} username User's nickname
     * @returns {Promise<User>} The user with the given nickname
     */
    async fetch(username){
        const user = new User(this.client,username);
        const manager = new TaskManager();
        manager.tasks.push(new Promise(async r=>{
          user.status=new UserStatus(...Object.values(await this.#scrapper.fetchUserStatus(username)));
          r();
        }),new Promise(async r=>{
            user.avatar=await this.#scrapper.fetchUserImage(username);
            r();
        }),new Promise(async r=>{
            let [current,overall,achivements] = await Object.values(await this.#scrapper.fetchUserStatistics(username));
            user.statistics=new UserStatistics(new BattleStatistics(...overall),new BattleStatistics(...current),achivements.map(r=>r[1]));
            r();
        }),new Promise(async r=>{
            let pg=await this.#scrapper.pages.get();
            await pg.page.goto(`https://artfight.net/~${username}`)
            let comments = await this.#scrapper.fetchComments(pg.page)
            user.comments=comments;
            this.#scrapper.pages.return(pg.index);
            r();
        }));
        await manager.execute();
        if(!this.cache.has(user.username)){
            this.cache.set(user.username,user)
        }
        return user;
    }
    /**
     * @returns {Promise<User} A random user
     */
    async random(){
        let user = await this.fetch(await this.#scrapper.fetchRandomUsername());
        if(!this.cache.has(user.username)){
            this.cache.set(user.username,user);
        }
        return user;
    }
}
class Member{
    /**
     * @type {string} The member's nickname
     */
    username;
    /**
     * @type {string} Timestamp of when the member was last seen online
     */
    lastseen;
    /**
     * @type {number} Amount of points gained by the member
     */
    points;
    /**
     * @type {number} The member's attack to defense ratio
     */
    battleratio;
}
class MemberManager extends Manager{
    /**
     * @type {ArtfightClient} The Artfight client           
     */
    client;
    /**
     * @type {ArtfightScrapper} The Artfight scrapper
     */
    #scrapper;
    /**
     * 
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
     * @param {number} limit Maximum amount of members fetched
     * @returns {Promise<Member[]>} List of members
     */
    async fetch(limit){
        let members = await this.#scrapper.fetchMembers(limit);
        for(let member of members){
            if(!this.cache.has(member.username)){
                this.cache.set(member.username,username);
            }
        }
        return members;
    }
}
module.exports={User,UserManager,ClientUser,UserStatus,MemberManager,Member}
/**
 * TODO:
 * Expand ClientUser
 * Implement cache (for all managers basically)
 * Implement completes
 */