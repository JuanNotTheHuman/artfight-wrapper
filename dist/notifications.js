import { ClientEvents } from "./Enumarables.js";
import { Manager } from "./manager.js";
class Notification {
    type;
    content;
    timestamp;
    constructor(type, content, timestamp) {
        this.type = type;
        this.content = content;
        this.timestamp = timestamp;
    }
}
class Subscription {
    type;
    content;
    user;
    constructor(type, content, user) {
        this.type = type;
        this.content = content;
        this.user = user;
    }
}
/**
 * **To be implemented**
 */
class NotificationManager extends Manager {
    client;
    constructor(client, cache) {
        super(cache);
        this.client = client;
    }
    async fetch(limit = 5) {
        let notifications = await this.client.scrapper.fetchNotifications(limit);
        let newNotifications = [];
        for (let notification of notifications) {
            const existingNotifications = this.cache.get(notification.type);
            if (!existingNotifications?.some(r => r.content === notification.content && r.timestamp === notification.timestamp && r.type === notification.type)) {
                newNotifications.push(notification);
                if (existingNotifications) {
                    this.cache.set(notification.type, existingNotifications.push(notification));
                }
                else {
                    this.cache.set(notification.type, [notification]);
                }
            }
        }
        if (newNotifications.length > 0) {
            this.client.emit(ClientEvents.NotificationReceived, newNotifications);
        }
        return notifications;
    }
}
/**
 * **To be implemented** need to wait till june
 */
class AttackNotificationManager extends Manager {
    client;
    constructor(client, cache) {
        super(cache);
        this.client = client;
    }
}
/**
 * **To be implemented** need to wait till june
 */
class SubscriptionNotificationManager extends Manager {
    client;
    constructor(client, cache) {
        super(cache);
        this.client = client;
    }
    async fetch() {
    }
}
export { NotificationManager, AttackNotificationManager, SubscriptionNotificationManager, Notification, Subscription };
