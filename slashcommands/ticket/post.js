const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'post',
			description: "Post a ticket opener message",
			options: [{
				name: 'channel',
				description: "A channel to post to",
				type: 7,
				channel_types: [0, 5, 10, 11, 12],
				required: false
			}],
			usage: [
				'- Post the opener message to the current channel',
				"[channel] - Post the message to another channel"
			],
			permissions: ['manageMessages']
		})
		this.#bot = bot;
		this.#stores = stores;
	}

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

			var post = await ctx.client.stores.posts.create({
				server_id: ctx.guild.id,
				channel_id: channel.id,
				message_id: message.id
			})
			console.log(post);
		} catch(e) {
			return {
				content: "Error: " + (e.message ?? e),
				ephemeral: true
			};
		}

		return "Post sent.";
	}
}

module.exports = (bot, stores) => new Command(bot, stores);