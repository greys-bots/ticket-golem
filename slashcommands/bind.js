module.exports = {
	data: {
		name: 'bind',
		description: '',
		type: 3
	},
	description: "Bind the ticket starter react to a message",
	usage: [
		'Right click a message -> `bind`'
	],
	async execute(ctx) {
		var msg = ctx.options.getMessage('message');

		try {
			var post = await ctx.client.stores.posts.get(ctx.guild.id, msg.channel.id, msg.id);
			if(post) return "Reaction already bound to that message.";
			
			await msg.react('✅');
			await ctx.client.stores.posts.create(
				ctx.guild.id,
				msg.channel.id,
				msg.id
			)
		} catch(e) {
			return e.message ?? e;
		}

		return "Reaction bound.";
	},
	ephemeral: true,
	permissions: ['MANAGE_MESSAGES']
}