import { Manager } from "./manager.js";
import { CacheUpdateTypes, ClientEvents } from "./Enumarables.js";
class CharacterPartial {
    icon;
    name;
    link;
    id;
    constructor(icon, name, link, id) {
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
    id;
    /**
     * Name of the character
     */
    name;
    /**
     * Timestamp of when the character got uploaded
     */
    created;
    /**
     * Links to images of the character
     */
    images;
    /**
     * Description of the character
     */
    description;
    /**
     * Character permissions
     */
    permissions;
    /**
     * Attacks made on the character
     */
    attacks;
    /**
     * The character's information
     */
    information;
    /**
     * Character tags
     */
    tags;
    /**
     * Comments on the character
     */
    comments;
    constructor(id, name, created, images, description, permissions, attacks, information, tags, comments) {
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
    async bookmark(client, order, description) {
        await client.scrapper.bookmarkCharacter(this.id, order, description);
        if (!client.user.bookmarks.cache.has(this.id)) {
            client.user.bookmarks.cache.set(this.id, this);
            client.emit(ClientEvents.BookmarkCacheUpdate, { type: CacheUpdateTypes.Add, value: client.user.bookmarks.cache.get(this.id) });
        }
        return client.user.bookmarks.cache.has(this.id);
    }
    /**
     * Unbookmarks the character
     * @param client The Artfight client
     */
    async unbookmark(client) {
        await client.scrapper.unbookmarkCharacter(this.id);
        if (client.user.bookmarks.cache.has(this.id)) {
            client.emit(ClientEvents.BookmarkCacheUpdate, { type: CacheUpdateTypes.Delete, value: client.user.bookmarks.cache.get(this.id) });
            client.user.bookmarks.cache.delete(this.id);
        }
    }
    /**
     * @returns {string} The link to the character's Artfight page
     */
    link() {
        return `https://artfight.net/character/${this.id}.${this.name}`;
    }
}
class CharacterInformation {
    /**
     * The owner's nickname
     */
    owner;
    /**
     * The designer's nickname
     */
    designer;
    /**
     * More information about the character (link to external website)
     */
    moreinfo;
    constructor(owner, designer, moreinfo) {
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
    client;
    constructor(client, cache) {
        super(cache);
        this.client = client;
    }
    /**
     * Fetches all of the User's characters
     * @param username The User's username
     * @emits ClientEvents.CharacterCacheUpdate
     * @returns {Promise<Character[]>} The User's characters
     */
    async fetch(username) {
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
    async fetchById(id) {
        let character = await this.client.scrapper.fetchUserCharacter(`https://artfight.net/character/${id}`);
        if (!this.cache.has(character.information.owner)) {
            this.cache.set(character.information.owner, [character]);
            this.client.emit(ClientEvents.CharacterCacheUpdate, { type: CacheUpdateTypes.Add, value: character });
        }
        else if (Array.isArray(this.cache.get(character.information.owner)) && !this.cache.get(character.information.owner).map(r => r.name).includes(character.name)) {
            let ownerCharacters = this.cache.get(character.information.owner);
            ownerCharacters.push(character);
            this.cache.set(character.information.owner, ownerCharacters);
            this.client.emit(ClientEvents.CharacterCacheUpdate, { type: CacheUpdateTypes.Add, value: character });
        }
        return character;
    }
    /**
     * Fetches a random character
     * @emits ClientEvents.CharacterCacheUpdate
     * @returns {Promise<Character>} A random character
     */
    async random() {
        let character = await this.client.scrapper.fetchRandomCharacter();
        if (!this.cache.has(character.information.owner)) {
            this.cache.set(character.information.owner, [character]);
            this.client.emit(ClientEvents.CharacterCacheUpdate, { type: CacheUpdateTypes.Add, value: character });
        }
        else if (Array.isArray(this.cache.get(character.information.owner)) && !this.cache.get(character.information.owner).map(r => r.name).includes(character.name)) {
            let ownerCharacters = this.cache.get(character.information.owner);
            ownerCharacters.push(character);
            this.cache.set(character.information.owner, ownerCharacters);
            this.client.emit(ClientEvents.CharacterCacheUpdate, { type: CacheUpdateTypes.Add, value: character });
        }
        return character;
    }
    /**
     * Searches for characters by tags
     * @param tags Character tags
     * @param limit Maximum amount of characters returned
     * @emits ClientEvents.CharacterCacheUpdate
     * @returns {Promise<Character[]>} List of characters
     */
    async tagSearch(tags, limit) {
        let characters = await this.client.scrapper.fetchCharactersByTag(tags, limit);
        for (let character of characters) {
            const ownerCharacters = this.cache.get(character.information.owner);
            if (!ownerCharacters.map(r => r.name).includes(character.name)) {
                ownerCharacters.push(character);
                this.cache.set(character.information.owner, ownerCharacters);
                this.client.emit(ClientEvents.CharacterCacheUpdate, { type: CacheUpdateTypes.Add, value: character });
            }
        }
        return characters;
    }
}
export { CharacterManager, Character, CharacterInformation, CharacterPartial };
