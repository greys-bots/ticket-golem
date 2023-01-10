const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'bind',
			description: "Bind the ticket starter react to a message",
			type: 3,
			usage: [
				'Right click a message -> `bind`'
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
			if(post) return "Reaction already bound to that message.";
			
			await msg.react('✅');
			await ctx.client.stores.posts.create({
				server_id: ctx.guild.id,
				channel_id: msg.channel.id,
				message_id: msg.id
			})
		} catch(e) {
			return e.message ?? e;
		}

		return "Reaction bound.";
	}
}
module.exports = (bot, stores) => new Command(bot, stores);