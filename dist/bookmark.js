import { Manager } from "./manager.js";
import { CacheUpdateTypes, ClientEvents } from "./Enumarables.js";
class BookmarkCharacter {
    /**
     * @type {string} The character's identification index
     */
    id;
    /**
     * @type {string} The character's name
     */
    name;
    /**
     * @type {string} Url to the character's icon
     */
    icon;
    /**
     * @type {string} Nickname of the character's owner
     */
    owner;
    /**
     * @type {string} The bookmarks's description
     */
    description;
    /**
     * @type {string} The timestamp of when the bookmark was last updated
     */
    updated;
    /**
     * @type {string} The ordering index of the bookmark
     */
    order;
    /**
     *
     * @param {string} id The character's identification index
     * @param {string} name The character's name
     * @param {string} icon Url to the character's icon
     * @param {string} owner Nickname of the character's owner
     * @param {string} description The bookmarks's description
     * @param {string} updated The timestamp of when the bookmark was last updated
     * @param {string} order The ordering index of the bookmark
     */
    constructor(id, name, icon, owner, description, updated, order) {
        this.id = id;
        this.name = name;
        this.icon = icon;
        this.owner = owner;
        this.description = description;
        this.updated = updated;
        this.order = order;
    }
    /**
     * @returns {string} The link to the character's Artfight page
     */
    link() {
        return `https://artfight.net/character/${this.id}.${this.name}`;
    }
    /**
     * Removes the bookmark from Artfight
     * @param {ArtfightClient} client The Artfight client
     * @emits ClientEvents.BookmarkCacheUpdate
     * @returns {Promise<void>} Unbookmarks the character
     */
    async remove(client) {
        await client.scrapper.unbookmarkCharacter(this.id);
        if (client.user.bookmarks.cache.has(this.id)) {
            client.user.bookmarks.cache.delete(this.id);
            client.emit(ClientEvents.BookmarkCacheUpdate, { type: CacheUpdateTypes.Delete, value: this.id });
        }
    }
}
class BookmarkManager extends Manager {
    /**
     * @type {ArtfightClient} The Artfight client
     */
    client;
    /**
    * @param {Cache} cache The cache
    * @param {ArtfightClient} client The Artfight client
    */
    constructor(client, cache) {
        super(cache);
        this.client = client;
    }
    /**
     * Fetches bookmarks from Artfight
     * @param {number} limit Maximum amount of bookmarks returned
     * @emits ClientEvents.BookmarkCacheUpdate
     * @return {Promise<BookmarkCharacter[]>} List of bookmarks
     */
    async fetch(limit) {
        let bookmarks = (await this.client.scrapper.fetchClientUserBookmarks(limit)).map((r) => {
            let [id, name, icon, owner, description, updated, order] = r;
            let bookmark = new BookmarkCharacter(id, name, icon, owner, description, updated, order);
            if (!this.cache.has(bookmark.id)) {
                this.cache.set(bookmark.id, bookmark);
            }
            return bookmark;
        });
        this.client.emit(ClientEvents.BookmarkCacheUpdate, { type: CacheUpdateTypes.Add, value: bookmarks });
        return bookmarks;
    }
    /**
     * Fetches a bookmark from Artfight at the specified index starting from 0
     * @param {number} index Index of the bookmark to be fetched starting from 0
     * @emits ClientEvents.BookmarkCacheUpdate
     * @returns {Promise<BookmarkCharacter>} The bookmark at the specified index
     */
    async fetchIndex(index) {
        let [id, name, icon, owner, description, updated, order] = await this.client.scrapper.fetchClientUserBookmarkAtIndex(index);
        let bookmark = new BookmarkCharacter(id, name, icon, owner, description, updated, order);
        if (!this.cache.has(bookmark.id)) {
            this.cache.set(bookmark.id, bookmark);
        }
        this.client.emit(ClientEvents.BookmarkCacheUpdate, { type: CacheUpdateTypes.Add, value: bookmark });
        return bookmark;
    }
    /**
     * Fetches a range of bookmarks from Artfight
     * @param {number} start The starting index of the range of bookmarks to be fetched
     * @param {number} end The ending index of the range of bookmarks to be fetched
     * @emits ClientEvents.BookmarkCacheUpdate
     * @returns {Promise<BookmarkCharacter[]>} List of bookmarks in the specified range
     */
    async fetchRange(start, end) {
        let bookmarks = (await this.client.scrapper.fetchClientUserBookmarksRange(start, end)).map((r) => {
            let [id, name, icon, owner, description, updated, order] = r;
            let bookmark = new BookmarkCharacter(id, name, icon, owner, description, updated, order);
            if (!this.cache.has(bookmark.id)) {
                this.cache.set(bookmark.id, bookmark);
            }
            return bookmark;
        });
        this.client.emit(ClientEvents.BookmarkCacheUpdate, { type: CacheUpdateTypes.Add, value: bookmarks });
    }
    /**
     * Removes bookmarks from both cache and Artfight
     * @param {number} amount Amount of bookmarks to be removed, starting from beggining
     * @emits ClientEvents.BookmarkCacheUpdate
     * @returns {Promise<string[]>} List of identification indexes of removed bookmarks
     */
    async remove(amount) {
        let ids = await this.client.scrapper.deleteClientUserBookmarks(amount);
        for (let id of ids) {
            this.cache.delete(id);
        }
        this.client.emit(ClientEvents.BookmarkCacheUpdate, { type: CacheUpdateTypes.Delete, value: ids });
        return ids;
    }
    /**
     * Removes the bookmark at the specified index from cache and Artfight
     * @param {string} id Identification index of bookmark's character to be removed
     * @emits ClientEvents.BookmarkCacheUpdate
     * @return {Promise<boolean>} Whether the bookmark was removed successfully
     */
    async removeCharacterById(id) {
        if (await this.client.scrapper.deleteClientUserBookmarkByCharacterId(id) == true) {
            this.cache.delete(id);
            this.client.emit(ClientEvents.BookmarkCacheUpdate, { type: CacheUpdateTypes.Delete, value: id });
            return true;
        }
        return false;
    }
    /**
     * Removes all bookmarks from cache and Artfight
     * @returns {Promise<void>}
     */
    async removeAll() {
        await this.client.scrapper.deleteClientUserBookmarksAll();
        this.client.emit(ClientEvents.BookmarkCacheUpdate, { type: CacheUpdateTypes.Delete, value: this.cache.keys() });
        this.cache.flushAll();
        return;
    }
}
export { BookmarkManager, BookmarkCharacter };
