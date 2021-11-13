module.exports = {
	help: ()=> "Configure ticket system settings.",
	usage: ()=> [" - Show the current config."],
	execute: async (bot, msg, args) => {
		var cfg = await bot.stores.configs.get(msg.guild.id);
		if(!cfg) cfg = {};

		var category = cfg.category_id ? `${cfg.category_id}` : undefined;
		var archives = cfg.archives_id ? `${cfg.archives_id}` : undefined;

		var embed = {embed: {
			title: "Ticket Config",
			fields: [
				{name: "Category ID", value: (category ? category : "(not set)")},
				{name: "Archive channel ID", value: (archives ? archives : "(not set)")},
				{name: "User Add Limit", value: cfg.user_limit == -1 ? "Unlimited" : `${cfg.user_limit || 10}`},
				{name: "Concurrent Tickets Limit", value: cfg.ticket_limit == -1 ? "Unlimited" : `${cfg.ticket_limit || 5}`},
				{name: "Mod-Only Commands", value: cfg.mod_only?.[0] ? cfg.mod_only.join("\n") : "None"}
			]
		}};

		return embed;
	},
	permissions: ["MANAGE_GUILD"],
	guildOnly: true,
	alias: ['conf','cfg','c']
}