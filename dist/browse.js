import { ClientEvents, CacheUpdateTypes } from "./Enumarables.js";
import { Cache, Manager } from "./manager.js";
import { MemberManager } from "./user.js";
class ArtfightBrowse {
    /**
     * @type {MemberManager} The member manager
     */
    members;
    /**
     * @type {BrowseAttacks} The attack manager
     */
    attacks;
    /**
     * @type {BrowseCharacters} The character manager
     */
    characters;
    constructor(client, membersCache = new Cache(), attackCache = new Cache(), characterCache = new Cache()) {
        this.members = new MemberManager(client, membersCache);
        this.attacks = new BrowseAttacks(client, attackCache);
        this.characters = new BrowseCharacters(client, characterCache);
    }
}
class BrowseAttacks extends Manager {
    /**
     * @type {ArtfightClient} The Artfight client
     */
    client;
    constructor(client, cache) {
        super(cache);
        this.client = client;
    }
    /**
     * @param {number} limit Maximum amount of attacks to browse
     * @emits ClientEvents.BrowseAttackCacheUpdate
     * @returns {Promise<Attack[]>} List of attacks
     */
    async fetch(limit = 30) {
        let attacks = await this.client.scrapper.browseAttacks(limit);
        let newAttack = attacks.filter(attack => !this.cache.has(attack.link));
        for (let attack of attacks) {
            if (!this.cache.has(attack.link)) {
                this.cache.set(attack.link, attack);
            }
        }
        if (newAttack.length > 0) {
            this.client.emit(ClientEvents.BrowseAttackCacheUpdate, { type: CacheUpdateTypes.Add, value: newAttack });
        }
        return attacks;
    }
}
class BrowseCharacters extends Manager {
    /**
     * @type {ArtfightClient} The Artfight client
     */
    client;
    constructor(client, cache) {
        super(cache);
        this.client = client;
    }
    /**
     * @param {number} limit Maximum amount of characters to browse
     * @emits ClientEvents.BrowseCharacterCacheUpdate
     * @returns {Promise<Character[]>} List of characters
     */
    async fetch(limit = 30) {
        let characters = await this.client.scrapper.browseCharacters(limit);
        let newCharacters = characters.filter(character => !this.cache.has(character.id));
        for (let character of characters) {
            if (!this.cache.has(character.id)) {
                this.cache.set(character.id, character);
            }
        }
        if (newCharacters.length > 0) {
            this.client.emit(ClientEvents.BrowseCharacterCacheUpdate, { type: CacheUpdateTypes.Add, value: newCharacters });
        }
        return characters;
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
export { ArtfightBrowse, BrowseAttacks, BrowseCharacters };
