class Comment{
    /**
     * @type {String} Author of the comment
     */
    author;
    /** 
     * @type {String} Content of the comment
     */
    content;
    /**
     * @type {String} Timestamp of when the comment was posted
     */
    posted;
    /**
     * @param {String} author Author of the comment
     * @param {String} content Content of the comment
     * @param {String} posted Timestamp of when the comment was posted
     */
    constructor(author,content,posted){
        this.author=author;
        this.content=content;
        this.posted=posted;
    }
}
module.exports={Comment}
/**
 * TODO:
 * Implement complete
 */