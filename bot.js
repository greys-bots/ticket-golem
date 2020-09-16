const Eris 		= require("eris-additions")(require("eris"));
const dblite 	= require("dblite");
const fs 		= require("fs");

dblite.bin = './sqlite/sqlite3.exe';

require('dotenv').config();

const bot 	= new Eris(process.env.TOKEN, {restMode: true});

bot.db		= dblite('data.sqlite',"-header");

bot.utils 	= require('./utils')

bot.chars = process.env.CHARS;
bot.prefix = process.env.PREFIX;
bot.owner = process.env.OWNER;
bot.invlink = process.env.INVITE;

bot.fetch = require('node-fetch');

bot.commands	= {};

bot.status = 0;

const updateStatus = function(){
	switch(bot.status){
		case 0:
			bot.editStatus({name: "tg!h | in "+bot.guilds.size+" guilds!"});
			bot.status++;
			break;
		case 1:
			bot.editStatus({name: "tg!h | serving "+bot.users.size+" users!"});
			bot.status = 0;
			break;
			
		//irrelevant until the website's up
		// case 2:
		// 	bot.editStatus({name: "tg!h | website: golem.greysdawn.com"});
		// 	bot.status = 0;
		// 	break;
	}

	setTimeout(()=> updateStatus(),600000)
}

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

async function setup() {
	bot.db = require('./stores/__db')(bot);

	files = fs.readdirSync("./events");
	files.forEach(f => bot.on(f.slice(0,-3), (...args) => require("./events/"+f)(...args,bot)));

	bot.utils = {};
	files = fs.readdirSync("./utils");
	files.forEach(f => Object.assign(bot.utils, require("./utils/"+f)));

	files = recursivelyReadDirectory("./commands");

	bot.modules = new Discord.Collection();
	bot.mod_aliases = new Discord.Collection();
	bot.commands = new Discord.Collection();
	bot.aliases = new Discord.Collection();
	for(f of files) {
		var path_frags = f.replace("./commands/","").split(/(?:\\|\/)/);
		var mod = path_frags.length > 1 ? path_frags[path_frags.length - 2] : "Unsorted";
		var file = path_frags[path_frags.length - 1];
		if(!bot.modules.get(mod.toLowerCase())) {
			var mod_info = require(file == "__mod.js" ? f : f.replace(file, "__mod.js"));
			bot.modules.set(mod.toLowerCase(), {...mod_info, name: mod, commands: new Discord.Collection()})
			bot.mod_aliases.set(mod.toLowerCase(), mod.toLowerCase());
			if(mod_info.alias) mod_info.alias.forEach(a => bot.mod_aliases.set(a, mod.toLowerCase()));
		}
		if(file == "__mod.js") continue;

		mod = bot.modules.get(mod.toLowerCase());
		if(!mod) {
			console.log("Whoopsies");
			continue;
		}
		
		registerCommand({command: require(f), module: mod, name: file.slice(0, -3).toLowerCase()})
	}
}

bot.asyncForEach = async (arr, bot, msg, args, cb) => {
	for (let i = 0; i < arr.length; i++) {
	    await cb(bot, msg, args, arr[i], i, arr);
	  }
}

bot.formatTime = (date) => {
	if(typeof date == "string") date = new Date(date);

	return `${(date.getMonth()+1) < 10 ? "0"+(date.getMonth()+1) : (date.getMonth()+1)}.${(date.getDate()) < 10 ? "0"+(date.getDate()) : (date.getDate())}.${date.getFullYear()} at ${date.getHours() < 10 ? "0"+date.getHours() : date.getHours()}:${date.getMinutes() < 10 ? "0"+date.getMinutes() : date.getMinutes()}`
}

bot.parseCommand = async function(bot, msg, args) {
	if(!args[0]) return undefined;
	
	var command = bot.commands.get(bot.aliases.get(args[0].toLowerCase()));
	if(!command) return {command, nargs: args};

	args.shift();

	if(args[0] && command.subcommands && command.subcommands.get(command.sub_aliases.get(args[0].toLowerCase()))) {
		command = command.subcommands.get(command.sub_aliases.get(args[0].toLowerCase()));
		args.shift();
	}

	return {command, nargs: args};
}

bot.on("ready",()=>{
	console.log("Ready");
	updateStatus();
})

