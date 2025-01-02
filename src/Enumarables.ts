"use strict";

import { ArtfightClient } from "./client.js";
import { BookmarkCharacter } from "./bookmark.js";
import { Member, User, ClientUser } from "./user.js";
import { Character } from "./character.js";
import { Submition } from "./sumbition.js";
import { Message } from "./message.js";
/**
 * @enum {number}
 */
enum Complete{
    None,
    Character,
    Comment,
    User,
    Submitions,
    Messages,
    All
};
/**
 * Names of events emitted by the client
 * @enum {string}
 */
enum ClientEvents {
    /**
     * Emitted when the bookmark cache is updated
     */
    BookmarkCacheUpdate = "bookmarkCacheUpdate",
    /**
     * Emitted when the member cache is updated
     */
    MemberCacheUpdate = "memberCacheUpdate",
    /**
     * Emitted when the user cache is updated
     */
    UserCacheUpdate = "userCacheUpdate",
    /**
     * Emitted when the character cache is updated
     */
    CharacterCacheUpdate = "characterCacheUpdate",
    /**
     * Emitted when the attack cache is updated
     */
    AttackCacheUpdate = "attackCacheUpdate",
    /**
     * Emitted when the defense cache is updated
     */
    DefenseCacheUpdate = "defenseCacheUpdate",
    /**
     * Emitted when the message cache is updated
     */
    MessageCacheUpdate="messageCacheUpdate",
    /**
     * Emitted when the client is logged in
     */
    Ready = "ready",
    /**
     * Emitted when the client user is ready
     */
    ClientUserReady="clientUserReady",

    /**
     * Emitted when the client user reveices a message
     */
    MessageReceived="messageReceived"
}
interface IClientEvents {
    [ClientEvents.BookmarkCacheUpdate]: [{ type: CacheUpdateTypes, value: (string | string[])|(BookmarkCharacter|BookmarkCharacter[]) }];
    [ClientEvents.MemberCacheUpdate]: [{ type: CacheUpdateTypes, value: Member | Member[] }];
    [ClientEvents.UserCacheUpdate]: [{ type: CacheUpdateTypes, value: User | User[] }];
    [ClientEvents.CharacterCacheUpdate]: [{ type: CacheUpdateTypes, value: Character | Character[] }];
    [ClientEvents.AttackCacheUpdate]: [{ type: CacheUpdateTypes, value: Submition | Submition[] }];
    [ClientEvents.DefenseCacheUpdate]: [{ type: CacheUpdateTypes, value: Submition | Submition[] }];
    [ClientEvents.MessageCacheUpdate]: [{type:CacheUpdateTypes, value: Message|Message[]}]
    [ClientEvents.Ready]: [client: ArtfightClient];
    [ClientEvents.ClientUserReady]: [user:ClientUser];
    [ClientEvents.MessageReceived]: [message:Message];
}
/**
 * Names of events emitted by the task manager
 * @enum {string}
 */
enum TaskManagerEvents{
    /**
     * Emitted when the execution of the tasks is stopped
     */
    ExecutionStop="executionStop"
}
/**
 * Types of cache updates
 * @enum {string}
 */
enum CacheUpdateTypes{
    Add= "add",
    Delete="delete"
};
export{Complete,ClientEvents,TaskManagerEvents,CacheUpdateTypes,IClientEvents};
