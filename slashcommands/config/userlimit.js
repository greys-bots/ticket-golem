const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'userlimit',
			description: "Limit the number of users that can be added to tickets via commands",
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
			extra: "Set to -1 to have no limit on users. Default is 10",
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var cfg = await ctx.client.stores.configs.get(ctx.guild.id);
		var num = ctx.options.getInteger('number');

		if(num != null) {
			cfg.user_limit = num;
			await cfg.save();
			return "Value set."
		}

		return {embeds: [{
			title: "User limit",
			description: `${cfg?.user_limit ?? 10}`
		}]}
	}
}

module.exports = (bot, stores) => new Command(bot, stores);