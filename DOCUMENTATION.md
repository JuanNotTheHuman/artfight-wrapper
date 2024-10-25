If you notice any missing documentation please reach out.
# `ArtfightClient` (extends `EventEmitter`)
The client used to connect to Artfight.

## Properties:
- #### scrapper `(ArtfightScrapper)`
  The client's scrapper, used to scrape the data from Artfight.
- #### user `(ClientUser)`
  The user that logged in via the client.
- #### users `(UserManager)`
  The manager containing all of Artfight users.
- #### members `(MemberManager)`
  The manager containing all of Artfight's members (users who paid to support Artfight).
- #### attacks `(SubmitionManager)`
  The manager containing all of Artfight's attacks.
- #### defenses `(SubmitionManager)`
  The manager containing all of Artfight's defenses.
- ### characters `(CharacterManager)`
  The manager containing all of Artfight's characters.
- ### completes `(Complete|Complete[])` ! In development
  The opposite of partials, defines which returned values are returned whole. (Characters, Comments, Users, Submissions, All)

## Methods:
- ### login()
    - #### params:
        - ##### username `(String)`
          The username which you want to login with to Artfight.
        - ##### password `(String)`
          The user's password.
        - ##### callback `(Function)`
          The function that gets called on user login.
        - ##### completes `(Complete|Complete[])`
          Opposite of partials, determines which elements are returned whole (Characters, Comments, Users, Submissions, All).
    - #### returns: `(Promise<void>)`
      Logs in the user and initializes the client.
    - #### usage:
      ```javascript
      client.login('yourUsername', 'yourPassword', () => {
          console.log('Logged in as:', client.user.username);
      }, Complete.All);
      ```
# `ArtfightScrapper` (extends `EventEmitter`)
*[Internal class, not for public use]*
The scrapper used to connect to Artfight and scrape data.

## Properties:
- #### pages `(PageManager)`
  The manager for handling multiple browser pages during scraping.

## Methods:
- ### login()
    - #### params:
        - ##### username `(String)`
          The Artfight username.
        - ##### password `(String)`
          The Artfight password.
    - #### returns: `(Promise<void>)`
      Logs in the user and initializes page management.
    - #### usage:
      ```javascript
      await scrapper.login('yourUsername', 'yourPassword');
      ```

- ### logout()
    - #### returns: `(Promise<void>)`
      Logs out the user and closes the browser.
    - #### usage:
      ```javascript
      await scrapper.logout();
      ```

- ### fetchUserStatus()
    - #### params:
        - ##### username `(String)`
          The name of the user.
    - #### returns: `(Promise<{lastseen: String, joined: String, team: String}> )`
      The online status of the user.
    - #### usage:
      ```javascript
      const status = await scrapper.fetchUserStatus('username');
      console.log(status);
      ```

- ### fetchUserImage()
    - #### params:
        - ##### username `(String)`
          The name of the user.
    - #### returns: `(Promise<String>)`
      The URL of the user's profile image.
    - #### usage:
      ```javascript
      const imageUrl = await scrapper.fetchUserImage('username');
      console.log(imageUrl);
      ```

- ### fetchCharactersByTag()
    - #### params:
        - ##### tags `(String | String[])`
          Tags for character search.
        - ##### limit `(Number)`
          Maximum number of characters to return (default is 10).
    - #### returns: `(Promise<Character[]>)`
      Array of characters matching the specified tags.
    - #### usage:
      ```javascript
      const characters = await scrapper.fetchCharactersByTag(['tag1', 'tag2'], 5);
      console.log(characters);
      ```

- ### fetchUserStatistics()
    - #### params:
        - ##### username `(String)`
          The name of the user.
    - #### returns: `(Promise<{current: Array<String | Number>, overall: String[], achievements: Array<Array<String>>}>)`
      User statistics including current, overall, and achievements.
    - #### usage:
      ```javascript
      const stats = await scrapper.fetchUserStatistics('username');
      console.log(stats);
      ```

- ### fetchUserCharacters()
    - #### params:
        - ##### username `(String)`
          The name of the user.
    - #### returns: `(Promise<Character[]>)`
      Array of characters owned by the user.
    - #### usage:
      ```javascript
      const userCharacters = await scrapper.fetchUserCharacters('username');
      console.log(userCharacters);
      ```

- ### fetchUserCharacter()
    - #### params:
        - ##### link `(String)`
          The URL of the character.
    - #### returns: `(Promise<Character>)`
      Character details scraped from the provided link.
    - #### usage:
      ```javascript
      const character = await scrapper.fetchUserCharacter('https://artfight.net/character/link');
      console.log(character);
      ```

- ### fetchSubmitions()
    - #### params:
        - ##### username `(String)`
          The name of the user.
        - ##### limit `(Number)`
          Maximum number of submissions to return.
    - #### returns: `(Promise<Submition[]>)`
      Array of submissions for the specified user.
    - #### usage:
      ```javascript
      const submissions = await scrapper.fetchSubmitions('username', 5);
      console.log(submissions);
      ```

- ### fetchMembers()
    - #### params:
        - ##### limit `(Number)`
          Maximum number of members to return.
    - #### returns: `(Promise<Array<{username: String, lastseen: String, points: Number, battleratio: Number}>>)`
      List of Artfight members with their details.
    - #### usage:
      ```javascript
      const members = await scrapper.fetchMembers(10);
      console.log(members);
      ```

