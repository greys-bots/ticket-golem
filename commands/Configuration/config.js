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
	alias: ['conf','cfg','c']
}