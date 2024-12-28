/**
 * @enum {number}
 */
const Complete = {
    /** @type {number} */
    None: 0,
    /**@type {number} */
    Character: 1,
    /** @type {number} */
    Comment: 2,
    /** @type {number} */
    User: 3,
    /** @type {number} */
    Submitions: 4,
    /** @type {number} */
    All: 5
};
/**
 * Names of events emitted by the client
 * @enum {string}
 */
const ClientEvents = {
    /** 
     * Emitted when the bookmark cache is updated
     * @type {string} 
     */
    BookmarkCacheUpdate: "bookmarkCacheUpdate",
    /**
     * Emitted when the member cache is updated
     * @type {string}
     */
    MemberCacheUpdate: "memberCacheUpdate",
    /**
     * Emitted when the user cache is updated
     * @type {string}
     */
    UserCacheUpdate: "userCacheUpdate",
    /**
     * Emitted when the character cache is updated
     * @type {string}
     */
    CharacterCacheUpdate: "characterCacheUpdate",
    /**
     * Emitted when the attack cache is updated
     * @type {string}
     */
    AttackCacheUpdate: "attackCacheUpdate",
    /**
     * Emitted when the defense cache is updated
     * @type {string}
     */
    DefenseCacheUpdate: "defenseCacheUpdate",
    /**
     * Emitted when the client is logged in (ready to reveice commands)
     * @type {string}
     */
    Ready: "ready"
}
/**
 * Names of events emitted by the task manager
 * @enum {string}
 */
const TaskManagerEvents={
    /**
     * Emitted when the execution of the tasks is stopped
     */
    ExecutionStop: "executionStop"
}
/**
 * Types of cache updates
 * @enum {string}
 */
const CacheUpdateTypes = {
    /** @type {string} */
    Add: "add",
    /** @type {string} */
    Delete: "delete"
};
module.exports = { Complete, CacheUpdateTypes, ClientEvents, TaskManagerEvents };
