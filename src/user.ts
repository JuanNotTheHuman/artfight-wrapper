import { CharacterManager } from "./character.js";
import { TaskManager } from "./task.js";
import { SubmitionManager } from "./sumbition.js";
import { Manager, Cache } from "./manager.js";
import { ArtfightClient } from "./client.js";
import { CacheUpdateTypes, ClientEvents } from "./Enumarables.js";
import { BookmarkManager } from "./bookmark.js";
import { Comment } from "./comment.js";

class UserStatus {
    /**
     * The timestamp of when the user was last seen online
     */
    lastseen: string;
    /**
     * The timestamp of when the user joined Artfight
     */
    joined: string;
    /**
     * The user's current team
     */
    team: string;
    constructor(lastseen: string, joined: string, team: string) {
        this.lastseen = lastseen;
        this.joined = joined;
        this.team = team;
    }
}
class BattleStatistics {
    /**
     * The attack to defense ratio of the user
     */
    ratio: number;
    /**
     * Amount of points accumulated by the user
     */
    points: number;
    /**
     * Amount of attacks done by the user
     */
    attacks: number;
    /**
     * Amount of friendly fire attacks done by the user
     */
    friendlyfire: number;
    /**
     * Amount of defenses done by the user
     */
    defenses: number;
    /**
     * Amount of followers the user has
     */
    followers?: number;
    /**
     * Amount of users followed by the user
     */
    following?: number;
    /**
     * Amount of characters posted by the user
     */
    characters?: number;
    constructor(ratio: number,points: number,attacks: number,friendlyfire: number,defenses: number,characters?: number,followers?: number,following?: number)
    {
        this.ratio = ratio;
        this.points = points;
        this.attacks = attacks;
        this.friendlyfire = friendlyfire;
        this.defenses = defenses;
        if (followers) {
            this.followers = followers;
        }
        if (following) {
            this.following = following;
        }
        if (characters) {
            this.characters = characters;
        }
    }
}
class UserStatistics {
    /**
     * Overall battle statistics
     */
    overall: BattleStatistics;
    /**
     * Current battle statistics
     */
    current: BattleStatistics;
    /**
     * User's achievements
     */
    achievements: string[];
    constructor(overall: BattleStatistics, current: BattleStatistics, achievements: string[]) {
        this.overall = overall;
        this.current = current;
        this.achievements = achievements;
    }
}
class User {
    /**
     * The Artfight client
     */
    client: ArtfightClient;
    /**
     * The user's nickname
     */
    username: string;
    /**
     * The user's status
     */
    status?: UserStatus;
    /**
     * The user's attacks manager
     */
    attacks: SubmitionManager;
    /**
     * The user's defenses manager
     */
    defenses: SubmitionManager;
    /**
     * The user's characters manager
     */
    characters: CharacterManager;
    /**
     * The user's statistics
     */
    statistics?: UserStatistics;
    /**
     * Url of the user's avatar
     */
    avatar?: string;
    /**
     * Comments made on the user's page
     */
    comments?: Comment[];
    constructor(client: ArtfightClient, username: string) {
        this.client = client;
        this.username = username;
        this.attacks = this.client.attacks;
        this.defenses = this.client.defenses;
        this.characters = this.client.characters;
    }
    /**
     * @returns {string} The link to the user's Artfight page
     */
    link(): string {
        return `https://artfight.net/~${this.username}`;
    }
}
class ClientUser extends User {
    /**
     * The logged in user's bookmark manager
     */
    bookmarks: BookmarkManager;
    constructor(client: ArtfightClient, username: string) {
        super(client, username);
        this.bookmarks = new BookmarkManager(client, new Cache());
    }
    /**
     * Initializes the client's user
     * @returns {Promise<ClientUser>} The client's user
     * @emits ClientEvents.ClientUserReady
     */
    async init(): Promise<ClientUser> {
        let user: User = await this.client.users.fetch(this.username);
        this.statistics=user.statistics;
        this.avatar=user.avatar;
        this.status=user.status;
        this.comments=user.comments;
        this.client.emit(ClientEvents.ClientUserReady, this);
        return this;
    }
    /**
     * @returns {Promise<void>} Logs out the user
     */
    async logout(){
        return await this.client.scrapper.logout();
    }
}
class UserManager extends Manager {
    /**
     * The Artfight client
     */
    client: ArtfightClient;
    constructor(client: ArtfightClient, cache: Cache) {
        super(cache);
        this.client = client;
    }
    /**
     * @param {string} username User's nickname
     * @returns {Promise<User>} The user with the given nickname
     * @emits ClientEvents.UserCacheUpdate
     */
    async fetch(username: string): Promise<User> {
        const user = new User(this.client, username);
        const manager = new TaskManager();
        manager.tasks.push(
            new Promise<void>(async (r) => {
                const status = await this.client.scrapper.fetchUserStatus(username);
                if (status) {
                    const { lastseen, joined, team } = status;
                    user.status = new UserStatus(lastseen, joined, team);
                }
                r();
            }),
            new Promise<void>(async (r) => {
                const avatar = await this.client.scrapper.fetchUserImage(username);
                user.avatar = avatar !== null ? avatar : "";
                r();
            }),
            new Promise<void>(async (r) => {
                let { current, overall, achivements } = await this.client.scrapper.fetchUserStatistics(username);
                user.statistics = new UserStatistics(
                    new BattleStatistics(Number(overall[0]),Number(overall[1]),Number(overall[2]),Number(overall[3]),Number(overall[4]),overall[5] ? Number(overall[5]) : undefined,overall[6] ? Number(overall[6]) : undefined,overall[7] ? Number(overall[7]) : undefined),
                    new BattleStatistics(Number(current[1]),Number(current[2]),Number(current[3]),Number(current[4]),Number(current[5]),Number(current[6]),Number(current[7]),Number(current[8])),
                    achivements.map(a => a[1])
                );
                r();
            }),
            new Promise<void>(async (r) => {
                let pg = await this.client.scrapper.pages.get();
                await pg.page.goto(`https://artfight.net/~${username}`);
                let comments = await this.client.scrapper.fetchComments(pg.page) as Comment[];
                let comm = comments.map(r=> new Comment(r.author, r.content, r.posted ?? ''))
                user.comments = comm;
                this.client.scrapper.pages.return(pg.index);
                r();
            })
        );
        await manager.execute();
        if (!this.cache.has(user.username)) {
            this.cache.set(user.username, user);
            this.client.emit(ClientEvents.UserCacheUpdate, { type: CacheUpdateTypes.Add, value: user });
        }
        return user;
    }
    /**
     * @returns {Promise<User>} A random user
     * @emits ClientEvents.UserCacheUpdate
     */
    async random(): Promise<User> {
        let user = await this.fetch(await this.client.scrapper.fetchRandomUsername());
        if (!this.cache.has(user.username)) {
            this.cache.set(user.username, user);
            this.client.emit(ClientEvents.UserCacheUpdate, { type: CacheUpdateTypes.Add, value: user });
        }
        return user;
    }
}
class Member {
    /**
     * The member's nickname
     */
    username: string;
    /**
     * Timestamp of when the member was last seen online
     */
    lastseen: string;
    /**
     * Amount of points gained by the member
     */
    points: number;
    /**
     * The member's attack to defense ratio
     */
    battleratio: number;
    constructor(username:string,lastseen:string,points:number,battleratio:number){
        this.username=username;
        this.lastseen=lastseen;
        this.points=points;
        this.battleratio=battleratio;
    }
}

class MemberManager extends Manager {
    /**
     * The Artfight client
     */
    client: ArtfightClient;
    constructor(client: ArtfightClient, cache: Cache) {
        super(cache);
        this.client = client;
    }
    /**
     * @param {number} limit Maximum amount of members fetched
     * @emits ClientEvents.MemberCacheUpdate
     * @returns {Promise<Member[]>} List of members
     */
    async fetch(limit: number): Promise<Member[]> {
        let members = await this.client.scrapper.fetchMembers(limit);
        for (let member of members) {
            if (!this.cache.has(member.username)) {
                this.cache.set(member.username, member);
            }
        }
        this.client.emit(ClientEvents.MemberCacheUpdate, { type: CacheUpdateTypes.Add, value: members });
        return members;
    }
}

export { User, UserManager, ClientUser, UserStatus, MemberManager, Member };