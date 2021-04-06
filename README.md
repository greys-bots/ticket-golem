# Ticket Golem
*A Minecraft themed Discord bot for support tickets.*

## What's this?
Ticket Golem is a Discord bot created to help out with support tickets. Admins can send a default post, or specify their own post, for server members to react to in order to open support tickets. Their prefix is `tg!`, and you can invite them with [this link](https://discordapp.com/api/oauth2/authorize?client_id=649629984930922506&permissions=60496&scope=bot).

When a ticket is opened, a brand new channel is created. Ticket Golem uses member-based permissions to allow and deny access to the channel, and members can be added/removed using appropriate commands.

Users can have 5 tickets open at once, to prevent spam. At the moment, 10 server members (not including the ticket's opener) can be added to tickets by the bot, with other members having to be manually added- in the future this will likely be a configurable option.

## Getting started
First off, invite the bot using the link in the above section.

After inviting them, make sure you create a category that you want tickets to go in. Here's a recommended setup:
![A "tickets" category with "open-a-ticket" and "ticket-archives" as channels inside](https://cdn.discordapp.com/attachments/613904722398674944/649676171067260928/unknown.png)

Where the `tickets` category is overall only visible to mods, but the `open-a-ticket` channel is visible to everyone. The latter is where you'll want to put the reaction post. Also, **make sure that Ticket Golem has the ability to `Manage Permissions` in that category**- this permission can't be given with a normal invite link.

Next, `tg!setup`. Enter the name of the category (`tickets` in the above example) you want tickets to go in, then enter the name of the archives channel (`ticket-archives` above). If you'd like, you can skip the second part by typing `skip`, which will just make the bot DM you archives instead.

To finish up, use `tg!post [channel]` in order to post the starter message in the given channel. If you want a custom message, send that in the channel first, and then use `tg!bind [channel] [message ID]` to bind the reaction.

Now you're all set!

## Features
### (Mostly) unlimited tickets
TG has no hard limits on tickets. The only limit is the number of channels your server can have, which is 500 total and 50 per category. If you run out of ticket space in the category, you can createa a second one and set the config to create tickets there instead.

### Configurable limits
While TG has no hard limits for the total number of tickets opened in a server, server owners can set limits for how many tickets users can have open at once. This is to prevent spam and to keep mods from being overwhelmed with tickets. You can also configure how many users can be added to a ticket via commands, and disable this entirely. Check out the `ticketlimit`, `userlimit`, and `disable`/`enable` commands for more info.

Deleting and archiving tickets will allow users to open more of them, so you shouldn't have to worry about limits as long as tickets are properly taken care of.

### Channel deletion handling
Deleting a ticket's channel will automatically delete it from the tickets database. This is a quick shortcut to the `tg!delete` command, in case you have a lot of tickets to delete at once.

### Ticket names and descriptions
Users can edit their ticket to change the name or set a description. This will also change the channel's name/description for easier finding.

This comes with the added bonus of being able to search through tickets using `tg!find`!

### Reaction-based usage
Much of TG's ticket management features are reaction-based, making closing/opening, archiving, and deleting tickets all a matter of a few clicks. You can use commands for most of it as well, making the bot accessible for users that can't or prefer not to use reactions.

## Self hosting
### Requirements
**Node:** 14.0 or above  
**Postgres:** any version  
**Tech:** a VPS or computer that's often online  
You'll also want some technical know-how, especially if you intend to make changes

### Steps
(Assuming you have all the requirements set up)
1. Download this repository and unzip (if applicable) to wherever you want it
2. Open a terminal in the root folder and use `npm i` to install dependencies
3. Copy the `example.env` rename it to `.env`. Fill it with the correct values
4. Use `node bot` to run the bot

## Support and links
[Support server](https://discord.gg/EvDmXGt)  
[Patreon](https://patreon.com/greysdawn)  
[Ko-Fi](https://ko-fi.com/greysdawn)
