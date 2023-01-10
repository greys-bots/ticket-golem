const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'unbind',
			description: "Unbind the ticket starter react from a message",
			type: 3,
			usage: [
				'Right click a message -> `unbind`'
			],
			ephemeral: true,
			permissions: ['manageMessages'],
			guildOnly: true
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var msg = ctx.options.getMessage('message');

		try {
			var post = await ctx.client.stores.posts.get(ctx.guild.id, msg.channel.id, msg.id);
			if(!post) return "No reaction bound to that message.";
			
			await msg.reactions.removeAll('✅');
			await ctx.client.stores.posts.delete(
				ctx.guild.id,
				msg.channel.id,
				msg.id
			)
		} catch(e) {
			return e.message ?? e;
		}

		return "Reaction unbound.";
	}
}

module.exports = (bot, stores) => new Command(bot, stores);