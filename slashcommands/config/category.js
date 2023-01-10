const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'category',
			description: "View and set the server's ticket category",
			options: [{
				name: 'category',
				description: "The category for tickets to be made in",
				type: 7,
				channel_types: [4],
				required: false
			}],
			usage: [
				"- View config",
				" [category] - Set a new ticket category"
			]
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var cfg = await ctx.client.stores.configs.get(ctx.guild.id);
		var category = ctx.options.getChannel('category');

		if(!category) {
			return {embeds: [{
				title: "Ticket category",
				description: cfg?.category_id ? `<#${cfg.category_id}>` : "(not set)"
			}]}
		}
		
		cfg.category_id = category.id;
		await cfg.save();
		return "Category set."
	}
}

module.exports = (bot, stores) => new Command(bot, stores);