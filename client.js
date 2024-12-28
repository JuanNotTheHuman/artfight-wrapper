const { UserManager, ClientUser, MemberManager } = require("./user");
const { SubmitionManager } = require("./sumbition");
const {Cache} = require("./manager")
const {ArtfightScrapper} = require("./scrapper");
const { CharacterManager } = require("./character");
const {EventEmitter} = require("events");
const {BookmarkManager} =require("./bookmark")
const { Complete } = require("./Enumarables");
class ArtfightClient extends EventEmitter{
    /**
     * @type {ArtfightScrapper} The client's scrapper
     */
    scrapper = new ArtfightScrapper(this);
    /**
     * @type {ClientUser} The client's user (the user that logged in via the client)
     */
    user;
    /**
     * @type {UserManager} Artfight's users
     */
    users;
    /**
     * @type {MemberManager} Artfight's members
     */
    members;
    /**
     * @type {SubmitionManager} Artfight's attacks
     */
    attacks;
    /**
     * @type {SubmitionManager} Artfight's defenses
     */
    defenses;
    /**
     * @type {CharacterManager} Artfight's characters
     */
    characters;
    /**
     * @type {Complete|Complete[]} Allowed types (made for better cpu performance), specifies which types to fetch completely.
     */
    completes;
    /**
     * @param {string} username Username for login
     * @param {string} password Password for login
     * @param {Function|undefined} callback Function that gets called after login
     * @param {Complete|Complete[]} completes Allowed types (made for better cpu performance), specifies which types to fetch completely.
     */
    async login(username,password,callback,completes=Complete.None){
        await this.scrapper.login(username,password);
        this.users=new UserManager(this,new Cache());
        this.attacks=new SubmitionManager(this,new Cache(),"attack");
        this.defenses=new SubmitionManager(this,new Cache(),"defense");
        this.characters=new CharacterManager(this,new Cache());
        this.members=new MemberManager(this,new Cache(),this);
        this.user=await new ClientUser(this,username).init();
        this.user.bookmarks=new BookmarkManager(this,new Cache());
        this.completes=completes;
        if(callback!=undefined){
            callback()
        }
        this.emit("ready",this)
    }
}
module.exports={ArtfightClient}