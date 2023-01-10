const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'unbind',
			description: "Unbind the ticket open reaction from a message",
			options: [
				{
					name: 'message',
					description: "The message ID to unbind the reaction from",
					type: 3,
					required: true
				},
				{
					name: 'channel',
					description: "The channel the message is in, if not current one",
					type: 7,
					channel_types: [0, 5, 10, 11, 12]
				}
			],
			usage: [
				"[message] - Unbind the reaction from a message in the current channel",
				"[message] [channel] - Unbind a reaction from a message in another channel"
			],
			permissions: ["ManageChannels"]
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var mid = ctx.options.getString('message')?.trim();
		var channel = ctx.options.getChannel('channel');
		if(!channel) channel = ctx.channel;

		try {
			var message = await channel.messages.fetch(mid);
			var post = await ctx.client.stores.posts.get(ctx.guild.id, channel.id, message.id);
			if(!post) return "No reaction bound to that message.";

			var react = message.reactions.cache.find(r => r.emoji.name == '✅');
			if(react) await react.remove();
			await post.delete();
		} catch(e) {
			return e.message ?? e;
		}

		return "Reaction unbound.";
	}
}

module.exports = (bot, stores) => new Command(bot, stores);