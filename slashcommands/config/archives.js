const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'archives',
			description: "View and set the server's archives channel",
			options: [{
				name: 'channel',
				description: "The channel for the archives to go to",
				type: 7,
				channel_types: [0, 5, 10, 11, 12],
				required: false
			}],
			usage: [
				"- View config",
				" [channel] - Set a new archives channel"
			]
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var cfg = await ctx.client.stores.configs.get(ctx.guild.id);
		var channel = ctx.options.getChannel('channel');

		if(!channel) {
			return {embeds: [{
				title: "Archives channel",
				description: cfg?.archives_id ? `<#${cfg.archives_id}>` : "(not set)"
			}]}
		}

		cfg.archives_id = channel.id;
		await cfg.save();
		return "Channel set."
	}
}

module.exports = (bot, stores) => new Command(bot, stores);