module.exports = {
	help: ()=> "Configure ticket system settings.",
	usage: ()=> [" - Show the current config.",
				 " setup - Run the config menu.",
				 " category [category] - Sets the server's ticket category.",
				 " archives [channel] - Sets the server's archives channel.",
				 " userlimit <number> - Sets the server's limit for how many users can be added to a ticket via the `add` command. If no limit is given, sets it back to the default (10). Use `tg!help config userlimit` for more info.",
				 " ticketlimit <number> - Sets the server's limit for how many tickets users can open at once. If no limit is given, sets it back to the default (5).",
				 " modonly [command] - Sets whether or not commands like `add/remove` or `rename/describe` are mod-only. Use `tg!help config modonly` for more info."],
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(!cfg) cfg = {};

		var category = cfg.category_id != "" ? msg.guild.channels.find(c => c.id == cfg.category_id) : undefined;
		var archives = cfg.archives_id != "" ? msg.guild.channels.find(c => c.id == cfg.archives_id) : undefined;

		if(!args[0] || args[0] != "setup") return msg.channel.createMessage({embed: {
			title: "Ticket Config",
			fields: [
				{name: "Category ID", value: (category ? category.name.toLowerCase() : "*(not set)*")},
				{name: "Archive channel ID", value: (archives ? archives.name.toLowerCase() : "*(not set)*")},
				{name: "User Add Limit", value: cfg.user_limit == -1 ? "Unlimited" : cfg.user_limit || 10},
				{name: "Concurrent Tickets Limit", value: cfg.ticket_limit == -1 ? "Unlimited" : cfg.ticket_limit || 5},
				{name: "Mod-Only Commands", value: cfg.mod_only ? cfg.mod_only.join("\n") : "None"}
			]
		}});

	},
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ['conf','cfg','c'],
	subcommands: {}
}

