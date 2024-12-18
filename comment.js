class Comment{
    /**
     * @type {string} Author of the comment
     */
    author;
    /** 
     * @type {string} Content of the comment
     */
    content;
    /**
     * @type {string} Timestamp of when the comment was posted
     */
    posted;
    /**
     * @param {string} author Author of the comment
     * @param {string} content Content of the comment
     * @param {string} posted Timestamp of when the comment was posted
     */
    constructor(author,content,posted){
        this.author=author;
        this.content=content;
        this.posted=posted;
    }
}
module.exports={Comment}