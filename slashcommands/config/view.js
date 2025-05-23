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
			],
			v2: true
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var cfg = await ctx.client.stores.configs.get(ctx.guild.id);
		if(!cfg) cfg = {};

		var category = cfg.category_id ? `<#${cfg.category_id}>` : "(not set)";
		var archives = cfg.archives_id ? `<#${cfg.archives_id}>` : "(not set)";

		return [{components: [{
			type: 17,
			components: [{
				type: 10,
				content:
					`# Ticket Config\n` +
					`### Category ID\n${category}\n` +
					`### Archive channel ID\n${archives}\n` +
					`### User Add Limit\n${cfg.user_limit == -1 ? "Unlimited" : (cfg.user_limit ?? 10)}\n` +
					`### Concurrent Tickets Limit\n${cfg.ticket_limit == -1 ? "Unlimited" : (cfg.ticket_limit ?? 10)}\n` +
					`### Mod-Only Commands\n${cfg.mod_only?.length ? cfg.mod_only.join("\n") : "(none)"}\n` +
					`### Mod Roles\n${cfg.roles?.[0] ? cfg.roles.map(x => `<@&${x}>`).join("\n") : "(none)"}`
			}]
		}]}];
	}
}

module.exports = (bot, stores) => new Command(bot, stores);