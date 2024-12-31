import { TaskManager } from "./task.js";
import { Manager, Cache } from "./manager.js";
import { CacheUpdateTypes, ClientEvents } from "./Enumarables.js";
import { BookmarkManager } from "./bookmark.js";
import { Comment } from "./comment.js";
class UserStatus {
    /**
     * The timestamp of when the user was last seen online
     */
    lastseen;
    /**
     * The timestamp of when the user joined Artfight
     */
    joined;
    /**
     * The user's current team
     */
    team;
    constructor(lastseen, joined, team) {
        this.lastseen = lastseen;
        this.joined = joined;
        this.team = team;
    }
}
class BattleStatistics {
    /**
     * The attack to defense ratio of the user
     */
    ratio;
    /**
     * Amount of points accumulated by the user
     */
    points;
    /**
     * Amount of attacks done by the user
     */
    attacks;
    /**
     * Amount of friendly fire attacks done by the user
     */
    friendlyfire;
    /**
     * Amount of defenses done by the user
     */
    defenses;
    /**
     * Amount of followers the user has
     */
    followers;
    /**
     * Amount of users followed by the user
     */
    following;
    /**
     * Amount of characters posted by the user
     */
    characters;
    constructor(ratio, points, attacks, friendlyfire, defenses, characters, followers, following) {
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
    overall;
    /**
     * Current battle statistics
     */
    current;
    /**
     * User's achievements
     */
    achievements;
    constructor(overall, current, achievements) {
        this.overall = overall;
        this.current = current;
        this.achievements = achievements;
    }
}
class User {
    /**
     * The Artfight client
     */
    client;
    /**
     * The user's nickname
     */
    username;
    /**
     * The user's status
     */
    status;
    /**
     * The user's attacks manager
     */
    attacks;
    /**
     * The user's defenses manager
     */
    defenses;
    /**
     * The user's characters manager
     */
    characters;
    /**
     * The user's statistics
     */
    statistics;
    /**
     * Url of the user's avatar
     */
    avatar;
    /**
     * Comments made on the user's page
     */
    comments;
    constructor(client, username) {
        this.client = client;
        this.username = username;
        this.attacks = this.client.attacks;
        this.defenses = this.client.defenses;
        this.characters = this.client.characters;
    }
    link() {
        return `https://artfight.net/~${this.username}`;
    }
}
class ClientUser extends User {
    /**
     * The logged in user's bookmark manager
     */
    bookmarks;
    constructor(client, username) {
        super(client, username);
        this.bookmarks = new BookmarkManager(client, new Cache());
    }
    /**
     * Initializes the client's user
     * @returns {Promise<ClientUser>} The client's user
     */
    async init() {
        const manager = new TaskManager();
        let user = new User(this.client, this.username);
        manager.tasks.push(new Promise(async (r) => {
            user = await this.client.users.fetch(this.username);
            r();
        }));
        this.statistics = user.statistics;
        this.avatar = user.avatar;
        this.status = user.status;
        this.comments = user.comments;
        await manager.execute();
        this.client.emit(ClientEvents.ClientUserReady, this);
        return this;
    }
}
class UserManager extends Manager {
    /**
     * The Artfight client
     */
    client;
    constructor(client, cache) {
        super(cache);
        this.client = client;
    }
    /**
     * @param {string} username User's nickname
     * @returns {Promise<User>} The user with the given nickname
     */
    async fetch(username) {
        const user = new User(this.client, username);
        const manager = new TaskManager();
        manager.tasks.push(new Promise(async (r) => {
            const status = await this.client.scrapper.fetchUserStatus(username);
            if (status) {
                const { lastseen, joined, team } = status;
                user.status = new UserStatus(lastseen, joined, team);
            }
            r();
        }), new Promise(async (r) => {
            const avatar = await this.client.scrapper.fetchUserImage(username);
            user.avatar = avatar !== null ? avatar : "";
            r();
        }), new Promise(async (r) => {
            let { current, overall, achivements } = await this.client.scrapper.fetchUserStatistics(username);
            user.statistics = new UserStatistics(new BattleStatistics(Number(overall[0]), Number(overall[1]), Number(overall[2]), Number(overall[3]), Number(overall[4]), overall[5] ? Number(overall[5]) : undefined, overall[6] ? Number(overall[6]) : undefined, overall[7] ? Number(overall[7]) : undefined), new BattleStatistics(Number(current[0]), Number(current[1]), Number(current[2]), Number(current[3]), Number(current[4]), current[5] ? Number(current[5]) : undefined, current[6] ? Number(current[6]) : undefined, current[7] ? Number(current[7]) : undefined), achivements.map(a => a[1]));
            r();
        }), new Promise(async (r) => {
            let pg = await this.client.scrapper.pages.get();
            await pg.page.goto(`https://artfight.net/~${username}`);
            let comments = await this.client.scrapper.fetchComments(pg.page);
            let comm = comments.map(r => new Comment(r.author, r.content, r.posted ?? ''));
            user.comments = comm;
            this.client.scrapper.pages.return(pg.index);
            r();
        }));
        await manager.execute();
        if (!this.cache.has(user.username)) {
            this.cache.set(user.username, user);
            this.client.emit(ClientEvents.UserCacheUpdate, { type: CacheUpdateTypes.Add, value: user });
        }
        return user;
    }
    /**
     * @returns {Promise<User>} A random user
     */
    async random() {
        let user = await this.fetch(await this.client.scrapper.fetchRandomUsername());
        if (!this.cache.has(user.username)) {
            this.cache.set(user.username, user);
        }
        return user;
    }
}
class Member {
    /**
     * The member's nickname
     */
    username;
    /**
     * Timestamp of when the member was last seen online
     */
    lastseen;
    /**
     * Amount of points gained by the member
     */
    points;
    /**
     * The member's attack to defense ratio
     */
    battleratio;
    constructor(username, lastseen, points, battleratio) {
        this.username = username;
        this.lastseen = lastseen;
        this.points = points;
        this.battleratio = battleratio;
    }
}
class MemberManager extends Manager {
    /**
     * The Artfight client
     */
    client;
    constructor(client, cache) {
        super(cache);
        this.client = client;
    }
    /**
     * @param {number} limit Maximum amount of members fetched
     * @returns {Promise<Member[]>} List of members
     */
    async fetch(limit) {
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
