const { default: puppeteer} = require("puppeteer");
const { PageManager, TaskManager } = require("./task");
const { Submition, SubmitionInformation, SubmitionStatistics } = require("./sumbition");
const {Complete} = require("./Enumarables")
const { Page } = require("puppeteer");
const { ArtfightClient } = require("./client");
class ArtfightScrapper{
    /**
     * @type {ArtfightClient}
     */
    client;
    /**
     * @type {PageManager} Scrapper pages
     */
    pages;
    /**
     * @param {ArtfightClient} client The scapper's client
     */
    constructor(client){
        this.client=client;
    }
    /**
     * @param {string} username Artfight username
     * @param {string} password Artfight password
     * @returns {Promise<void>} Logs in the user
     */
    async login(username,password){
        let browser=await puppeteer.launch({headless:false});
        this.pages = new PageManager();
        await this.pages.init(browser);
        /**
         * @property {Page} page
         * @property {number} index
         */
        let pg = await this.pages.get();
        let page = pg.page;
        let index = pg.index;
            await page.goto("https://artfight.net/login");
            await page.setViewport({width:1080,height:1024});
            await page.waitForSelector("input[name=username]");
            await page.type("input[name=username]",username);
            await page.type("input[name=password]",password);
            let redirect = page.waitForNavigation();
            await page.$eval("input[type=submit]",el=>el.click());
            await redirect;
            this.pages.return(index);
            let error = await page.$$(".alert-danger")
            if(error.length>0){
                await page.screenshot({path:"./images/error.png"})
                throw new Error("Invalid login credentials");
            }
            return;
    }
    /**
     * @returns {Promise<void>} Closes the browser ending the session
     */
    async logout(){
        this.browser.close();
    }
    /**
     * @param {string} username Nickname of the user
     * @returns {Promise<{lastseen:string,joined:string,team:string}} The status of the user (when was the user last online/joined/what was the users team)
     */
    async fetchUserStatus(username){
        let pg = await this.pages.get();
        let page = pg.page;
        let index = pg.index;
        await page.goto(`https://artfight.net/~${username}`);
        let parent = await page.waitForSelector(".profile-header-normal-status");
        const children = await parent.evaluate(r=>Array.from(r.children).map(r=>r.textContent));
        this.pages.return(index);
        return {lastseen:children[0].split(":")[1].trim(),joined:children[1].split(":")[1].trim(),team:children[2].split(":")[1].trim()};
    }
    /**
     * @param {string} username Nickname of the user
     * @returns {Promise<string>} Link of the users image
     */
    async fetchUserImage(username){
        let pg = await this.pages.get();
        let page = pg.page;
        let index = pg.index;
        await page.goto(`https://artfight.net/~${username}`);
        let parent = await page.waitForSelector(".icon-user");
        this.pages.return(index);
        return parent.evaluate(r=>r.getAttribute("style").split(";")[1].replace("background-image: url(","").replace(")","").split("?")[0])
    }
    /**
     * @param {string|string[]} tags Tags for the character search
     * @param {number} limit Maximum amount of characters returned
     * @returns {Promise<Character[]>} Array of characters with the given tags
     */
    async fetchCharactersByTag(tags,limit=10){
        if(typeof(tags)=="string")tags=[tags];
        let pg = await this.pages.get();
        let page = pg.page;
        let index = pg.index;
        await page.goto(`https://artfight.net/browse/tags?tag=${tags.join(",")}`);
        let elementCount = await page.evaluate(() => {
            return document.querySelectorAll(".row").length;
        });
        if (elementCount > 1) {
            let links = await page.evaluate(() => {
                let rows = document.querySelector(".row");
                if (rows) {
                    return Array.from(rows.children).map(r => r.querySelector('a')?.href).filter(link => link);
                }
                return [];
            });
            if (links.length > 0) {
                links.length=limit;
                this.pages.return(index);
                const manager = new TaskManager();
                let characters=[];
                links.map(r=>{
                    manager.tasks.push(
                        new Promise(async res=>{
                            let character = await this.fetchUserCharacter(r);
                            characters.push(character);
                            res();
                        })
                    )
                })
                await manager.execute();
                return characters;
            }
        }
        this.pages.return(index);
        return [];
    }
    /**
     * @param {string} username Nickname of the user 
     * @returns {Promise<{current:Array<string|number>,overall:string[],achivements:string[][]}>} User statistics (overall, current and achivements)
     */
    async fetchUserStatistics(username){
        let pg = await this.pages.get();
        let page = pg.page;
        let index = pg.index;
        await page.goto(`https://artfight.net/~${username}/stats`);
        let result = await page.evaluate(async()=>{
            let arr = Array.from(document.querySelectorAll("table.table")).map(table => {
                /**
                 * @type {string[][]}
                 */
                let rows = table.innerText.split(/[\n]/gm);
                return rows.reduce((result, row, index) => {
                    row = row.replace(/[\r\n\t]+/gm, "");
                    if (row.includes("Battle Ratio:") && index + 1 < rows.length && /\d+(\.\d+)?%/.test(rows[index + 1])) {
                        result.push(row.trim() + rows[index + 1].replace(/[\r\n\t]+/gm, ""));
                        rows[index + 1] = "";
                    } else if (!/\d+(\.\d+)?%/.test(row)) {
                        result.push(row);
                    }
                    return result;
                }, []);
            });
            /**
             * @type {[string,string][]}
             */
            let achv;
            arr = arr.map(r => r.filter(r1 => r1).map(r1 => r1.split(":")[1]));
            await new Promise(r=>{
                setTimeout(()=>{
                    achv = Array.from(document.querySelectorAll(".row")[1].children).map(r=>r.children.item(0).children.item(0)).map(r=>([r.src,r.dataset.originalTitle]));
                    r();
                },10)
            })
            return {current:arr[1].map((value,index)=>index==0?value:parseFloat(value)),overall:arr[0].map(r=>parseFloat(r)),achivements:achv};
        })
        await this.pages.return(index);
        return result;
    }
    /**
     * @param {string} username Nickname of the user 
     * @returns {Promise<Character[]>} Array of characters owned by the user 
     */
    async fetchUserCharacters(username){
        let pg = await this.pages.get();
        let page=pg.page;
        let index=pg.index;
        await page.goto(`https://artfight.net/~${username}/characters`);
        let list=[];
        const manager = new TaskManager();
        let links = (await (await page.waitForSelector(".profile-characters-body")).evaluate(r=>Array.from(r.children.item(0).children).map(r=>{
            let link = r.children.item(0).href;
            return link;
        })));
        for(let link of links){
            manager.tasks.push(new Promise(async r=>{
                let character = await this.fetchUserCharacter(link);
                list.push(character);
                r();
            }))
        }
        await manager.execute();
        this.pages.return(index);
        return list;
    }
    /**
     * @param {string} link Url to the character's page
     * @returns {Promise<Character>} Character scraped from the page provided by the link
     */
    async fetchUserCharacter(link){
        const {Character, CharacterInformation} = require("./character")
        let pg = await this.pages.get();
        let page = pg.page;
        let index = pg.index;
        await page.goto(link);
        let x = link.split("/")[4].split(".");
        let created = await (await page.waitForSelector(".profile-header-normal-status")).evaluate(r=>r.children.item(1).textContent.replace("Created: ",""));
        let images = await page.evaluate(async()=>{
            let imgs = Array.from(document.querySelectorAll(".card-body")[3].children.item(0).children);
            return imgs.map(r=>r.children.item(0)?.href);
        })
        let description = await (await page.waitForSelector(".character-description")).evaluate(r=>r.textContent);
        let attacks = await this.fetchUserCharacterAttacks(page,x[0],x[1]);
        await page.goto(link);
        let information;
        try{
            information = await (await page.evaluate(()=>{
                let inf = Array.from(document.querySelectorAll("tbody")[1].children).map(r=>r.textContent.replaceAll("\n","").split(":")[1]?.trim());
                if(inf.length>2){
                    inf[2] = document.querySelectorAll("tbody")[1].children.item(2).children.item(1).children.item(0).href
                }
                return inf
            }))
        }catch(e){
            await page.screenshot({path:"./error.png"})
            console.log(e);
        }

        let tags = await (await page.evaluate(()=>{
            return Array.from(document.querySelectorAll(".btn.badge.badge-info.fa-1x.mt-1")).map(r=>r.textContent);
        }))
        let permissions = await page.evaluate(()=>{
            return document.querySelector(".table.table-card tbody").textContent.replaceAll("  ","").replaceAll("\n"," ")
        })
        let comments = [Complete.All,Complete.Comment].includes(this.client.completes)?await this.fetchComments(page):[];
        this.pages.return(index);
        return new Character(x[0],x[1],created,images,description,permissions,attacks,new CharacterInformation(...information),tags,comments);
    }
    /**
     * @param {Page} page The browser page
     * @param {string} id The character's id
     * @param {string} name The character's name
     * @returns {Promise<Submition[]>} List of attacks made on the character
     */
    async fetchUserCharacterAttacks(page,id,name){
        await page.goto(`https://artfight.net/character/attacks/${id}.${name}`)
        try{
            let element = await page.evaluate(()=>document.querySelectorAll(".row"));
            let attacks;
            if(element.length>1){
                let links = await (await page.waitForSelector(".row"))?.evaluate(r=>{
                    let atks = Array.from(r?.children)
                    if(atks.length>0){
                        atks = atks.map(r=>r?.children?.item(0).children?.item(0).children?.item(0)?.href)
                    }else{
                        atks = []
                    }
                    return atks
                })
                const manager = new TaskManager(this.pages.length);
                attacks=[];
                for(let link of links){
                    manager.tasks.push(new Promise(async r=>{
                        let {page:pg,index:idx} = await this.pages.get();
                        let submit = await this.#fetchSumbition(pg,link);
                        attacks.push(submit);
                        await this.pages.return(idx);
                        r();
                    }))
                }
                await manager.execute();
            }else{
                attacks=[];
            }
            return attacks;
        }catch(e){
            console.log(`https://artfight.net/character/attacks/${id}.${name}`)
            throw e
        }
    }
    /**
     * @param {string} username Nickname of the user
     * @param {number} limit Limit of submitions fetched (5 default)
     * @param {"attack"|"defense"} type Submition type
     * @returns {Promise<Submition[]>} List of all submitions that the user has made
     */
    async fetchSubmitions(username,limit=5,type){
        let pg = await this.pages.get();
        let page=pg.page;
        let index = pg.index;
        await page.goto(`https://artfight.net/~${username}/${type}s/`)
        let list = [];
            const manager = new TaskManager();
            for(let index=0;index<Math.ceil(limit/30);index++){
                let navigation = page.waitForNavigation();
                await page.goto(`https://artfight.net/~${username}/${type}s?page=${index+1}`);
                await navigation;
                let submitions = await (await page.waitForSelector(`.profile-${type}s-body`)).evaluate(r=>Array.from(Array.from(r.children)[0].children).map(r=>{
                    /**
                     * @type {{link:string,image:string,title:string}}
                     */
                    let data = {link:null,image:null,title:null};
                    data.link=r.children.item(0).href;
                    data.image=r.children.item(0).children.item(0).src;
                    data.title=r.children.item(0).children.item(0).getAttribute("data-original-title");
                    return data;
                }));
                for(let submition of submitions){
                    manager.tasks.push(new Promise(async r=>{
                        let {page:pg,index:idx} = await this.pages.get();
                        let submit = await this.#fetchSumbition(pg,submition.link);
                        list.push(submit);
                        await this.pages.return(idx);
                        r();
                    }))
                }
                await manager.execute();
            }
        this.pages.return(index);
        return list;
    }
    /**
     * @param {Page} page The browser page
     * @param {string} link The submition's url
     * @returns {Promise<Submition>} The submition
     */
    async #fetchSumbition(page,link){
        // Completes implementation needed
        await page.goto(link);
        await page.waitForSelector(".profile-normal-header");
        let result = await page.evaluate(()=>{
            const elements = Array.from(document.querySelectorAll("table.table")).map(r=>Array.from(r.children.item(0).children).map(r=>r.textContent.replace(/[\r\n]+/gm, "").split(":")[1]?.trim()));
            let characterlist = Array.from(document.querySelectorAll("table.table")[0].children.item(0).children);
            let revenge={
                level:undefined,
                previous: {
                    link:undefined,
                    title:undefined,
                    image:undefined,
                },
                next: {
                    link:undefined,
                    title:undefined,
                    image:undefined,
                }
            };
            if(elements.length>2){
                let level = number(Array.from(document.querySelectorAll(".card-header.p-3.border.rounded.mt-3"))[0]?.textContent.replace(/[\r\n]+/gm, "").trim().replace("Revenge chain (Level: ","").replace(")",""));
                let previous;
                if(level!=0){
                    previous={};
                    let pdata = document.querySelectorAll("table.table")[2].children.item(0).children.item(0);
                    previous.link=pdata.children.item(1).children.item(0)?.href;
                    previous.title=pdata.children.item(1).children.item(0)?.children.item(0).getAttribute("data-original-title");
                    previous.image=pdata.children.item(1).children.item(0)?.children.item(0).src;
                    previous.level=level-1;
                }
                let next;
                let ndata = document.querySelectorAll("table.table")[3]?.children.item(0).children.item(0).children.item(0).children.item(0);
                if(ndata){
                    next={};
                    next.link=ndata.href;
                    next.title=ndata.children.item(0).getAttribute("data-original-title");
                    next.image=ndata.children.item(0).src;
                    next.level=level+1;
                }
                revenge={previous,next};
            }
            const characters = characterlist.slice(3,characterlist.length).map(r=>{
                let text = r.textContent.replace(/[\r\n]+/gm, "").trim();
                let split = text.split(":");
                let type = split[0];
                let character = split[1].trim();
                return ({type,character})
            });
            elements[0][3]=characters;
            elements[0].splice(4,elements[0].length);
            elements[2]=revenge;
            elements.splice(3,elements.length);
            return elements;
        })
        let polished = await(await page.evaluate(()=>{
            let element = document.querySelector("td[colspan='2'].text-center.bg-light");
            if(element){
                let spans = element.querySelectorAll("span.fad.fa-sparkles");
                if(spans.length===2&&element.textContent.includes("Polished")){
                    return true
                }
            }
            return false
        }))
        let time = await (await page.waitForSelector(".profile-header-normal-status")).evaluate(r=>r.children.item(1).textContent.replace("On: ",""));
        let information = result[0];
        let statistics = result[1];
        let revenge = result[2];
        return new Submition(new SubmitionInformation(...information),new SubmitionStatistics(...statistics),revenge,time,statistics[0].includes("Friendly Fire"),undefined,polished)
    }
    /**
     * @param {number} limit Maximum amount of members returned
     * @returns {Promise<{username:string,lastseen:string,points:number,battleratio:number}[]>} List of members
     */
    async fetchMembers(limit=19){
        //Add mutli page support
        let pg = await this.pages.get();
        let page=pg.page;
        let index=pg.index;
        await page.goto("https://artfight.net/members");
        await page.waitForSelector(".w-100,.p-4,.alternate");
        const list = await page.evaluate(()=>{
            let elements = Array.from(document.querySelectorAll('.w-100.p-4.alternate:not(:first-child)'));
            return elements.map(r=>{
                let arr = r.textContent.trim().replaceAll("  ","").split("\n").filter(r=>r!="");
                return {username:arr[0],lastseen:arr[2],points:Number(arr[4]),battleratio:parseFloat(arr[6].replace("%",""))}
            })
        });
        this.pages.return(index);
        return list;
    }
    /**
     * @returns {Promise<string>} A random Artfight username
     */
    async fetchRandomUsername(){
        let pg = await this.pages.get();
        let page = pg.page;
        let index = pg.index;
        await page.goto("https://artfight.net/user/random");
        await page.waitForSelector(".profile-normal-header");
        let username = page.url().split("/~").at(-1);
        this.pages.return(index);
        return username;
    }
    /**
     * @returns {Promise<Character>} A random character
     */
    async fetchRandomCharacter(){
        let pg = await this.pages.get();
        let page = pg.page;
        let index = pg.index;
        await page.goto("https://artfight.net/character/random/");
        await page.waitForSelector(".profile-header");
        let character = await this.fetchUserCharacter(page.url());
        this.pages.return(index);
        return character;
    }
    /**
     * @param {Page} page The page the comments are on
     * @returns {Promise<{author:string,content:string,posted:string}[]>} List of comments made on the page
     */
    async fetchComments(page){
        if(![Complete.All,Complete.Comment].includes(this.client.completes)){
            return []
        }
        return await page.evaluate(()=>{
            return Array.from(document.querySelectorAll(".comment")).map(r=>{
                let author = r.children.item(0).textContent.replaceAll("\n","").trim();
                let content = r.children.item(1).children.item(0).children.item(1).innerHTML;
                let posted = r.children.item(1).children.item(0).children.item(2).querySelector(".timestamp").textContent;
                return {author,content,posted};
            })

        })
    }
    /**
     * @param {number} limit Maximum amount of bookmarks fetched
     * @returns {Promise<string[][]>} List of bookmark data
     */
    async fetchClientUserBookmarks(limit = 30) {
        if(limit<=0) throw new Error("Limit cannot be negative or equal to 0");
        const pagesamm = Math.ceil(limit / 30);
        const manager = new TaskManager();
        const bookmarks = [];
        for (let i = 1; i <= pagesamm; i++) {
            manager.tasks.push(new Promise(async (resolve, reject) => {
                try {
                    const pg = await this.pages.get();
                    const page = pg.page;
                    await page.goto(`https://artfight.net/manage/bookmarks?page=${i}`);
                    const response = await page.evaluate(() => {
                        return Array.from(document.querySelectorAll(".card.mt-2")).map(card => {
                            const elements = Array.from(card.querySelector(".row").children);
                            const a = elements[0].querySelector(".thumbnail");
                            const adt = a.href.split("/").pop().split(".");
                            const id = adt[0];
                            const icon = a.children[0].src;
                            const bdt = elements[1].children;
                            const name = bdt[0].querySelector("i").innerText;
                            const owner = bdt[0].querySelector("strong").innerText.trim();
                            const description = bdt[1].textContent.trim();
                            const cdt = elements[2].children;
                            const updated = cdt[0].textContent.replace("Updated: ", "");
                            const order = cdt[1].textContent.replace("Order: ", "");
                            return [id, name, icon, owner, description, updated, order];
                        });
                    });
                    bookmarks.push(...response);
                    this.pages.return(pg.index);
                    if (response.length < 30) {
                        resolve();
                        return;
                    }
                    resolve();
                } catch (error) {
                    reject(error);
                }
            }));
        }
        await manager.execute();
        return bookmarks;
    }
    
    /**
     * @param {number} index Index of the bookmark to fetch
     * @returns {Promise<string[]>} Bookmark data
     */
    async fetchClientUserBookmarkAtIndex(index) {
        if(index<0) throw new Error("Index cannot be negative");
        const pg = await this.pages.get();
        const page = pg.page;
        const pageIndex = Math.floor(index / 30) + 1;
        await page.goto(`https://artfight.net/manage/bookmarks?page=${pageIndex}`);
        const response = await page.evaluate((index) => {
            const cardIndex = index % 30;
            const card = document.querySelectorAll(".card.mt-2")[cardIndex];
            if(!card) throw new Error("Bookmark not found");
            const elements = Array.from(card.querySelector(".row").children);
            const a = elements[0].querySelector(".thumbnail");
            const adt = a.href.split("/").pop().split(".");
            const id = adt[0];
            const icon = a.children[0].src;
            const bdt = elements[1].children;
            const name = bdt[0].querySelector("i").innerText;
            const owner = bdt[0].querySelector("strong").innerText.trim();
            const description = bdt[1].textContent.trim();
            const cdt = elements[2].children;
            const updated = cdt[0].textContent.replace("Updated: ", "");
            const order = cdt[1].textContent.replace("Order: ", "");
            return [id, name, icon, owner, description, updated, order];
        }, index);
        this.pages.return(pg.index);
        return response;
    }
    
    /**
     * @param {number} start Start index of the bookmarks to fetch
     * @param {number} end End index of the bookmarks to fetch
     * @returns {Promise<string[][]>} List of bookmark data
     */
    async fetchClientUserBookmarksRange(start, end) {
        if (start > end) throw new Error("Start index cannot be greater than end index");
        const manager = new TaskManager();
        const bookmarks = [];
        const pagesamm = Math.ceil((end - start + 1) / 30);
        for (let i = 1; i <= pagesamm; i++) {
            manager.tasks.push(new Promise(async (resolve, reject) => {
                try {
                    const pg = await this.pages.get();
                    const page = pg.page;
                    await page.goto(`https://artfight.net/manage/bookmarks?page=${i}`);
                    const response = await page.evaluate(() => {
                        return Array.from(document.querySelectorAll(".card.mt-2")).map(card => {
                            const elements = Array.from(card.querySelector(".row").children);
                            const a = elements[0].querySelector(".thumbnail");
                            const adt = a.href.split("/").pop().split(".");
                            const id = adt[0];
                            const icon = a.children[0].src;
                            const bdt = elements[1].children;
                            const name = bdt[0].querySelector("i").innerText;
                            const owner = bdt[0].querySelector("strong").innerText.trim();
                            const description = bdt[1].textContent.trim();
                            const cdt = elements[2].children;
                            const updated = cdt[0].textContent.replace("Updated: ", "");
                            const order = cdt[1].textContent.replace("Order: ", "");
                            return [id, name, icon, owner, description, updated, order];
                        });
                    });
                    bookmarks.push(...response);
                    this.pages.return(pg.index);
                    if (response.length < 30) {
                        resolve();
                        return;
                    }
                    resolve();
                } catch (error) {
                    reject(error);
                }
            }));
        }
        await manager.execute();
        return bookmarks.slice(start - 1, end);
    }
    /**
     * @param {number} amount Amount of bookmarks to delete 
     * @returns {Promise<string[]>} IDs of the deleted bookmarks
     */
    async deleteClientUserBookmarks(amount = 1) {
        const pg = await this.pages.get();
        const page = pg.page;
        await page.goto("https://artfight.net/manage/bookmarks");
        const deletedIds = [];
        for (let i = 0; i < amount; i++) {
            const id = await page.evaluate(() => {
                const card = document.querySelector(".card.mt-2");
                if (!card) throw new Error("No bookmarks to delete");
                const editBookmarkButton = card.querySelector(".edit-bookmark");
                if (!editBookmarkButton) throw new Error("Edit bookmark button not found");
                const a = card.querySelector(".thumbnail");
                const adt = a.href.split("/").pop().split(".");
                const id = adt[0];
                editBookmarkButton.click();
                return id;
            });
            await page.waitForSelector(".btn.btn-danger");
            await page.evaluate(() => {
                const deleteButton = document.querySelector(".btn.btn-danger");
                if (!deleteButton) throw new Error("Delete button not found");
                deleteButton.click();
            });
            await page.waitForNavigation();
            deletedIds.push(id);
        }
        this.pages.return(pg.index);
        return deletedIds;
    }
    /**
     * @param {string} id The character id of the bookmark to be deleted
     * @returns {Promise<boolean>} Whether the bookmark was deleted
     */
    async deleteClientUserBookmarkByCharacterId(id) {
        const manager = new TaskManager();
        let pagenum=1;
        manager.tasks.push(new Promise(async res=>{
            let pg = await this.pages.get();
            let page = pg.page;
            await page.goto(`https://artfight.net/manage/bookmarks?page=${pagenum}`);
            let response = await page.evaluate((id)=>{
                if(document.querySelectorAll(".card.mt-2").length==0){
                    throw new Error("Bookmark not found");
                }
                const card = Array.from(document.querySelectorAll(".card.mt-2")).find(card => {
                    const a = card.querySelector(".thumbnail");
                    const adt = a.href.split("/").pop().split(".");
                    return adt[0] === id;
                });
                if(!card) return false;
                const editBookmarkButton = card.querySelector(".edit-bookmark");
                if(!editBookmarkButton) return false;
                editBookmarkButton.click();
                const deleteButton = document.querySelector(".btn.btn-danger");
                if(!deleteButton) return false;
                deleteButton.click();
                manager.emit("executionStop");
                return true;
            },id);
            this.pages.return(pg.index);
            res(response);
        }));
        await manager.execute();
    }
    /**
     * @returns {Promise<void>} Deletes all bookmarks
     */
    async deleteClientUserBookmarksAll() {
        const pg = await this.pages.get();
        const page = pg.page;
        await page.goto("https://artfight.net/manage/bookmarks");
        while (true) {
            const hasBookmark = await page.evaluate(() => {
                const card = document.querySelector(".card.mt-2");
                if (!card) return false;
                const editBookmarkButton = card.querySelector(".edit-bookmark");
                if (!editBookmarkButton) throw new Error("Edit bookmark button not found");
                editBookmarkButton.click();
                return true;
            });
            if (!hasBookmark) break;
            await page.waitForSelector(".btn.btn-danger");
            await page.evaluate(() => {
                const deleteButton = document.querySelector(".btn.btn-danger");
                if (!deleteButton) throw new Error("Delete button not found");
                deleteButton.click();
            });
            await page.waitForNavigation();
        }
        this.pages.return(pg.index);
    }
    /**
     * @param {string} id The character id to bookmark
     * @param {string} order The order of the bookmark
     * @param {string} description The description of the bookmark `(not working)`
     * @returns {Promise<boolean>} Whether the character was bookmarked
     */
    async bookmarkCharacter(id, order = 0, description = "") {
        //i tried like 20 time to make description but it doesn't work, feel free to try it yourself
        const pg = await this.pages.get();
        const page = pg.page;
        const index = pg.index;
        await page.goto(`https://artfight.net/character/${id}`);
        await page.waitForSelector(".bookmark-character");
        await page.evaluate(() => {
            document.querySelector(".bookmark-character").click();
        });
        await page.waitForSelector("#modal");
        await page.waitForSelector("input#order");
        await page.evaluate(() => {
            document.querySelector("input#order").value = "";
        });
        await page.type("input#order", order.toString());
        await page.evaluate(() => {
            document.querySelector("#modal-form").submit();
        });
        this.pages.return(index);
        return true;
    }
    /**
     * @param {string} id The id of the character to unbookmark
     * @returns {Promise<boolean>} Whether the character was unbookmarked
     */
    async unbookmarkCharacter(id){
        let pg = await this.pages.get();
        let page = pg.page;
        let index = pg.index;
        await page.goto(`https://artfight.net/character/${id}`);
        await page.waitForSelector(".bookmark-character");
        await page.evaluate(()=>{
            document.querySelector(".bookmark-character").click();
        })
        await page.waitForSelector("input.btn-danger");
        await page.evaluate(()=>{
            document.querySelector("input.btn-danger").click();
        })
        this.pages.return(index);
        return true;
    }
}
module.exports={ArtfightScrapper};
