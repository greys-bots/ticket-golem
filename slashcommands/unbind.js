module.exports = {
	data: {
		name: 'unbind',
		description: '',
		type: 3
	},
	description: "Unbind the ticket starter react from a message",
	usage: [
		'Right click a message -> `unbind`'
	],
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
	},
	ephemeral: true,
	permissions: ['MANAGE_MESSAGES']
}