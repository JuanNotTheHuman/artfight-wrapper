import { ArtfightClient } from "./client.js";
import { Manager,Cache } from "./manager.js";
/**
 * **To be implemented**
 */
class NotificationManager{
    client:ArtfightClient;
    constructor(client:ArtfightClient) {
        this.client = client;
    }   
}
/**
 * **To be implemented**
 */
class AttackNotificationManager extends NotificationManager{
    constructor(client:ArtfightClient) {
        super(client);
    }
}
/**
 * **To be implemented**
 */
class SubscriptionNotificationManager extends NotificationManager{
    constructor(client:ArtfightClient) {
        super(client);
    }
}
export{NotificationManager,AttackNotificationManager,SubscriptionNotificationManager}