module.exports.subcommands.setup = {
	help: ()=> "Set up the server's config.",
	usage: ()=> [" - Run the config menu."],
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(!cfg) cfg = {category_id: "", archives_id: ""};

		var category = cfg.category_id != "" ? msg.guild.channels.find(c => c.id == cfg.category_id) : undefined;
		var archives = cfg.archives_id != "" ? msg.guild.channels.find(c => c.id == cfg.archives_id) : undefined;

		var resp;
		
		await msg.channel.createMessage("Enter the category that tickets should be created in. This can be the category name or ID. You have 1 minute to do this\nNOTE: This category's permissions should only allow mods and I to see channels; I handle individual permissions for users."+(category ? "\nType `skip` to keep the current value." : ""));
		resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time:1000*60,maxMatches:1});
		if(!resp[0]) return msg.channel.createMessage("Action cancelled: timed out");
		if(!(category && resp[0].content.toLowerCase() == "skip")) category = await msg.guild.channels.find(c => (c.id == resp[0].content || c.name.toLowerCase() == resp[0].content.toLowerCase()) && c.type == 4);
		if(!category) return msg.channel.createMessage("Action cancelled: category not found.");

		await msg.channel.createMessage("Enter the channel that archived tickets should be sent to. This can be the channel name, #mention, or ID. You have 1 minute to do this\nNOTE: This is not required. Type `skip` to skip it, and archives will be sent to your DMs instead.");;
		resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time:1000*60,maxMatches:1});
		if(!resp[0]) return msg.channel.createMessage("Action cancelled: timed out");
		if(resp[0].content.toLowerCase() != "skip") archives = await msg.guild.channels.find(c => (c.id == resp[0].content.replace(/[<#>]/g,"") || c.name.toLowerCase() == resp[0].content.toLowerCase()) && c.type == 0);
		if(!archives && resp[0].content.toLowerCase() != "skip") return msg.channel.createMessage("Action cancelled: channel not found.");

		var scc = await bot.utils.updateConfig(bot, msg.guild.id, {category_id: category.id, archives_id: archives ? archives.id : null});

		if(scc) msg.channel.createMessage("Config set!");
		else msg.channel.createMessage("Something went wrong");
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ["s","menu"]
}

module.exports.subcommands.category = {
	help: ()=> "Set server's ticket category.",
	usage: ()=> [" [category ID] - Sets the ticket category for this server."],
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);

		var category = msg.guild.channels.find(c => (c.id == args[0].replace(/[<#>]/g,"") || c.name.toLowerCase() == args[0].toLowerCase()) && c.type == 4);
		if(!category) return msg.channel.createMessage("Action cancelled: category not found");

		var scc = await bot.utils.updateConfig(bot, msg.guild.id, {category_id: category.id});

		if(scc) msg.channel.createMessage("Config set!");
		else msg.channel.createMessage("Something went wrong");
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ["c","cat"]
}

module.exports.subcommands.archive = {
	help: ()=> "Set server's archive channel.",
	usage: ()=> [" [category ID] - Sets the ticket category for this server."],
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);

		var archives = msg.guild.channels.find(c => c.id == args[0].replace(/[<#>]/g,"") || c.name == args[0].toLowerCase());
		if(!archives) return msg.channel.createMessage("Action cancelled: channel not found");

		var scc = await bot.utils.updateConfig(bot, msg.guild.id, {archives_id: archives.id});

		if(scc) msg.channel.createMessage("Config set!");
		else msg.channel.createMessage("Something went wrong");
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ["a","arch","archives","channel"]
}

module.exports.subcommands.userlimit = {
	help: ()=> "Set server's limit for how many people can be added to a ticket via the `add` command.",
	usage: ()=> [" <limit> - Sets the server's user limit. If no limit is given, sets it to the default (10)."],
	desc: ()=> ["This does not affect those manually given permission to view the ticket.\n",
				"Set the limit to -1 if you don't want a limit. This isn't recommended, as it means the ticket opener can spam adding anyone they want to the ticket.",
				"Set the limit to 0 if you don't want any users to be added via this command. NOTE: This still affects moderators. They'll have to manually give users permission to view the ticket."],
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(!cfg) return msg.channel.createMessage("Please set up the rest of the config before using this command.");
		
		var scc = await bot.utils.updateConfig(bot, msg.guild.id, {user_limit: args[0]});
		if(scc) msg.channel.createMessage("Config set.");
		else msg.channel.createMessage("Something went wrong.");
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ["usrlimit", "usrlim", "userlim", "ul"]
}

module.exports.subcommands.ticketlimit = {
	help: ()=> "Set server's limit for how many tickets users can have open at the same time.",
	usage: ()=> [" <limit> - Sets the server's ticket limit. If no limit is given, sets it to the default (5)."],
	desc: ()=> ["Set the limit to -1 if you don't want a limit. This isn't recommended, as it means users can spam opening up tickets.",
				"Set the limit to 0 if you want to temporarily disable ticket opening. NOTE: This still affects moderators. If this is the limit, no one will be able to open tickets."].join("\n"),
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(!cfg) return msg.channel.createMessage("Please set up the rest of the config before using this command.");

		var scc = await bot.utils.updateConfig(bot, msg.guild.id, {ticket_limit: args[0]});
		if(scc) msg.channel.createMessage("Config set.");
		else msg.channel.createMessage("Something went wrong.");
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ["ticlimit", "ticlim", "ticketlim", "tl"]
}

module.exports.subcommands.modonly = {
	help: ()=> "Set whether certain commands can only be used by mods.",
	usage: ()=> [" [command] [true/1 | false/0] - Sets whether the given command is mod-only."],
	desc: ()=> ["Commands that can be set to mod only are `add`, `remove`, `rename`, `description`, `close`, and `reopen`.\nMod-only commands can only be used by users with the `manageMessages` permission."],
	execute: async (bot, msg, args) => {
		if(!args[1]) return msg.channel.createMessage("Please provide a command and what to set its mod-only status to.\nExample: `tg!config modonly add 1` (set the `add` command to be mod-only)");

		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(!cfg) return msg.channel.createMessage("Please set up the rest of the config before using this command.");
		if(!["add", "remove", "rename", "description", "close", "reopen"].includes(args[0])) return msg.channel.createMessage("That command can't be made mod-only.");
		if(!["true", "false", "0", "1"].includes(args[1])) return msg.channel.createMessage("Invalid second argument.\nValid arguments:\n`1 or true` - Sets the command to be mod-only.\n`0 or false` - Sets the command to be usable by non-mods.")

		if(args[1] == "true") {
			if(cfg.mod_only && cfg.mod_only.includes(args[0].toLowerCase())) return msg.channel.createMessage("That command is already mod-only.");

			if(!cfg.mod_only) cfg.mod_only = [args[0].toLowerCase()];
			else cfg.mod_only.push(args[0].toLowerCase());
		} else {
			if(cfg.mod_only && !cfg.mod_only.includes(args[0].toLowerCase())) return msg.channel.createMessage("That command is already not mod-only.");
			
			cfg.mod_only = cfg.mod_only.filter(x => x!= args[0].toLowerCase());
		}

		var scc = await bot.utils.updateConfig(bot, msg.guild.id, {mod_only: cfg.mod_only});
		if(scc) msg.channel.createMessage("Config set.");
		else msg.channel.createMessage("Something went wrong.")
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ["md", "mod", "mods"]
}