const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'setup',
			description: "Set up the server's configuration",
			usage: [
				"- Set up the config"
			]
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var cfg = await ctx.client.stores.configs.get(ctx.guild.id);

		var sel = await ctx.client.utils.awaitChannelSelect(ctx, {
			message: "Select the category you would like tickets to be created under.",
			max: 1,
			min: 1,
			placeholder: "Select a category",
			types: [4]
		})
		if(!Array.isArray(sel)) return sel;
		cfg.category_id = sel[0];

		sel = await ctx.client.utils.awaitChannelSelect(ctx, {
			message: "Select the channel you would like ticket archives to be sent to.",
			max: 1,
			min: 1,
			placeholder: "Select a channel",
			types: [0, 5, 10, 11, 12]
		})
		if(!Array.isArray(sel)) return sel;
		cfg.archives_id = sel[0];

		sel = await ctx.client.utils.awaitRoleSelect(ctx, {
			message: "Select the moderator role(s) you would like to have access to tickets.",
			max: 25,
			min: 1,
			placeholder: "Select role(s)"
		})
		if(!Array.isArray(sel)) return sel;
		cfg.roles = sel;

		await cfg.save();

		var channel;
		var embed = {
			title: "Start Ticket",
			description: "React with ✅ or interact below to open a ticket.",
			color: 0x55aa55
		}

		sel = await ctx.client.utils.awaitChannelSelect(ctx, {
			message: "Select the channel you would like to send the ticket opener to.",
			max: 1,
			min: 1,
			placeholder: "Select a channel",
			types: [0, 5, 10, 11, 12]
		})
		if(!Array.isArray(sel)) return sel;
		channel = await ctx.guild.channels.fetch(sel[0]);

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

		return "Configuration complete. For more config options, check out the `/help` command.";
	}
}

module.exports = (bot, stores) => new Command(bot, stores);