bot.on("messageCreate",async (msg)=>{
	if(msg.author.bot) return;
	var prefix = new RegExp("^"+bot.prefix, "i");
	if(!msg.content.toLowerCase().match(prefix)) return;
	let args = msg.content.replace(prefix, "").split(" ");
	let cmd = await bot.parseCommand(bot, msg, args);
	console.log(cmd);
	if(cmd) {
		if(cmd[0].guildOnly && !msg.guild) return msg.channel.createMessage("This command can only be used in guilds,");
		var cfg = msg.guild ? await bot.utils.getConfig(bot, msg.guild.id) : {};
		if(cfg && cfg.blacklist && cfg.blacklist.includes(msg.author.id)) return msg.channel.createMessage("You have been banned from using this bot.");
		if(!cmd[0].permissions || (cmd[0].permissions && cmd[0].permissions.filter(p => msg.member.permission.has(p)).length == cmd[0].permissions.length)) {
			cmd[0].execute(bot, msg, cmd[1], cmd[0]);
		} else {
			msg.channel.createMessage("You do do not have permission to do this.")
		}
		
	}
	else msg.channel.createMessage("Command not found.");
});

bot.on("messageReactionAdd", async (msg, emoji, user)=>{
	if(bot.user.id == user) return;
	if(!msg.channel.guild) return;

	if(bot.menus && bot.menus[msg.id] && bot.menus[msg.id].user == user) {
		try {
			await bot.menus[msg.id].execute(bot, msg, emoji);
		} catch(e) {
			console.log(e);
			writeLog(e);
			msg.channel.createMessage("Something went wrong: "+e.message);
		}
	}

	var cfg;
	if(msg.channel.guild) cfg = await bot.utils.getConfig(bot, msg.channel.guild.id);
	else return;

	var tpost = await bot.utils.getPost(bot, msg.channel.guild.id, msg.channel.id, msg.id);
	if(tpost && emoji.name == "✅") {
		console.log(cfg);
		await bot.removeMessageReaction(msg.channel.id, msg.id, emoji.name, user);
		var ch = await bot.getDMChannel(user);
		var tickets = await bot.utils.getTicketsByUser(bot, msg.channel.guild.id, user);
		var limit = cfg.ticket_limit || 5;

		if(tickets && limit > -1 && tickets.count >= limit) {
			try {
				await ch.createMessage("Couldn't open ticket; you already have " + tickets.count + " open for that server.")
			} catch(e) {
				console.log(e);
			}
			return;
		}
		var us = await bot.utils.fetchUser(bot, user);
		var ticket = await bot.utils.createTicket(bot, msg.channel.guild.id, us);
		if(!ticket.hid) {
			try {
				ch.createMessage("Couldn't open your support ticket. ERR:\n"+ticket.err);
			} catch(e) {
				console.log(e);
				return;
			}	
		}
	}

	var ticket = await bot.utils.getTicketByFirstMessage(bot, msg.channel.guild.id, msg.channel.id, msg.id);
	if(ticket) {
		var member = msg.channel.guild.members.find(m => m.id == user);
		if((cfg.mod_only && cfg.mod_only.includes("add") && !member.hasPermission("manageMessages")) || (!member.hasPermission("manageMessages") && user != ticket.opener.id)) {
			try {
				bot.removeMessageReaction(msg.channel.id, msg.id, emoji.name, user);
			} catch(e) {
				console.log(e);
			}
			return;
		}
		var message = await bot.getMessage(msg.channel.id, msg.id);
		var embed = message.embeds[0];
		if(!embed) embed = {
			title: ticket.name,
			description: ticket.description,
			fields: [
				{name: "Ticket Opener", value: `${ticket.opener.mention}`},
				{name: "TIcket Users", value: ticket.users.map(u => u.mention).join("\n")},
			],
			color: 2074412,
			footer: {
				text: "Ticket ID: "+ticket.hid
			},
			timestamp: ticket.timestamp
		}
		try {
			message.removeReaction(emoji.name, user);
		} catch(e) {
			console.log(e);
		}

		var resp;
		switch(emoji.name) {
			case "\u270f":
				await msg.channel.createMessage([
					"What would you like to edit?",
					"```",
					"1 - Ticket name",
					"2 - Ticket description",
					"```"
				].join("\n"));
				resp = await msg.channel.awaitMessages(m => m.author.id == user, {maxMatches: 1, time: 30000});
				if(!resp || !resp[0]) return msg.channel.createMessage("ERR: Timed out.");
				switch(resp[0].content) {
					case "1":
						await msg.channel.createMessage("Enter the new name. You have 1 minute to do this. The name must be " + (100-(ticket.hid.length+1)) + " characters or less. Cancel the action by typing `cancel`.");
						resp = await msg.channel.awaitMessages(m => m.author.id == user, {maxMatches: 1, time: 60000});
						if(!resp || !resp[0]) return m.channel.createMessage("ERR: Timed out.");
						if(resp[0].content.toLowerCase() == "cancel") return msg.channel.createMessage("Action cancelled.");
						if(resp[0].content.length > (100-(ticket.hid.length+1))) return msg.channel.createMessage("ERR: Name too long. Must be between 1 and " + (100-(ticket.hid.length+1)) +" characters in length.");

						var scc = await bot.utils.editTicket(bot, msg.channel.guild.id, ticket.hid, "name", resp[0].content);
						if(scc) msg.channel.createMessage("Ticket edited.");
						else msg.channel.createMessage("Something went wrong.");
						embed.title = resp[0].content;
						message.edit({embed: embed});
						try {
							msg.channel.edit({name: `${ticket.hid}-${resp[0].content}`})
						} catch(e) {
							console.log(e);
							msg.channel.createMessage("ERR: Couldn't edit the channel name. The ticket has still been edited, however.")
						}
						break;
					case "2": 
						await msg.channel.createMessage("Enter the new description. You have 5 minutes to do this. The description must be 1024 characters or less. Cancel the action by typing `cancel`.");
						resp = await msg.channel.awaitMessages(m => m.author.id == user, {maxMatches: 1, time: 300000});
						if(!resp || !resp[0]) return m.channel.createMessage("ERR: Timed out.");
						if(resp[0].content.toLowerCase() == "cancel") return msg.channel.createMessage("Action cancelled.");
						if(resp[0].content.length > 1024) return msg.channel.createMessage("ERR: Description too long. Must be between 1 and 1024 characters in length.");

						var scc = await bot.utils.editTicket(bot, msg.channel.guild.id, ticket.hid, "description", resp[0].content);
						if(scc) msg.channel.createMessage("Ticket edited.");
						else msg.channel.createMessage("Something went wrong.");
						embed.description = resp[0].content;
						message.edit({embed: embed});
						try {
							msg.channel.edit({topic: resp[0].content})
						} catch(e) {
							console.log(e);
							msg.channel.createMessage("ERR: Couldn't edit the channel topic. The ticket has still been edited, however.")
						}
						break;
					default:
						msg.channel.createMessage("ERR: Invalid input.");
						break;
				}
				break;
			case "❌":
				await msg.channel.createMessage("Are you sure you want to close this ticket? (Y/N)\nNOTE: This will remove the ability to send messages; users involved will still see the ticket.");
				resp = await msg.channel.awaitMessages(m => m.author.id == user, {maxMatches: 1, time: 30000});
				if(!resp || !resp[0]) return msg.channel.createMessage("ERR: Timed out.");
				if(["y","yes"].includes(resp[0].content.toLowerCase())) {
					embed.color = parseInt("aa5555", 16);
					embed.title = ticket.name + " (CLOSED)";
					embed.footer = {text: `Ticket ID: ${ticket.hid} | This ticket has been closed.`}
					message.edit({embed: embed});

					try {
						for(var i = 0; i < ticket.users.length; i++) {
							await msg.channel.editPermission(ticket.users[i].id, 1024, 2048, "member");
						}
					} catch(e) {
						console.log(e);
						msg.channel.createMessage("Couldn't edit overrides for at least one user on the ticket. The ticket is closed, but can still be seen by some users.");
					}

					var scc = await bot.utils.editTicket(bot, msg.channel.guild.id, ticket.hid, "closed", true);
					if(scc) msg.channel.createMessage("The ticket has been closed.");
					else msg.channel.createMessage("The ticket has been closed; however, this could not be saved to the database. This ticket may still count towards the opener's open tickets.");
				} else return msg.channel.createMessage("Action cancelled.");
				break;
			case "✅":
				if(!ticket.closed) return msg.channel.createMessage("This ticket is already open.");
				embed.color = parseInt("55aa55", 16);
				embed.title = ticket.name;
				embed.footer = {text: `Ticket ID: ${ticket.hid}`}
				message.edit({embed: embed});

				try {
					for(var i = 0; i < ticket.users.length; i++) {
						await msg.channel.editPermission(ticket.users[i].id, 1024, 0, "member");
					}
				} catch(e) {
					console.log(e);
					msg.channel.createMessage("Couldn't edit overrides for at least one user on the ticket. The ticket is closed, but can still be seen by some users.");
				}

				var scc = await bot.utils.editTicket(bot, msg.channel.guild.id, ticket.hid, "closed", false);
				if(scc) msg.channel.createMessage("The ticket has been re-opened.");
				else msg.channel.createMessage("The ticket has been closed; however, this could not be saved to the database. This ticket may not count towards the opener's open tickets.");
				break;
		}
	}
});

bot.on("messageDelete", async (msg) => {
	try {
		await bot.utils.deletePost(bot, msg.channel.guild.id, msg.channel.id, msg.id);
	} catch(e) {
		console.log("Error deleting ticket post:\n"+e.stack)
	}
})

bot.on("channelDelete", async (channel) => {
	try {
		await bot.utils.deleteTicket(bot, channel.guild.id, channel.id);
	} catch(e) {
		console.log("Error deleting support ticket:\n"+e.stack)
	}
})

setup();
bot.connect();
