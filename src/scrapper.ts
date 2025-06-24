import puppeteer, { Page } from "puppeteer";
import { Character,CharacterInformation,CharacterPartial} from "./character.js";
import { ArtfightClient } from "./client.js";
import { PageManager, TaskManager } from "./task.js";
import { Submition, SubmitionInformation, SubmitionStatistics,SubmitionPartial} from "./sumbition.js";
import { ClientEvents, Complete, NotificationType } from "./Enumarables.js";
import { Message } from "./message.js";
import { Config } from "./config.js";
import { link } from "fs";
import { Notification } from "./notifications.js";
class ArtfightScrapper{
    /**
     * @type {ArtfightClient}
     */
    client:ArtfightClient;
    /**
     * @type {PageManager} Scrapper pages
     */
    pages:PageManager;
    /**
     * @param {ArtfightClient} client The scapper's client
     */
    constructor(client:ArtfightClient){
        this.client=client;
        this.pages = {} as PageManager;
    }
    /**
     * @param {string} username Artfight username
     * @param {string} password Artfight password
     * @returns {Promise<void>} Logs in the user
     */
    async login(username:string,password:string){
        let browser=await puppeteer.launch({headless:true});
        this.pages=new PageManager();
        await this.pages.init(browser);
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
        let error = await page.$$(".alert-danger")
        if(error.length>0){
            var message = await error[0].evaluate(r=>r.textContent);
            console.log(username,password);
            throw new Error(message || "Login failed, unknown error");
        }
        this.pages.return(index);
        return;
    }
    /**
     * @returns {Promise<void>} Closes the browser ending the session
     */
    async logout(){
        let {page} = await this.pages.get();
        await page.goto("https://artfight.net/logout");
        await page.browser().close();
        this.pages = {} as PageManager;
    }
    /**
     * @param {string} username Nickname of the user
     * @returns {Promise<{lastseen:string,joined:string,team:string}>} The status of the user (when was the user last online/joined/what was the users team)
     */
    async fetchUserStatus(username:string){
        let pg = await this.pages.get();
        let page = pg.page;
        let index = pg.index;
        await page.goto(`https://artfight.net/~${username}`);
        let parent = await page.waitForSelector(".profile-header-normal-status");
        if(parent){
            const children = await parent.evaluate(r=>Array.from(r.children).map(r=>r.textContent==null?"":r.textContent));
            this.pages.return(index);
            return {lastseen:children[0].split(":")[1].trim(),joined:children[1].split(":")[1].trim(),team:children[2].split(":")[1].trim()};
        }else throw new Error("Element not found: .profile-header-normal-status");
    }
    /**
     * @param {string} username Nickname of the user
     * @returns {Promise<string>} Link of the users image
     */
    async fetchUserImage(username:string){
        let pg = await this.pages.get();
        let page = pg.page;
        let index = pg.index;
        await page.goto(`https://artfight.net/~${username}`);
        let parent = await page.waitForSelector(".icon-user");
        if(parent){
            return parent.evaluate(r => {
                const style = r.getAttribute("style");
                if (style) {
                    return style.split(";")[1].replace("background-image: url(","").replace(")","").split("?")[0];
                }
                this.pages.return(index);
                return null;
            });
        }else throw new Error("Element not found: .icon-user");
    }
    /**
     * @param {string|string[]} tags Tags for the character search
     * @param {number} limit Maximum amount of characters returned
     * @returns {Promise<Character[]>} Array of characters with the given tags
     */
    async fetchCharactersByTag(tags:string|string[],limit=10){
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
                    return Array.from(rows.children).map(r => r.querySelector('a')?.href).filter(link => link!=undefined);
                }
                return [];
            });
            if (links.length > 0) {
                links.length=limit;
                this.pages.return(index);
                const manager = new TaskManager();
                let characters:Character[]=[];
                links.map(r=>{
                    manager.tasks.push(
                        new Promise<void>(async res=>{
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
     * @returns {Promise<{current:Array<string|number>,overall:string[],achivements:[string,string][]}>} User statistics (overall, current and achivements)
     */
    async fetchUserStatistics(username:string):Promise<{current:(string|number)[],overall:string[],achivements:[string,string][]}>{
        let pg = await this.pages.get();
        let page = pg.page;
        let index = pg.index;
        await page.goto(`https://artfight.net/~${username}/stats`);
        let result = await page.evaluate(async()=>{
            let arr = Array.from(document.querySelectorAll("table.table")).map(table=> {
                /**
                 * @type {string[][]}
                 */
                let rows = (table as HTMLElement).innerText.split(/[\n]/gm);
                return rows.reduce((result: string[], row, index) => {
                    row = row.replace(/[\r\n\t]+/gm, "");
                    if (row.includes("Battle Ratio:") && index + 1 < rows.length && /\d+(\.\d+)?%/.test(rows[index + 1])) {
                        result.push(row.trim() + rows[index + 1].replace(/[\r\n\t]+/gm, ""));
                        rows[index + 1] = "";
                    } else if (!/\d+(\.\d+)?%/.test(row)) {
                        result.push(row);
                    }
                    return result;
                }, [] as string[]);
            });
            /**
             * @type {[string,string][]}
             */
            let achv:[string,string][] = [];
            arr = arr.map(r => r.filter(r1 => r1).map(r1 => r1.split(":")[1]));
            await new Promise<void>(r=>{
                setTimeout(()=>{
                    achv = Array.from(document.querySelectorAll(".row")[1].children)
                        .map(r => {
                            const child = r.children.item(0);
                            const grandChild = child?.children.item(0);
                            const src = (grandChild as HTMLImageElement)?.src;
                            const title = (grandChild as HTMLElement)?.dataset.originalTitle;
                            return src && title ? [src, title] : null;
                        })
                        .filter((r): r is [string, string] => r !== null);
                    r();
                },10)
            })
            return {current:arr[1].map((value,index)=>index==0?value:parseFloat(value)),overall:arr[0].map(r=>parseFloat(r).toString()),achivements:achv};
        })
        this.pages.return(index);
        return result;
    }
    /**
     * @param {string} username Nickname of the user 
     * @returns {Promise<Character[]>} Array of characters owned by the user 
     */
    async fetchUserCharacters(username:string){
        let pg = await this.pages.get();
        let page=pg.page;
        let index=pg.index;
        await page.goto(`https://artfight.net/~${username}/characters`);
        let list:Character[]=[];
        const manager = new TaskManager();
        let characters = await page.waitForSelector(".profile-characters-body");
        if(characters){
            let links = await characters.evaluate(r => {
                const children = r.children.item(0)?.children;
                if (!children) return [];
                return Array.from(children).map(r => {
                let link = r.children.item(0) as HTMLAnchorElement;
                if(link){
                    return link.href
                }
                throw new Error("Error while scapping link")
            })});
            for(let link of links){
                manager.tasks.push(new Promise<void>(async r=>{
                    let character = await this.fetchUserCharacter(link);
                    list.push(character);
                    r();
                }))
            }
            await manager.execute();
            this.pages.return(index);
            return list;
        } 
        return []
    }
    /**
     * @param {string} link Url to the character's page
     * @returns {Promise<Character>} Character scraped from the page provided by the link
     */
    async fetchUserCharacter(link:string){
        let pg = await this.pages.get();
        let page = pg.page;
        let index = pg.index;
        await page.goto(link);
        let x = link.split("/")[4].split(".");
        let createdElement = await page.waitForSelector(".profile-header-normal-status");
        if (!createdElement) throw new Error("Element not found: .profile-header-normal-status");
        let created = await createdElement.evaluate(r => {
            const child = r.children.item(1);
            return child && child.textContent ? child.textContent.replace("Created: ", "") : "";
        });
        let images = await page.evaluate(async()=>{
            let cardBody = document.querySelectorAll(".card-body")[3];
            let imgs = cardBody && cardBody.children.item(0) ? Array.from(cardBody.children.item(0)?.children || []) : [] as HTMLImageElement[];
            let elements = imgs.map(r=>r.children.item(0) as HTMLAnchorElement)
            return elements.map(r=>r.href);
        })
        let descriptionElement = await page.waitForSelector(".character-description");
        let description = descriptionElement ? await descriptionElement.evaluate(r => r.textContent? r.textContent:"") : "";
        let attacks = await this.fetchUserCharacterAttacks(page,x[0],x[1]);
        await page.goto(link);
        let information;
        try{
            information = await (await page.evaluate(()=>{
                let inf = Array.from(document.querySelectorAll("tbody")[1].children).map(r => r.textContent ? r.textContent.replace(/\n/g, "").split(":")[1]?.trim() : "");
                if(inf.length>2){
                    const element = document.querySelectorAll("tbody")[1]?.children.item(2)?.children.item(1)?.children.item(0);
                    inf[2] = element && element instanceof HTMLAnchorElement ? element.href : "";
                }
                return inf
            }))
        }catch(e){
            console.log(e);
        }

        let tags = await (await page.evaluate(()=>{
            return Array.from(document.querySelectorAll(".btn.badge.badge-info.fa-1x.mt-1")).map(r=>r.textContent?r.textContent:"");
        }))
        let permissions = await page.evaluate(()=>{
            const tableBody = document.querySelector(".table.table-card tbody");
            return tableBody && tableBody.textContent ? tableBody.textContent.replace(/  /g, "").replace(/\n/g, " ") : "";
        })
        let comments = [Complete.All, Complete.Comment].includes(this.client.completes as Complete) ? await this.fetchComments(page) : [];
        this.pages.return(index);
        if (!information) {
            throw new Error("Failed to fetch character information");
        }
        this.pages.return(index);
        return new Character(x[0], x[1], created, images, description, permissions, attacks, new CharacterInformation(information[0], information[1], information[2] ? information[2] : undefined), tags, comments);
    }
    /**
     * @param {Page} page The browser page
     * @param {string} id The character's id
     * @param {string} name The character's name
     * @returns {Promise<Submition[]>} List of attacks made on the character
     */
    async fetchUserCharacterAttacks(page:Page,id:string,name:string){
        await page.goto(`https://artfight.net/character/attacks/${id}.${name}`)
        try{
            let element = await page.evaluate(()=>document.querySelectorAll(".row"));
            let attacks:Submition[];
            if(element.length>1){
                let links:string[] = await (await page.waitForSelector(".row"))?.evaluate(r=>{
                    let atks:any[] = Array.from(r?.children)
                    if(atks.length>0){
                        atks = atks.map(r => {
                            const child = r?.children?.item(0)?.children?.item(0)?.children?.item(0);
                            return child ? (child as HTMLAnchorElement).href : null;
                        }).filter(link => link !== null) as string[];
                    }else{
                        atks = []
                    }
                    return atks
                }) || [];
                const manager = new TaskManager();
                attacks=[];
                for(let link of links){
                    manager.tasks.push(new Promise<void>(async r=>{
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
    async fetchSubmitions(username: string, limit = 5, type: "attack" | "defense"): Promise<Submition[]> {
        const pg = await this.pages.get();
        const page = pg.page;
        const index = pg.index;
        await page.goto(`https://artfight.net/~${username}/${type}s/`);
        const list: Submition[] = [];
        const manager = new TaskManager();
        let fetchedCount = 0;
        for (let pageIndex = 0; pageIndex < Math.ceil(limit / 30); pageIndex++) {
            const navigation = page.waitForNavigation();
            await page.goto(`https://artfight.net/~${username}/${type}s?page=${pageIndex + 1}`);
            await navigation;
            const submitions = await page.evaluate((type, limit) => {
                const elements = document.querySelectorAll(`.profile-${type}s-body > div`)[0].children;
                const submitions = Array.from(elements).map(element => {
                    const linkElement = element.querySelector('a') as HTMLAnchorElement | null;
                    const imageElement = linkElement?.querySelector('img') as HTMLImageElement | null;
                    return {
                        link: linkElement?.href || '',
                        image: imageElement?.src || '',
                        title: imageElement?.getAttribute('data-original-title') || ''
                    };
                });
                return submitions.slice(0, limit);
            }, type, limit - fetchedCount);
            for (const submition of submitions) {
                if (fetchedCount >= limit) break;
                manager.tasks.push(new Promise<void>(async resolve => {
                    const { page: pg, index: idx } = await this.pages.get();
                    const submit = await this.#fetchSumbition(pg, submition.link);
                    list.push(submit);
                    fetchedCount++;
                    this.pages.return(idx);
                    resolve();
                }));
                if (fetchedCount >= limit) break;
            }
            await manager.execute();
            if (fetchedCount >= limit) break;
        }
        this.pages.return(index);
        return list;
    }
    /**
     * @param {Page} page The browser page
     * @param {string} link The submition's url
     * @returns {Promise<Submition>} The submition
     */
    async #fetchSumbition(page: Page, link: string): Promise<Submition> {
        await page.goto(link);
        await page.waitForSelector(".profile-normal-header");
        const result = await page.evaluate(() => {
            const elements: any[] = Array.from(document.querySelectorAll("table.table")).map(r => {
                const firstChild = r.children.item(0);
                if (!firstChild) return [];
                return Array.from(firstChild.children).map(r => r.textContent?.replace(/[\r\n]+/gm, "").split(":")[1]?.trim());
            });
    
            const table = document.querySelectorAll("table.table")[0];
            const characterlist = table && table.children.item(0) ? Array.from(table.children.item(0)?.children || []) : [];
            
            let revenge: {
                level?: number;
                previous: {
                    link?: string;
                    title?: string;
                    image?: string;
                    level?: number;
                };
                next: {
                    link?: string;
                    title?: string;
                    image?: string;
                    level?: number;
                };
            } = {
                level: undefined,
                previous: {
                    link: undefined,
                    title: undefined,
                    image: undefined,
                    level: undefined
                },
                next: {
                    link: undefined,
                    title: undefined,
                    image: undefined,
                    level: undefined
                }
            };
    
            if (elements.length > 2) {
                const levelElement = document.querySelector(".card-header.p-3.border.rounded.mt-3");
                const level = levelElement ? Number(levelElement.textContent?.replace(/[\r\n]+/gm, "").trim().replace("Revenge chain (Level: ", "").replace(")", "")) : undefined;
                if (level !== undefined) {
                    revenge.level = level;
                    if (level !== 0) {
                        const pdata = document.querySelectorAll("table.table")[2]?.children.item(0)?.children.item(0);
                        if (pdata) {
                            revenge.previous.link = (pdata.children.item(1)?.children.item(0) as HTMLAnchorElement)?.href;
                            revenge.previous.title = pdata.children.item(1)?.children.item(0)?.children.item(0)?.getAttribute("data-original-title") || "";
                            revenge.previous.image = (pdata.children.item(1)?.children.item(0)?.children.item(0) as HTMLImageElement)?.src;
                            revenge.previous.level = level - 1;
                        }
                    }
                    const ndata = document.querySelectorAll("table.table")[3]?.children.item(0)?.children.item(0)?.children.item(0)?.children.item(0);
                    if (ndata) {
                        revenge.next.link = (ndata as HTMLAnchorElement).href;
                        revenge.next.title = ndata.children.item(0)?.getAttribute("data-original-title") || "";
                        revenge.next.image = (ndata.children.item(0) as HTMLImageElement)?.src;
                        revenge.next.level = level + 1;
                    }
                }
            }
    
            const characters = characterlist.slice(3).map(r => {
                const text = r.textContent?.replace(/[\r\n]+/gm, "").trim();
                const split = text?.split(":");
                const type = split ? split[0] : '';
                const character = split ? split[1].trim() : '';
                return { type, character };
            });
    
            if (elements[0]) {
                elements[0][3] = characters;
                elements[0].splice(4, elements[0].length);
            }
    
            elements[2] = revenge;
            elements.splice(3, elements.length);
            return elements;
        });
    
        const polished = await page.evaluate(() => {
            const element = document.querySelector("td[colspan='2'].text-center.bg-light");
            if (element) {
                const spans = element.querySelectorAll("span.fad.fa-sparkles");
                if (spans.length === 2 && element.textContent?.includes("Polished")) {
                    return true;
                }
            }
            return false;
        });
    
        const time = await page.evaluate(() => {
            const statusElement = document.querySelector(".profile-header-normal-status");
            return statusElement?.children.item(1)?.textContent?.replace("On: ", "");
        });
    
        const information = result[0] || [];
        const statistics = result[1] || [];
        const revenge = result[2] || {};
    
        return new Submition(
            new SubmitionInformation(information[0] || '', information[1] || '', information[2] || '', information[3] || ''),
            new SubmitionStatistics(statistics[0] || '', statistics[1] || '', statistics[2] || '', statistics[3] || '', statistics[4] || '', statistics[5] || '', statistics[6] || ''),
            revenge,
            time ?? '',
            statistics[0]?.includes("Friendly Fire") || false,
            undefined,
            polished,
            []
        );
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
                let arr = (r.textContent ? r.textContent.trim().replace("  ","").split("\n").filter(r=>r!="") : []);
                return {username:arr[0],lastseen:arr[2],points:Number(arr[4]),battleratio:parseFloat(arr[6].replace("%",""))}
            })
        });
        this.pages.return(index);
        return list;
    }
    /**
     * @returns {Promise<string>} A random Artfight username
     */
    async fetchRandomUsername(): Promise<string> {
        const pg = await this.pages.get();
        const page = pg.page;
        const index = pg.index;
        await page.goto("https://artfight.net/user/random");
        try{
            await page.waitForSelector(".profile-normal-header");
        }catch(e){
            console.log("Error while fetching random username");
        };
        const urlParts = page.url().split("/~");
        const username = urlParts.at(-1);
        this.pages.return(index);
        if (!username) {
            throw new Error("Failed to fetch random username");
        }
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
    async fetchComments(page:Page){
        if(![Complete.All,Complete.Comment].includes(this.client.completes as Complete)){
            return []
        }
        return await page.evaluate(()=>{
            return Array.from(document.querySelectorAll(".comment")).map(r=>{
                let authorElement = r.children.item(0);
                let author = authorElement && authorElement.textContent ? authorElement.textContent.replace(/\n/g, "").trim() : "";
                let content = r.children.item(1)?.children.item(0)?.children.item(1)?.innerHTML || '';
                let postedElement = r.children.item(1)?.children.item(0)?.children.item(2)?.querySelector(".timestamp");
                let posted = postedElement?.textContent ?? '';
                return {author,content,posted};
            })

        })
    }
    /**
     * @param {number} limit Maximum amount of bookmarks fetched
     * @returns {Promise<string[][]>} List of bookmark data
     */
    async fetchClientUserBookmarks(limit = 30): Promise<string[][]> {
        if (limit <= 0) throw new Error("Limit cannot be negative or equal to 0");
        const pagesamm = Math.ceil(limit / 30);
        const manager = new TaskManager();
        const bookmarks: string[][] = [];
        for (let i = 1; i <= pagesamm; i++) {
            manager.tasks.push(new Promise<void>(async (resolve, reject) => {
                try {
                    const pg = await this.pages.get();
                    const page = pg.page;
                    await page.goto(`https://artfight.net/manage/bookmarks?page=${i}`);
                    const response = await page.evaluate(() => {
                        return Array.from(document.querySelectorAll(".card.mt-2")).map(card => {
                            const row = card.querySelector(".row");
                            const elements = row ? Array.from(row.children) : [];
                            const a = elements[0]?.querySelector(".thumbnail") as HTMLAnchorElement | null;
                            const adt = a?.href.split("/").pop()?.split(".") || [];
                            const id = adt[0] || '';
                            const icon = a?.children[0] ? (a.children[0] as HTMLImageElement).src : '';
                            const bdt = elements[1]?.children || [];
                            const nameElement = bdt[0]?.querySelector("i");
                            const name = nameElement ? nameElement.innerText : '';
                            const ownerElement = bdt[0]?.querySelector("strong");
                            const owner = ownerElement ? ownerElement.innerText.trim() : '';
                            const description = bdt[1]?.textContent?.trim() || '';
                            const cdt = elements[2]?.children || [];
                            const updated = cdt[0]?.textContent?.replace("Updated: ", "") || '';
                            const order = cdt[1]?.textContent?.replace("Order: ", "") || '';
                            return [id, name, icon, owner, description, updated, order];
                        });
                    });
                    bookmarks.push(...response);
                    this.pages.return(pg.index);
                    resolve();
                    if (response.length < 30) {
                        manager.emit("executionStop")
                        resolve()
                    }
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
    async fetchClientUserBookmarkAtIndex(index:number) {
        if(index<0) throw new Error("Index cannot be negative");
        const pg = await this.pages.get();
        const page = pg.page;
        const pageIndex = Math.floor(index / 30) + 1;
        await page.goto(`https://artfight.net/manage/bookmarks?page=${pageIndex}`);
        const response = await page.evaluate((index) => {
            const cardIndex = index % 30;
            const card = document.querySelectorAll(".card.mt-2")[cardIndex];
            if(!card) throw new Error("Bookmark not found");
            const row = card.querySelector(".row");
            if (!row) throw new Error("Row not found");
            const elements = Array.from(row.children);
            const a = elements[0].querySelector(".thumbnail");
            const adt = a ? (a as HTMLAnchorElement).href.split("/").pop()?.split(".") : [];
            const id = adt ? adt[0] : '';
            const icon = a ? (a.children[0] as HTMLImageElement).src : '';
            const bdt = elements[1].children;
            const nameElement = bdt[0].querySelector("i");
            const name = nameElement ? nameElement.innerText : '';
            const ownerElement = bdt[0].querySelector("strong");
            const owner = ownerElement ? ownerElement.innerText.trim() : '';
            const description = bdt[1]?.textContent?.trim() || '';
            const cdt = elements[2].children;
            const updated = cdt[0]?.textContent?.replace("Updated: ", "") || '';
            const order = cdt[1]?.textContent?.replace("Order: ", "") || '';
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
    async fetchClientUserBookmarksRange(start:number, end:number) {
        if (start > end) throw new Error("Start index cannot be greater than end index");
        const manager = new TaskManager();
        const bookmarks: string[][] = [];
        const pagesamm = Math.ceil((end - start + 1) / 30);
        for (let i = 1; i <= pagesamm; i++) {
            manager.tasks.push(new Promise<void>(async (resolve, reject) => {
                try {
                    const pg = await this.pages.get();
                    const page = pg.page;
                    await page.goto(`https://artfight.net/manage/bookmarks?page=${i}`);
                    const response = await page.evaluate(() => {
                        return Array.from(document.querySelectorAll(".card.mt-2")).map(card => {
                            const row = card.querySelector(".row");
                            if (!row) throw new Error("Row not found");
                            const elements = Array.from(row.children);
                            const a = elements[0].querySelector(".thumbnail");
                            const adt = a ? (a as HTMLAnchorElement).href.split("/").pop()?.split(".") : [];
                            const id = adt ? adt[0] : '';
                            const icon = a ? (a.children[0] as HTMLImageElement).src : '';
                            const bdt = elements[1].children;
                            const nameElement = bdt[0].querySelector("i");
                            const name = nameElement ? nameElement.innerText : '';
                            const ownerElement = bdt[0].querySelector("strong");
                            const owner = ownerElement ? ownerElement.innerText.trim() : '';
                            const description = bdt[1]?.textContent?.trim() || '';
                            const cdt = elements[2].children;
                            const updated = cdt[0]?.textContent?.replace("Updated: ", "") || '';
                            const order = cdt[1]?.textContent?.replace("Order: ", "") || '';
                            return [id, name, icon, owner, description, updated, order];
                        });
                    });
                    bookmarks.push(...response);
                    this.pages.return(pg.index);
                    if (response.length < 30) {
                        manager.emit("executionStop")
                        resolve()
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
                const adt = a ? (a as HTMLAnchorElement).href.split("/").pop()?.split(".") : [];
                const id = adt ? adt[0] : '';
                (editBookmarkButton as HTMLButtonElement).click();
                return id;
            });
            await page.waitForSelector(".btn.btn-danger");
            await page.evaluate(() => {
                const deleteButton = document.querySelector(".btn.btn-danger");
                if (!deleteButton) throw new Error("Delete button not found");
                (deleteButton as HTMLButtonElement).click();
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
    async deleteClientUserBookmarkByCharacterId(id: string): Promise<boolean> {
        const manager = new TaskManager();
        let pagenum = 1;
        let bookmarkDeleted = false;
        while (!bookmarkDeleted) {
            manager.tasks.push(new Promise(async res => {
                let pg = await this.pages.get();
                let page = pg.page;
                await page.goto(`https://artfight.net/manage/bookmarks?page=${pagenum}`);
                let response = await page.evaluate((id: string) => {
                    const cards = document.querySelectorAll(".card.mt-2");
                    if (cards.length === 0) {
                        throw new Error("Bookmark not found");
                    }
                    const card = Array.from(cards).find(card => {
                        const a = card.querySelector(".thumbnail") as HTMLAnchorElement | null;
                        if (!a) {
                            throw new Error("Thumbnail not found");
                        }
                        const adt = a.href.split("/").pop()?.split(".");
                        if (!adt) {
                            throw new Error("Invalid URL format");
                        }
                        return adt[0] === id;
                    });
                    if (!card) return false;
                    const editBookmarkButton = card.querySelector(".edit-bookmark") as HTMLButtonElement | null;
                    if (!editBookmarkButton) return false;
                    (editBookmarkButton as HTMLButtonElement).click();
                    const deleteButton = document.querySelector(".btn.btn-danger") as HTMLButtonElement | null;
                    if (!deleteButton) return false;
                    (deleteButton as HTMLButtonElement).click();
                    manager.emit("executionStop")
                    return true;
                }, id);
                this.pages.return(pg.index);
                if(!response){
                    pagenum++;
                }
                res(response);
            }));
        }
        return bookmarkDeleted;
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
                (editBookmarkButton as HTMLButtonElement).click();
                return true;
            });
            if (!hasBookmark) break;
            await page.waitForSelector(".btn.btn-danger");
            await page.evaluate(() => {
                const deleteButton = document.querySelector(".btn.btn-danger");
                if (!deleteButton) throw new Error("Delete button not found");
                (deleteButton as HTMLButtonElement).click();
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
    async bookmarkCharacter(id:string, order:string="0", description = "") {
        //i tried like 20 time to make description but it doesn't work, feel free to try it yourself
        const pg = await this.pages.get();
        const page = pg.page;
        const index = pg.index;
        await page.goto(`https://artfight.net/character/${id}`);
        await page.waitForSelector(".bookmark-character");
        await page.evaluate(() => {
            const bookmarkButton = document.querySelector(".bookmark-character");
            if (bookmarkButton) {
                (bookmarkButton as HTMLElement).click();
            }
        });
        await page.waitForSelector("#modal");
        await page.waitForSelector("input#order");
        await page.evaluate(() => {
            const orderInput = document.querySelector("input#order");
            if (orderInput) {
                (orderInput as HTMLInputElement).value = "";
            }
        });
        await page.type("input#order", order.toString());
        await page.evaluate(() => {
            const modalForm = document.querySelector("#modal-form");
            if (modalForm) {
                (modalForm as HTMLFormElement).submit();
            }
        });
        this.pages.return(index);
        return true;
    }
    /**
     * @param {string} id The id of the character to unbookmark
     * @returns {Promise<boolean>} Whether the character was unbookmarked
     */
    async unbookmarkCharacter(id:string){
        let pg = await this.pages.get();
        let page = pg.page;
        let index = pg.index;
        await page.goto(`https://artfight.net/character/${id}`);
        await page.waitForSelector(".bookmark-character");
        await page.evaluate(()=>{
            const bookmarkButton = document.querySelector(".bookmark-character");
            if (bookmarkButton) {
                (bookmarkButton as HTMLElement).click();
            }
        })
        await page.waitForSelector("input.btn-danger");
        await page.evaluate(()=>{
            const deleteButton = document.querySelector("input.btn-danger");
            if (deleteButton) {
                (deleteButton as HTMLButtonElement).click();
            }
        })
        this.pages.return(index);
        return true;
    }
    /**
     * @param {number} limit The maximum amount of messages to fetch
     * @returns {Promise<Message[]>} List of messages
     */
    async fetchClientUserMessages(limit:number=20){
        let fetched=0
        let manager = new TaskManager();
        let list:{id:string,subject:string,from:string,date:string,description?:string}[]=[];
        for(let pageIndex=0; pageIndex<Math.ceil(limit/20);pageIndex++){
            manager.tasks.push(new Promise<void>(async(resolve)=>{
                if(fetched>limit)resolve();
                const {page,index} = await this.pages.get();
                await page.goto(`https://artfight.net/messages?page=${pageIndex+1}`)
                let messages = await page.evaluate(()=>{
                    return Array.from(document.querySelectorAll("tbody tr")).map(r=>{
                        let id = (r.children.item(0)?.children.item(0) as HTMLInputElement)?.value;
                        if(!id)throw new Error("Message id not found");
                        let subject = r.children.item(1)?.querySelector("a")?.innerText;
                        if(!subject)throw new Error("Message subject not found");
                        let from = r.children.item(2)?.textContent?.trim();
                        if(!from)throw new Error("Message sender not found");
                        let date = r.children.item(3)?.textContent?.trim();
                        if(!date)throw new Error("Message send date not found");
                        return {id,subject,from,date};
                    })
                })
                if(fetched+messages.length>limit){
                    messages=messages.slice(0,limit-fetched);
                    fetched=limit;
                }else{
                    fetched+=messages.length;
                }
                list.push(...messages);
                this.pages.return(index);
                resolve();
            }))
        }
        await manager.execute();
        manager=new TaskManager();
        if(![Complete.All,Complete.Messages].includes(this.client.completes as Complete)){
            return list.map(r=>new Message(r.id,r.subject,r.from,r.date));
        }
        for (let i=0;i<list.length;i++) {
            manager.tasks.push(new Promise<void>(async (resolve) => {
                const { page, index } = await this.pages.get();
                await page.goto(`https://artfight.net/message/${list[i].id}`);
                const description = await page.evaluate(() => {
                    const element = document.querySelector(".card-body.well-lg");
                    return element ? element.textContent?.trim() : '';
                });
                list[i].description=description;
                this.pages.return(index);
                resolve();
            }));
        }
        await manager.execute();
        return list.map(r=>new Message(r.id,r.subject,r.from,r.date,r.description))
    }
    /**
     * Listens for new messages received by the client user.
     */
    async listenClientUserMessageReceived(): Promise<void> {
        try {
            const { page, index } = await this.pages.get();
            await page.goto("https://artfight.net/messages");
            let lastMessageTimestamp: string = await page.evaluate(() => {
                return document.querySelector("tbody tr")?.children.item(3)?.textContent?.trim() || "";
            });
            setInterval(async () => {
                await page.reload();
                const newMessages = await page.evaluate((lastTimestamp) => {
                    const rows = Array.from(document.querySelectorAll("tbody tr"));
                    const newMessages = [];
                    const lastTimestampDate = new Date(lastTimestamp);
                    for (const row of rows) {
                        const dateText = row.children.item(3)?.textContent?.trim();
                        if (dateText) {
                            const date = new Date(dateText);
                            if (date > lastTimestampDate) {
                                const id = (row.children.item(0)?.children.item(0) as HTMLInputElement)?.value;
                                if (!id) throw new Error("Message id not found");
                                const subject = row.children.item(1)?.querySelector("a")?.innerText;
                                if (!subject) throw new Error("Message subject not found");
                                const from = row.children.item(2)?.textContent?.trim();
                                if (!from) throw new Error("Message sender not found");
                                newMessages.push({ id, subject, from, date: dateText, description: "" });
                            }
                        }
                    }
                    return newMessages;
                }, lastMessageTimestamp);
                for (const message of newMessages) {
                    await page.goto(`https://artfight.net/message/${message.id}`);
                    const description = await page.evaluate(() => {
                        const element = document.querySelector(".card-body.well-lg");
                        return element ? element.textContent?.trim() : '';
                    });
                    message.description = description ?? '';
                    this.client.emit(ClientEvents.MessageReceived, message as Message);
                }
                if (newMessages.length > 0) {
                    lastMessageTimestamp = newMessages[0].date;
                }
            }, Config.MessageCheckInterval*1000);
        } catch (error) {
            console.error("Error in listenClientUserMessageReceived:", error);
        }
        }
        /**
         * @param limit The maximum amount of attacks to fetch **(not implemented)**
         * @returns {Promise<SubmitionPartial[]>} List of attack partial data
         */
        async browseAttacks(limit:number){
            //Implement limit
            let {page,index} = await this.pages.get();
            await page.goto("https://artfight.net/browse/attacks");
            let attacks=(await page.evaluate(()=>{
                return Array.from(document.querySelectorAll(".col-6.col-md-3.col-lg-2")).map(r => {
                    const firstChild = r.children.item(0);
                    if (!firstChild) return null;
                    const secondChild = firstChild.children.item(0);
                    if (!secondChild) return null;
                    let data = secondChild.children;
                    return {icon:(data.item(0)?.children.item(0) as HTMLImageElement)?.src, title:data.item(1)?.textContent,link:(data.item(1)?.children.item(0) as HTMLAnchorElement)?.href}
                }).filter(r => r !== null)
            }));
            this.pages.return(index);
            return attacks.map(r=>new SubmitionPartial(r.icon,r.title||"",r.link));
        }
        /**
         * @param {number} limit The maximum amount of characters to fetch **(not implemented)**
         * @returns {Promise<CharacterPartial[]>} List of character partial data
         */
        async browseCharacters(limit:number){
            //Implement limit
            let {page,index} = await this.pages.get();
            await page.goto("https://artfight.net/browse/characters");
            let characters=(await page.evaluate(()=>{
                return Array.from(document.querySelectorAll(".col-6.col-md-3.col-lg-2")).map(r => {
                    const firstChild = r.children.item(0);
                    if (!firstChild) return null;
                    const secondChild = firstChild.children.item(0);
                    if (!secondChild) return null;
                    let data = secondChild.children;
                    let icon = ((data.item(0) as HTMLAnchorElement)?.children.item(0) as HTMLImageElement).src;
                    let name = (data.item(1) as HTMLAnchorElement)?.textContent;
                    let id = (data.item(1)?.children.item(0) as HTMLAnchorElement)?.href.split("/").pop()?.split(".")[0];
                    let link = (data.item(1)?.children.item(0) as HTMLAnchorElement)?.href
                    return {icon, name,link, id}
                }).filter(r => r !== null)
            })) as CharacterPartial[];
            this.pages.return(index);
            return characters.map(r=>new CharacterPartial(r.icon,r.name,r.link,r.id));
        }
        async fetchNotifications(limit:number){
            let {page,index} = await this.pages.get();
            await page.goto("https://artfight.net/notifications");
            let notifications =(await page.evaluate(()=>{
                return Array.from(document.querySelectorAll(".card.mb-2")).map(r=>{
                    let children = Array.from(r.querySelectorAll("td:not(:first-child):not(:last-child)")).map(r=>r.textContent?.replace("\n","").trim());
                    let type;
                    if(children[0]?.includes("is now following you!")){
                        type="follow"
                    }else{
                        type="other"
                    }
                    return {type,content:children[0] as string,timestamp:children[1]}
                })
            }))
            this.pages.return(index);
            return notifications.map(r=>new Notification(r.type=="Follow"?NotificationType.Follow:NotificationType.Other,r.content,r.timestamp?r.timestamp:""));
        }
}
export{ArtfightScrapper};
