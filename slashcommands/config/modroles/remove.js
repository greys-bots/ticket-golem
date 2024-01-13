const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'remove',
			description: "Remove from the server's mod roles",
			options: [{
				name: 'role',
				description: "The role to remove",
				type: 8,
				required: true
			}],
			usage: [
				"[role] - Removes a mod role"
			]
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var cfg = await ctx.client.stores.configs.get(ctx.guild.id);
		var role = ctx.options.getRole('role');

		if(!cfg?.roles?.includes(role.id)) return "That role isn't modded.";
		cfg.roles = cfg.roles.filter(x => x != role.id);
		await cfg.save();
		return "Role removed.";
	}
}

module.exports = (bot, stores) => new Command(bot, stores);