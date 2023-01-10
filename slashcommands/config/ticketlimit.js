const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'ticketlimit',
			description: "Limit the number of tickets per user that can be opened at once",
			options: [{
				name: 'number',
				description: "The number to set the config to",
				type: 4,
				min_value: -1,
				required: false
			}],
			usage: [
				'- View current config',
				' [number] - Set the config'
			],
			extra: "Set to -1 to have no limit on open tickets. Default is 5"
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var cfg = await ctx.client.stores.configs.get(ctx.guild.id);
		var num = ctx.options.getInteger('number');

		if(num != null) {
			cfg.ticket_limit = num;
			await cfg.save();
			return "Value set."
		}

		return {embeds: [{
			title: "Ticket limit",
			description: `${cfg?.ticket_limit ?? 10}`
		}]}
	}
}

module.exports = (bot, stores) => new Command(bot, stores);