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
}
export { ArtfightBrowse, BrowseAttacks, BrowseCharacters };
