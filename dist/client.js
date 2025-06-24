"use strict";
import { EventEmitter } from 'events';
import { ArtfightScrapper } from './scrapper.js';
import { ClientEvents } from './Enumarables.js';
import { ClientUser, UserManager } from './user.js';
import { SubmitionManager } from './sumbition.js';
import { CharacterManager } from './character.js';
import { Cache } from './manager.js';
import { Complete } from './Enumarables.js';
import { MessageManager } from './message.js';
import { ArtfightBrowse } from './browse.js';
import { NotificationManager } from './notifications.js';
/**
 * @class ArtfightClient
 * @extends EventEmitter
 * @description A client for interacting with the Artfight API
 */
class ArtfightClient extends EventEmitter {
    /**
     * The client's scrapper
     */
    scrapper;
    /**
     * The client's user (the user that logged in via the client)
     */
    user;
    /**
     * Artfight's users
     */
    users;
    /**
     * Artfight's members
     */
    /**
     * Artfight's attacks
     */
    attacks;
    /**
     * Artfight's defenses
     */
    defenses;
    /**
     * Artfight's characters
     */
    characters;
    /**
     * Artfight's messages
     */
    messages;
    /**
     * Artfight's notifications
     */
    notifications;
    /**
     * Allowed types (made for better CPU performance), specifies which types to fetch completely.
     */
    completes;
    /**
     * Artfight's browse feature
     */
    browse;
    constructor() {
        super();
        this.scrapper = new ArtfightScrapper(this);
        this.user = {};
        this.users = {};
        this.attacks = {};
        this.defenses = {};
        this.characters = {};
        this.messages = {};
        this.browse = {};
        this.notifications = {};
        this.completes = Complete.None;
    }
    /**
     * Logs in the user and initializes the Artfight client.
     * Emits a `Ready` event when the client is ready.
     * @param {string} username - Username for login
     * @param {string} password - Password for login
     * @param {Complete|Complete[]} completes - Allowed types (made for better CPU performance), specifies which types to fetch completely.
     * @emits ClientEvents.Ready - Emitted when the client is ready and logged in
     */
    async login(username, password, completes = Complete.None) {
        await this.scrapper.login(username, password);
        this.users = new UserManager(this, new Cache());
        this.attacks = new SubmitionManager(this, new Cache(), "attack");
        this.defenses = new SubmitionManager(this, new Cache(), "defense");
        this.characters = new CharacterManager(this, new Cache());
        this.user = await new ClientUser(this, username).init();
        this.messages = new MessageManager(this, new Cache());
        this.notifications = new NotificationManager(this, new Cache());
        this.completes = completes;
        this.browse = new ArtfightBrowse(this);
        this.emit(ClientEvents.Ready, this);
    }
    on(event, listener) {
        if (event === ClientEvents.MessageReceived) {
            this.scrapper.listenClientUserMessageReceived();
        }
        return super.on(event, listener);
    }
    emit(event, ...args) {
        return super.emit(event, ...args);
    }
}
export { ArtfightClient };
