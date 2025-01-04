/**
 * **To be implemented**
 */
class NotificationManager {
    client;
    constructor(client) {
        this.client = client;
    }
}
/**
 * **To be implemented**
 */
class AttackNotificationManager extends NotificationManager {
    constructor(client) {
        super(client);
    }
}
/**
 * **To be implemented**
 */
class SubscriptionNotificationManager extends NotificationManager {
    constructor(client) {
        super(client);
    }
}
export { NotificationManager, AttackNotificationManager, SubscriptionNotificationManager };
