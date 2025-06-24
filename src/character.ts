import { ArtfightClient } from "./client.js";
import { Comment } from "./comment.js";
import { Manager, Cache } from "./manager.js";
import { Submition } from "./sumbition.js";
import { CacheUpdateTypes, ClientEvents } from "./Enumarables.js";
import { BookmarkCharacter } from "./bookmark.js";
class CharacterPartial{
    icon:string;
    name:string;
    link:string;
    id:string;
    constructor(icon:string,name:string,link:string,id:string){
        this.icon = icon;
        this.name = name;
        this.link = link;
        this.id = id;
    }
}
class Character {
    /**
     * Identification index of the character
     */
    id: string;
    /**
     * Name of the character
     */
    name: string;
    /**
     * Timestamp of when the character got uploaded
     */
    created: string;
    /**
     * Links to images of the character
     */
    images: string[];
    /**
     * Description of the character
     */
    description: string;
    /**
     * Character permissions
     */
    permissions: string;
    /**
     * Attacks made on the character
     */
    attacks: Submition[];
    /**
     * The character's information
     */
    information: CharacterInformation;
    /**
     * Character tags
     */
    tags: string[];
    /**
     * Comments on the character
     */
    comments: Comment[];
    constructor(
        id: string,
        name: string,
        created: string,
        images: string[],
        description: string,
        permissions: string,
        attacks: Submition[],
        information: CharacterInformation,
        tags: string[],
        comments: Comment[]
    ) {
        this.id = id;
        this.name = name;
        this.created = created;
        this.images = images;
        this.description = description;
        this.permissions = permissions;
        this.attacks = attacks;
        this.information = information;
        this.tags = tags;
        this.comments = comments;
    }

    /**
     * Bookmarks the character
     * @param client The Artfight client
     * @param order Order of the character
     * @param description Description of the bookmark `(not working)`
     * @emits ClientEvents.BookmarkCacheUpdate
     * @returns {Promise<boolean>} Returns true if the character was bookmarked
     */
    async bookmark(client: ArtfightClient, order: string, description: string): Promise<boolean> {
        await client.scrapper.bookmarkCharacter(this.id, order, description);
        if (!client.user.bookmarks.cache.has(this.id)) {
            client.user.bookmarks.cache.set(this.id, this);
            client.emit(ClientEvents.BookmarkCacheUpdate, { type: CacheUpdateTypes.Add, value: client.user.bookmarks.cache.get(this.id) as BookmarkCharacter});
        }
        return client.user.bookmarks.cache.has(this.id);
    }

    /**
     * Unbookmarks the character
     * @param client The Artfight client
     */
    async unbookmark(client: ArtfightClient): Promise<void> {
        await client.scrapper.unbookmarkCharacter(this.id);
        if (client.user.bookmarks.cache.has(this.id)) {
            client.emit(ClientEvents.BookmarkCacheUpdate, { type: CacheUpdateTypes.Delete, value: client.user.bookmarks.cache.get(this.id) as BookmarkCharacter });
            client.user.bookmarks.cache.delete(this.id);
        }

    }

    /**
     * @returns {string} The link to the character's Artfight page
     */
    link(): string {
        return `https://artfight.net/character/${this.id}.${this.name}`;
    }
}

class CharacterInformation {
    /**
     * The owner's nickname
     */
    owner: string;
    /**
     * The designer's nickname
     */
    designer: string;
    /**
     * More information about the character (link to external website)
     */
    moreinfo?: string;

    constructor(owner: string, designer: string, moreinfo?: string) {
        this.owner = owner;
        this.designer = designer;
        if (moreinfo) {
            this.moreinfo = moreinfo;
        }
    }
}

class CharacterManager extends Manager {
    /**
     * The manager's client
     */
    client: ArtfightClient;
    constructor(client: ArtfightClient, cache: Cache) {
        super(cache);
        this.client = client;
    }
    /**
     * Fetches all of the User's characters
     * @param username The User's username
     * @emits ClientEvents.CharacterCacheUpdate
     * @returns {Promise<Character[]>} The User's characters
     */
    async fetch(username: string): Promise<Character[]> {
        let characters = await this.client.scrapper.fetchUserCharacters(username);
        this.cache.set(username, characters);
        this.client.emit(ClientEvents.CharacterCacheUpdate, { type: CacheUpdateTypes.Add, value: characters });
        return characters;
    }
    /**
     * Fetches a character by its identification index
     * @param id The character's identification index
     * @emits ClientEvents.CharacterCacheUpdate
     * @returns {Promise<Character>} The character
     */
    async fetchById(id: string): Promise<Character> {
        let character = await this.client.scrapper.fetchUserCharacter(`https://artfight.net/character/${id}`);
        if (!this.cache.has(character.information.owner)) {
            this.cache.set(character.information.owner, [character]);
            this.client.emit(ClientEvents.CharacterCacheUpdate, { type: CacheUpdateTypes.Add, value: character });
        } else if (Array.isArray(this.cache.get(character.information.owner)) && !(this.cache.get(character.information.owner) as Character[]).map(r => r.name).includes(character.name)) {
            let ownerCharacters = this.cache.get(character.information.owner) as Character[];
            ownerCharacters.push(character);
            this.cache.set(character.information.owner, ownerCharacters);
            this.client.emit(ClientEvents.CharacterCacheUpdate, { type: CacheUpdateTypes.Add, value: character });
        }
        return character;
    }
}

export { CharacterManager, Character, CharacterInformation, CharacterPartial };