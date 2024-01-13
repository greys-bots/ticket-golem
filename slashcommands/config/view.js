const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'view',
			description: "View the current config",
			usage: [
				"- View the server's current config"
			]
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var cfg = await ctx.client.stores.configs.get(ctx.guild.id);
		if(!cfg) cfg = {};

		var category = cfg.category_id ? `<#${cfg.category_id}>` : "(not set)";
		var archives = cfg.archives_id ? `<#${cfg.archives_id}>` : "(not set)";

		return {embeds: [{
			title: "Ticket Config",
			fields: [
				{name: "Category ID", value: category},
				{name: "Archive channel ID", value: archives},
				{name: "User Add Limit", value: cfg.user_limit == -1 ? "Unlimited" : `${cfg.user_limit ?? 10}`},
				{name: "Concurrent Tickets Limit", value: cfg.ticket_limit == -1 ? "Unlimited" : `${cfg.ticket_limit ?? 5}`},
				{name: "Mod-Only Commands", value: cfg.mod_only?.length ? cfg.mod_only.join("\n") : "(none)"},
				{name: "Mod Roles", value: cfg.roles?.[0] ? cfg.roles.map(x => `<@&${x}>`).join("\n") : "(none)"}
			]
		}]};
	}
}

module.exports = (bot, stores) => new Command(bot, stores);