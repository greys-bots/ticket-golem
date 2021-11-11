module.exports = {
	data: {
		name: 'bind',
		description: "Bind the ticket open reaction to a message",
		options: [
			{
				name: 'message',
				description: "The message ID to bind the reaction to",
				type: 3,
				required: true
			},
			{
				name: 'channel',
				description: "The channel the message is in, if not current one",
				type: 7,
				channel_types: [0, 5, 10, 11, 12]
			}
		]
	},
	usage: [
		"[message] - Bind the reaction to a message in the current channel",
		"[message] [channel] - Bind a reaction to a message in another channel"
	],
	async execute(ctx) {
		var mid = ctx.options.getString('message')?.trim();
		var channel = ctx.options.getChannel('channel');
		if(!channel) channel = ctx.channel;

		try {
			var message = await channel.messages.fetch(mid);
			var post = await ctx.client.stores.posts.get(ctx.guild.id, channel.id, message.id);
			if(post) return "Reaction already bound to that message.";
			
			await message.react('✅');
			await ctx.client.stores.posts.create(
				ctx.guild.id,
				channel.id,
				message.id
			)
		} catch(e) {
			return e.message ?? e;
		}

		return "Reaction bound.";
	},
	permissions: ["MANAGE_MESSAGES"]
}