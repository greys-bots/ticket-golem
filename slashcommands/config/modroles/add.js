const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'add',
			description: "Add to the server's mod roles",
			options: [{
				name: 'role',
				description: "The role to add",
				type: 8,
				required: true
			}],
			usage: [
				"[role] - Adds a mod role"
			]
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var cfg = await ctx.client.stores.configs.get(ctx.guild.id);
		var role = ctx.options.getRole('role');

		if(cfg?.roles?.includes(role.id)) return "That role has already been modded.";
		if(!cfg.roles) cfg.roles = [];
		cfg.roles.push(role.id);
		await cfg.save();
		return "Role added.";
	}
}

module.exports = (bot, stores) => new Command(bot, stores);