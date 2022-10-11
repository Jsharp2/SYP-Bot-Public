const Discord = require('discord.js')
const command = require('./command')
const Tesseract = require('tesseract.js')

const serverid = "Enter Server ID here"

const client = new Discord.Client({
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
    ]
})


client.on('ready', () => {
    console.log('The client is ready!')


    command(client, "!help", (message) => {
        message.reply({
            content: "**__Thank you for adding SYP Bot to your server! Below are the current commands SYP Bot has:__** \n!Upload Teams: When supplied with a photo, prompts you through the league they're in and what category they should be placed in. Creates roles and team chats for any lines in the photo.\n!Announce Game: When provided a photo, processes it an mentions the teams with the time, day, and location of thier game.",
        })
    })

    //Takes a photo and creates the role with the game they play.
    command(client, '!Upload Teams', async (message) => {
        if (message.member.permissions.has("ADMINISTRATOR")) {

            //Establishes important variables for command
            var game = "";
            var category = "";
            var lines = ""
            var ran = 0;
            var roleid = undefined

            //Informs user of what they need to do
            message.channel.send("Please enter the league the team is in")

            //Limits the response to only the creator of the message
            var filter = (m) => m.author.id === message.author.id;

            //Builds the message collector
            const collector = message.channel.createMessageCollector({
                filter,
                max: 2,
                time: 60000
            })

            //Collect information. Ran to make sure variables are correctly filled
            collector.on('collect', mess => {
                if (ran == 0) {
                    game = mess.content
                    mess.channel.send("Please type the Category's name (ex: 6v6 Open Volleyball)")
                }
                else {
                    cat = mess.content
                    category = mess.guild.channels.cache.find(c => c.name == cat)
                }
                //Increments for second usage
                ran++
            })

            //Once the collector is done, beings the process
            collector.on('end', collected => {
                if (collected.size === 0) {
                    message.channel.send("You didn't provide enough results")
                    return
                }

                //If they either didn't provide the information or the category doesn't exist, doesn't run the process
                else if (game != "" && category != "" && category != undefined) {
                    message.channel.send("Creating the roles and channels currently. Please wait")
                    //Loops through each attachment on the message
                    message.attachments.forEach((attachement) => {

                        //Accesses the proxyURL of the attachment for better access
                        var ImageURL = attachement.proxyURL;

                        //Utilizes Tesseract to inspect the image for English words
                        Tesseract.recognize(
                            ImageURL,
                            "eng",
                            //Logs the progress of the photo's analysis in the bot
                            { logger: (m) => console.log(m) }
                        ).then(({ data: { text } }) => {

                            //Creates an array of each line in the string created
                            lines = text.split("\n");

                            //Loops through each line
                            lines.forEach((line) => {

                                //If the line isn't empty, it currently displays the line (will create the role with the game prefix and the team's name, along with a text channel)
                                if (line != "") {

                                    //Builds the prefix for the team (helps with konwing who is being takled to)
                                    const role = game + ": " + line

                                    //Creates the role for the team with the prefix
                                    message.guild.roles.create({
                                        name: role,
                                    }).then((name) => {
                                        //Creates a channel that is only accessible for that team
                                        message.guild.channels
                                            .create(line + " team chat", {
                                                type: 'text',
                                                parent: category,
                                                permissionOverwrites: [
                                                    {
                                                        id: message.guild.id,
                                                        deny: ['VIEW_CHANNEL']
                                                    },
                                                    {
                                                        id: name.id,
                                                        allow: ['VIEW_CHANNEL']
                                                    },
                                                ],

                                            })
                                            .then((channel) => {
                                                channel.setTopic("This is the team chat channel for " + line + " playing in our " + game + " league. Feel free to talk here with your teammates. Supervisors have access as well.")
                                            })
                                    })
                                }
                            })
                        })
                    })
                    //Displays message to inform user of success.
                    message.channel.send("Roles and Channels have been created.")
                }
                //Only if they didn't provide the information needed.
                else {
                    message.channel.send("Role and Channel Creation Cancelled. Please ensure the category is correctly spell/exists")
                }
            })
        }
    })

    //Takes a phot with the call. Mentions the team in the photo to remind them about their game.
    command(client, '!Announce Game', async (message) => {
        correctLines = []
        if (message.member.permissions.has("ADMINISTRATOR")) {
            message.attachments.forEach((attachement) => {

                //Accesses the proxyURL of the attachment for better access
                var ImageURL = attachement.proxyURL;

                //Utilizes Tesseract to inspect the image for English words
                Tesseract.recognize(
                    ImageURL,
                    "eng",
                    //Logs the progress of the photo's analysis in the bot
                    { logger: (m) => console.log(m) }
                ).then(({ data: { text } }) => {
                    lines = text.split("\n")

                    //Goes through each line to see if it's not empty. Helps in case tesseract breaks
                    lines.forEach((line) => {
                        if (line != "") {
                            console.log(line)
                            correctLines.push(line)
                        }
                    })

                    //Creates the anouncement text with the time and location
                    information = "You have a match on " + correctLines[1].replace("@", "on ")

                    var words = correctLines[2].split(" ")

                    //Builds the game type to find role and channel
                    gameType = words[2] + " " + words[3] + " " + words[4] + " " + words[5]
                    console.log(gameType)

                    //Prefix is assembled for the role
                    prefix = gameType + ": ";

                    //Sets up what channel to send the text to.
                    announcements = gameType + " announcements"
                    dash_announce = announcements.replaceAll(" ", "-")
                    correct_accounce = dash_announce.toLowerCase()
                    console.log(correct_accounce)

                    //Splits up the line to access the teams names. Uses if statements to cover potential misreads from Tesseract
                    if (lines[0].includes("VS")) {
                        teams = lines[0].split(/\s+[VS]+\s/)
                    }
                    else if (lines[0].includes("Vs")) {
                        teams = lines[0].split(/\s+[Vs]+\s/)
                    }
                    else if (lines[0].includes("vs")) {
                        teams = lines[0].split(/\s+[vs]+\s/)
                    }
                    else if (lines[0].includes("vS")) {
                        teams = lines[0].split(/\s+[vS]+\s/)
                    }

                    //Adds the prefixes so the roles can be found correctly
                    team1 = prefix + teams[0]
                    team2 = prefix + teams[1]
                    

                    //Finds the roles for the teams
                    var team1role = message.guild.roles.cache.find(m => m.name === team1)
                    var team2role = message.guild.roles.cache.find(m => m.name === team2)

                    //Locates the annoucement channel related to the sport
                    destination = message.guild.channels.cache.find(c => c.name === correct_accounce)
                    console.log("Dest: "+ destination)

                    //Sends the announcement into that channel;
                    destination.send("<@&" + team1role + "> vs <@&" + team2role + ">\n" + information)
                })
            })
        }
    })

    command(client, '!Delete Category', (message) => {
        if (message.member.permissions.has("ADMINISTRATOR")) {
            var category = message.content.replace('!Delete Category ', '')
            destination = message.guild.channels.cache.find(c => c.name === category)
            destination.children.forEach(c => c.delete())
            destination.delete()
        }
    })


    //Checks every message to ensure swearing is not allowed.
    client.on("messageCreate", (message) => {
        //Words that we don't want to allow in the discord
        noUseWords = ["fuck", "shit"]

        //Converst the message to a string object and puts it to lowercase for ease of checking
        myMessage = message.toString().toLowerCase()

        //Checks if any of the non-permitted words appear in the message.
        if (noUseWords.some(el => myMessage.includes(el))) {

            //Messages author to asking them to not swear
            message.author.send("Please do not swear in the Intramural Esports Discord")

            //Removes the message.
            message.delete()
        }
    })
    
})

client.login(serverid)
