import { ArtfightClient } from "./client.js";
import { CacheUpdateTypes, ClientEvents } from "./Enumarables.js";
import { Manager, Cache } from "./manager.js";
class MessagePartial{
    id:string;
    subject:string;
    from:string;
    date:string;
    constructor(id:string,subject:string,from:string,date:string){
        this.id=id;
        this.subject=subject;
        this.from=from;
        this.date=date;
    }
}
class Message extends MessagePartial{
    description?:string;
    constructor(id:string,subject:string,from:string,date:string,description?:string){
        super(id,subject,from,date)
        this.description=description;
    }
}
class MessageManager extends Manager{
    client:ArtfightClient;
    constructor(client:ArtfightClient,cache:Cache){
        super(cache)
        this.client=client;
    }
    /**
     * @param {number} limit 
     */
    async fetch(limit=5){
        let messages = await this.client.scrapper.fetchClientUserMessages(limit);
        let cachedMessages=[];
        for(let message of messages){
            if(!this.cache.has(message.id)){
                this.cache.set(message.id,message)
                cachedMessages.push(message)
            }
        }
        if(cachedMessages.length>0){
            this.client.emit(ClientEvents.MessageCacheUpdate,{type:CacheUpdateTypes.Add,value:cachedMessages})
        }
        return messages;
    }
}
export{MessageManager,MessagePartial,Message}