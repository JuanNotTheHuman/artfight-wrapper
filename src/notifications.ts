import { ArtfightClient } from "./client.js";
import { ClientEvents, NotificationType,SubscriptionNotificationType } from "./Enumarables.js";
import { Manager,Cache } from "./manager.js";
class Notification{
    type:NotificationType;
    content:string;
    timestamp:string;
    constructor(type:NotificationType,content:string,timestamp:string){
        this.type=type;
        this.content=content;
        this.timestamp=timestamp;
    }
}
class Subscription{
    type:SubscriptionNotificationType;
    content:string;
    user:string;
    constructor(type:SubscriptionNotificationType,content:string,user:string){
        this.type=type;
        this.content=content;
        this.user=user;
    }
}
/**
 * **To be implemented** 
 */
class NotificationManager extends Manager{
    client:ArtfightClient;
    constructor(client:ArtfightClient,cache:Cache) {
        super(cache)
        this.client = client;
    }
    async fetch(limit: number = 5) {
        let notifications = await this.client.scrapper.fetchNotifications(limit);
        let newNotifications: Notification[] = [];
        for (let notification of notifications) {
            const existingNotifications = this.cache.get(notification.type) as Notification[] | undefined;
            if (!existingNotifications?.some(r => r.content === notification.content && r.timestamp === notification.timestamp && r.type === notification.type)) {
                newNotifications.push(notification);
                if (existingNotifications) {
                    this.cache.set(notification.type,existingNotifications.push(notification))
                } else {
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
class AttackNotificationManager extends Manager{
    client:ArtfightClient;
    constructor(client:ArtfightClient,cache:Cache) {
        super(cache)
        this.client = client;
    }
    // override async fetch(){
        
    // }
}
/**
 * **To be implemented** need to wait till june
 */
class SubscriptionNotificationManager extends Manager{
    client:ArtfightClient;
    constructor(client:ArtfightClient,cache:Cache) {
        super(cache)
        this.client = client;
    }
    async fetch(){
        
    }
}
export{NotificationManager,AttackNotificationManager,SubscriptionNotificationManager,Notification,Subscription}