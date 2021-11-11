module.exports = {
	data: {
		name: 'post',
		description: "Post a ticket opener message",
		options: [{
			name: 'channel',
			description: "A channel to post to",
			type: 7,
			channel_types: [0, 5, 10, 11, 12],
			required: false
		}]
	},
	usage: [
		'- Post the opener message to the current channel',
		"[channel] - Post the message to another channel"
	],
	async execute(ctx) {
		var channel = ctx.options.getChannel('channel');
		if(!channel) channel = ctx.channel;
		
		var embed = {
			title: "Start Ticket",
			description: "React with ✅ or interact below to open a ticket.",
			color: 0x55aa55
		}

		try {
			var message = await channel.send({
				embeds: [embed],
				components: [{
					type: 1,
					components: [{
						type: 2,
						style: 3,
						emoji: {name: '✅'},
						label: 'Open ticket',
						custom_id: 'opener'
					}]
				}]
			});

			await ctx.client.stores.posts.create(
				ctx.guild.id,
				channel.id,
				message.id
			)
		} catch(e) {
			return {
				content: "Error: " + (e.message ?? e),
				ephemeral: true
			};
		}

		return "Post sent.";
	},
	permissions: ['MANAGE_MESSAGES']
}