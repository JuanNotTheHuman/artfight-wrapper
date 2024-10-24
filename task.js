const { Page, Browser } = require("puppeteer");
const {maxpages} = require("./config.json")
class TaskManager{
    /**
     * @type {Number}
     */
    limit;
    /**
     * @type {Promise[]}
     */
    tasks=[];
    /**
     * @param {Number} limit 
     */
    constructor(limit){
        if(limit!=undefined){
            this.limit=limit
        }else if(limit===null||maxpages===null){
            this.limit=50; //failsafe so the puppeteer doesnt take up all ram
        }else{
            this.limit=maxpages;
        }
    }
    async execute(){
        let arr = this.#chunk(this.tasks,this.limit);
        for(let i=0;i<arr.length;i++){
            await Promise.all(arr[i]);
        }
    }
    /**
     * @param {Array.<Promise>} arr 
     * @param {Number} size 
     * @returns {Array<Array<Promise>>}
     */
    #chunk(arr, size){
        return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>arr.slice(i * size, i * size + size));
    }
}
class PageManager {
    /**
     * @type {Array.<{page:Page,active:Boolean,index:Number}>}
     */
    #pages = [];
    /**
     * @type {Number}
     */
    length;
    get length(){
        return this.#pages.length;
    }
    /**
     * 
     * @param {Browser} browser 
     * @param {Number} limit
     */
    async init(browser) {
        for (let index = 0; index < maxpages; index++) {
            let page = await browser.newPage();
            let pageObject = { page };
            Object.defineProperty(pageObject, 'active', {
                value: false,
                writable: false,
                configurable: false,
                enumerable: true
            });
            Object.defineProperty(pageObject, 'index', {
                value: index,
                writable: false,
                configurable: false,
                enumerable: true
            });
            this.#pages[index] = pageObject;
        }
    }

    /**
     * @returns {Promise<{page:Page,active:Boolean,index:Number}>}
     */
    async get() {
        return new Promise(resolve => {
            const tryGetPage = () => {
                let page = this.#pages.find((r) => r.active === false);
                if (page) {
                    let newPageObject = { page: page.page, index: page.index, active: true };
                    this.#pages[page.index] = newPageObject;
                    resolve(newPageObject);
                } else {
                    setTimeout(tryGetPage, 100);
                }
            };
            tryGetPage();
        });
    }

    /**
     * @param {Number} index
     * @returns {void}
     */
    return(index) {
        let page = this.#pages[index];
        if (page) {
            let newPageObject = {page:page.page,index:page.index, active: false };
            this.#pages[index] = newPageObject;
        }
    }
}
module.exports={TaskManager,PageManager};
/**
 * TODO:
 * Nothing, at least for now, maybe some optimization tho
 */