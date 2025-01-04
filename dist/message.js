import { CacheUpdateTypes, ClientEvents } from "./Enumarables.js";
import { Manager } from "./manager.js";
class Message {
    id;
    subject;
    from;
    date;
    description;
    constructor(id, subject, from, date, description) {
        this.id = id;
        this.subject = subject;
        this.from = from;
        this.date = date;
        this.description = description;
    }
}
class MessageManager extends Manager {
    client;
    constructor(client, cache) {
        super(cache);
        this.client = client;
    }
    /**
     * @param {number} limit
     * @emits ClientEvents.MessageCacheUpdate
     * @returns {Promise<Message[]>}
     */
    async fetch(limit = 5) {
        let messages = await this.client.scrapper.fetchClientUserMessages(limit);
        let cachedMessages = [];
        for (let message of messages) {
            if (!this.cache.has(message.id)) {
                this.cache.set(message.id, message);
                cachedMessages.push(message);
            }
        }
        if (cachedMessages.length > 0) {
            this.client.emit(ClientEvents.MessageCacheUpdate, { type: CacheUpdateTypes.Add, value: cachedMessages });
        }
        return messages;
    }
}
export { MessageManager, Message };
