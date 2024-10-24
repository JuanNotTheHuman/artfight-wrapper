const { UserManager, ClientUser, MemberManager } = require("./user");
const { SubmitionManager } = require("./sumbition");
const {Cache} = require("./manager")
const {ArtfightScrapper} = require("./scrapper");
const { CharacterManager } = require("./character");
const {EventEmitter} = require("events");
const { Complete } = require("./partials");
class ArtfightClient extends EventEmitter{
    /**
     * @type {ArtfightScrapper}
     */
    scrapper = new ArtfightScrapper();
    /**
     * @type {ClientUser}
     */
    user;
    /**
     * @type {UserManager}
     */
    users;
    /**
     * @type {MemberManager}
     */
    members;
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
     * @type {Complete|Complete[]}
     */
    completes;
    /**
     * @param {String} username Username for login
     * @param {String} password Password for login
     * @param {Function} callback Function that gets called after login
     * @param {Complete|Complete[]} completes Allowed types (made for better cpu performance), specifies which types to fetch completely.
     */
    async login(username,password,callback,completes){
        await this.scrapper.login(username,password);
        this.users=new UserManager(this.scrapper,new Cache(),this);
        this.attacks=new SubmitionManager(this.scrapper,new Cache(),"attack");
        this.defenses=new SubmitionManager(this.scrapper,new Cache(),"defense");
        this.characters=new CharacterManager(this.scrapper,new Cache());
        this.members=new MemberManager(this.scrapper,new Cache(),this);
        this.user = await new ClientUser(this,username).init();
        this.completes=completes;
        callback();
    }
}
module.exports={ArtfightClient}