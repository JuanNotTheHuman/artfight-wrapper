import { Page, Browser } from 'puppeteer';
import {Config} from "./config.js"
import { EventEmitter } from 'events';
class TaskManager extends EventEmitter {
    /**
     * Max amount of pages
     */
    limit: number;
    /**
     * List of tasks to complete
     */
    tasks: Promise<any>[] = [];
    stopped: boolean;

    /**
     * @param {number} [limit=50] Max amount of pages
     */
    constructor(limit: number = 50) {
        super();
        if (Config.maxpages !== undefined && limit !== 50) {
            this.limit = Config.maxpages;
        } else {
            this.limit = limit;
        }
        this.stopped = false;
        this.on('executionStop', (reason?:string) => {
            this.stopped = true;
        });
    }

    /**
     * Executes all of the manager's tasks in batches
     */
    async execute(): Promise<void> {
        let arr = this.chunk(this.tasks, this.limit);
        for (let i = 0; i < arr.length; i++) {
            if (this.stopped) break;
            await Promise.all(arr[i]);
            this.emit('executionStep', `Executed batch ${i + 1}/${arr.length}`);
        }
    }

    /**
     * @param {Array<Promise<any>>} arr List of tasks to complete
     * @param {number} size Chunk size
     * @returns {Array<Array<Promise<any>>>} Chunked list of tasks to complete
     */
    private chunk(arr: Array<Promise<any>>, size: number): Array<Array<Promise<any>>> {
        return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));
    }
}

class PageManager {
    /**
     * List of all pages managed by the manager
     */
    private pages: Array<{ page: Page; active: boolean; index: number }> = [];

    /**
     * Amount of pages managed
     */
    get length(): number {
        return this.pages.length;
    }

    /**
     * @param {Browser} browser The browser to manage the pages in
     */
    async init(browser: Browser): Promise<void> {
        return new Promise<void>(async (resolve) => {
            for (let i = 0; i < Config.maxpages - 1; i++) {
                await browser.newPage();
            }
            let index = 0;
            for (let page of await browser.pages()) {
                let pageObject = { page, active: false, index };
                this.pages[index] = pageObject;
                index++;
            }
            resolve()
        });

    }
    /**
     * @returns {Promise<{page: Page; active: boolean; index: number}>} An inactive page along with its index
     */
    async get(): Promise<{ page: Page; active: boolean; index: number }> {
        return new Promise((resolve) => {
            const tryGetPage = () => {
                let page = this.pages.find((r) => r.active == false);
                if (page) {
                    let newPageObject = { page: page.page, index: page.index, active: true };
                    this.pages[page.index] = newPageObject;
                    resolve(newPageObject);
                } else {
                    setTimeout(tryGetPage, 100);
                }
            };
            tryGetPage();
        });
    }
    /**
     * @param {number} index The index of the page
     * @returns {void} Unactivates the page
     */
    return(index: number): void {
        let page = this.pages[index];
        if (page) {
            let newPageObject = { page: page.page, index: page.index, active: false };
            this.pages[index] = newPageObject;
        }
    }
}

export { TaskManager, PageManager };