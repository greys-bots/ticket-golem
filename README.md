# Ticket Golem
*A Minecraft themed Discord bot for support tickets.*

## What's this?
Ticket Golem is a Discord bot created to help out with support tickets. Admins can send a default post, or specify their own post, for server members to react to in order to open support tickets. Their prefix is `tg!`, and you can invite them with [this link](https://discordapp.com/api/oauth2/authorize?client_id=649629984930922506&permissions=60496&scope=bot).

When a ticket is opened, a brand new channel is created. Ticket Golem uses member-based permissions to allow and deny access to the channel, and members can be added/removed using appropriate commands.

Users can have 5 tickets open at once, to prevent spam. At the moment, 10 server members (not including the ticket's opener) can be added to tickets by the bot, with other members having to be manually added- in the future this will likely be a configurable option.

## How do I get started?
First off, invite the bot using the link in the above section.

After inviting them, make sure you create a category that you want tickets to go in. Here's a recommended setup:
![Recommended category setup](https://cdn.discordapp.com/attachments/613904722398674944/649676171067260928/unknown.png)

Where the `tickets` category is overall only visible to mods, and the `open-a-ticket` channel is visible to everyone. The latter is where you'll want to put the reaction post. Also make sure that Ticket Golem has the ability to `Manage Permissions` in that category- this permission can't be given with a normal invite link.

Next, `tg!config setup`. Enter the name of the category (`tickets` in the above example) you want tickets to go in, then enter the name of the archives channel (`ticket-archives` above). If you'd like, you can skip the second part by typing `skip`, which will just make the bot DM you archives instead.

To finish up, use `tg!post [channel]` in order to post the starter message in the given channel. If you want a custom message, send that in the channel first, and then use `tg!bind [channel] [message ID]` to bind the reaction.

Now you're all set!

## Self hosting
If you'd like to host the bot yourself, you're welcome to do so! However, keep in mind that updates to bot might break your setup.  
That said, here's how to self host:

1. Get PostgreSQL and set it up on your computer
2. Make sure you have Node 12.0+ installed as well
2. Use `npm install` in the root folder to install the bot's dependencies
3. Create an app [here](https://discord.com/developers/applications) and grab the token
4. Fill out the `example.env` and rename it to just `.env`
5. Run `node bot` in the root folder to start the bot

## Getting Help
To get info on the commands, use `tg!help` or `tg!help [commands]`.

To get more advanced support, join the support server linked below.

## Other Links
[Support server](https://discord.gg/EvDmXGt)  
[Patreon](https://patreon.com/greysdawn)  
[Ko-Fi](https://ko-fi.com/greysdawn)