- ### fetchRandomUsername()
    - #### returns: `(Promise<String>)`
      A random username from Artfight.
    - #### usage:
      ```javascript
      const randomUsername = await scrapper.fetchRandomUsername();
      console.log(randomUsername);
      ```

- ### fetchRandomCharacter()
    - #### returns: `(Promise<Character>)`
      A random character from Artfight.
    - #### usage:
      ```javascript
      const randomCharacter = await scrapper.fetchRandomCharacter();
      console.log(randomCharacter);
      ```
# `User`
  An artfight user.
## Properties:
- #### client `(ArtfightClient)`
  The users artfight client.
- #### username `(String)`
  The users name.
- #### status `(UserStatus)`
  The users status.
- #### attacks `(SubmitionManager)`
  The manager of the attacks made by the user.
- #### defenses `(SubmitionManager)`
  The manager of the defenses made against the user.
- #### characters `(CharacterManager)`
  The manager of the users characters.
- #### statistics `(UserStatistics)`
  The statistics of the user.
- #### image `(String)`
  The URL to the users avatar.
- #### comments `(Comment[])` ! In development
  The comments made on the users page.
# `ClientUser` (extends `User`) ! In development
  The user that logged in via the client.
## Methods:

- ### init()
  - #### returns `(Promise<User>)`
  *[Internal method, not for public use]* Initializes the user.
# `UserManager` (extends `Manager`)
  The manager of artfight users.
## Properties:
- #### client `(ArtfightClient)`
  The client used to log into artfight
## Methods:
- ### fetch()
  - #### params:
    - ##### username `(String)`
      The username of the user you want to fetch.
  - #### returns `(Promise<User>)`
    Fetches the user with the provided username.
  - #### usage:
    ````javascript
    const user = await client.users.fetch("username");
    console.log(user);
    ````
- ### random()
  - #### returns `(Promise<User>)`
    Fetches a random user.
  - #### usage:
    ````javascript
    const user = await client.users.random();
    console.log(user)
    ````
# `MemberManager` (extends `Manager`)
  The manager of artfight members.
## Properties:
- #### client `(ArtfightClient)`
  The client used to log into artfight
## Methods:
- ### fetch()
  - #### params:
    - ##### limit `(Number)`
      Maxium amount of members returned.
  - #### returns `(Promise<Member[]>)`
    Fetches artfight members up to a provided limit.
  - #### usage:
    ````javascript
    const members = await client.members.fetch(10);
    console.log(members);
    ````
# `Member`
  The member of artfight (a user who supports artfight financially).
## Properties:
- #### username `(String)`
  The username of the member.
- #### lastseen `(String)`
  Timestamp of when the member was last seen online.
- #### points `(Number)`
  The number of points aquired by the member in his last event.
- #### battleratio `(Number)`
  Number between `0` and `100` which shows the response rate of the member to attacks.
# `SumbitionManager` (extends `Manager`) ! In development
  The manager of artfights submitions (attacks and defenses).
## Properties:
- #### type `("attack"|"defense")`
  The managers type, determines whether it stores attacks or defenses.
# `CharacterManager` (extends `Manager`)
  The manager of artfights characters
## Methods:
- ### fetch()
  - #### params:
    - ##### username `(String)`
      The username of the user whose characters you want to fetch
  - #### returns `(Promise<Character[]>)`
  Fetches all characters owned by the user with the provided username.
  - #### usage:
    ````javascript
    const characters = await client.characters.fetch("username");
    console.log(characters)
    ````
- ### random()
  - #### returns `(Promise<Character>)`
  Fetches a random character.
  - #### usage:
    ````javascript
    const character = await client.characters.random();
    console.log(character)
    ````
- ### tagSearch()
  - #### params:
    - ##### tags `(String,String[])`
      Tags to filter the characters by.
    - ##### limit `(Number)`
      Maximum amount of characters returned.
  - #### returns `(Promise<Character[]>)`
  Returns an array of characters with the given tags and limited in length by the given limit.
# `Character`
  An artfight character.
## Properties:
- #### id `(String)`
  Identification index of the character.
- #### name `(String)`
  Name of the character.
- #### created `(String)`
  Timestamp of when the character got uploaded to artfight.
- #### images `(String[])`
  List of URLs to images of the character.
- #### description `(String)`
  Description of the character
- #### permissions `(String)`
  Permissions of the character (what the owner allows to do with the character).
- #### attacks `(Sumbition[])`
  List of attacks made on the character.
- #### information `(CharacterInformation)`
  Information abount the character (who owns it/who designed it).
- #### tags `(String[])`
  Tags the character is associated with.
- #### comments `(Comment[])` ! In development
  Comments made on the character.
## Methods:
- ### link()
  - #### returns `(String)`
  The URL to the characters page on artfight.
# `CharacterInformation`
  Information about a character.
## Properties:
- #### owner `(String)`
  Owner of the character.
- #### designer `(String)`
  Designer of the character.
- #### *moreinfo* `(String|undefined)`
  Link to an external site for more character information.
# `Complete` ! Not implemented
  The opposite of partials, defines which returned values are returned whole. (Characters, Comments, Users, Submissions, All)
## Values:
- #### Character `(1)`
  When fetching characters, fetch all the possible data.
- #### Comment `(2)`
  When fetching comments, fetch all the possible data.
- #### User `(3)`
  When fetching users, fetch all the possible data.
- #### Submitions `(4)`
  When fetching submitions, fetch all the possible data.
- #### All `(5)`
  When fetching everything, fetch all the possible data.