"use strict";
/**
 * @enum {number}
 */
var Complete;
(function (Complete) {
    Complete[Complete["None"] = 0] = "None";
    Complete[Complete["Character"] = 1] = "Character";
    Complete[Complete["Comment"] = 2] = "Comment";
    Complete[Complete["User"] = 3] = "User";
    Complete[Complete["Submitions"] = 4] = "Submitions";
    Complete[Complete["Messages"] = 5] = "Messages";
    Complete[Complete["All"] = 6] = "All";
})(Complete || (Complete = {}));
;
/**
 * Names of events emitted by the client
 * @enum {string}
 */
var ClientEvents;
(function (ClientEvents) {
    /**
     * Emitted when the bookmark cache is updated
     */
    ClientEvents["BookmarkCacheUpdate"] = "bookmarkCacheUpdate";
    /**
     * Emitted when the member cache is updated
     */
    ClientEvents["MemberCacheUpdate"] = "memberCacheUpdate";
    /**
     * Emitted when the user cache is updated
     */
    ClientEvents["UserCacheUpdate"] = "userCacheUpdate";
    /**
     * Emitted when the character cache is updated
     */
    ClientEvents["CharacterCacheUpdate"] = "characterCacheUpdate";
    /**
     * Emitted when the attack cache is updated
     */
    ClientEvents["AttackCacheUpdate"] = "attackCacheUpdate";
    /**
     * Emitted when the defense cache is updated
     */
    ClientEvents["DefenseCacheUpdate"] = "defenseCacheUpdate";
    /**
     * Emitted when the message cache is updated
     */
    ClientEvents["MessageCacheUpdate"] = "messageCacheUpdate";
    /**
     * Emitted when the client is logged in
     */
    ClientEvents["Ready"] = "ready";
    /**
     * Emitted when the client user is ready
     */
    ClientEvents["ClientUserReady"] = "clientUserReady";
    /**
     * Emitted when the client user reveices a message
     */
    ClientEvents["MessageReceived"] = "messageReceived";
})(ClientEvents || (ClientEvents = {}));
/**
 * Names of events emitted by the task manager
 * @enum {string}
 */
var TaskManagerEvents;
(function (TaskManagerEvents) {
    /**
     * Emitted when the execution of the tasks is stopped
     */
    TaskManagerEvents["ExecutionStop"] = "executionStop";
})(TaskManagerEvents || (TaskManagerEvents = {}));
/**
 * Types of cache updates
 * @enum {string}
 */
var CacheUpdateTypes;
(function (CacheUpdateTypes) {
    CacheUpdateTypes["Add"] = "add";
    CacheUpdateTypes["Delete"] = "delete";
})(CacheUpdateTypes || (CacheUpdateTypes = {}));
;
export { Complete, ClientEvents, TaskManagerEvents, CacheUpdateTypes };
