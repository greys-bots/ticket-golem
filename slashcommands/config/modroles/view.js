const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'view',
			description: "View the server's mod roles",
			usage: [
				"- Views the server's mod roles"
			],
			v2: true
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var cfg = await ctx.client.stores.configs.get(ctx.guild.id);

		return {
			components: [{
				type: 17,
				components: [{
					type: 10,
					content:
						`#Server mod roles\n` +
						cfg?.roles?.map(x => `<@&${x}>`).join("\n") ?? "(None set)"
				}]
			}] 
		}
	}
}

module.exports = (bot, stores) => new Command(bot, stores);