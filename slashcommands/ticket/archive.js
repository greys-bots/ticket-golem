const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'archive',
			description: "Archive a ticket",
			options: [{
				name: 'ticket',
				description: "The ticket to archive",
				type: 3,
				required: false
			}],
			usage: [
				"- Archive ticket associated with the current channel",
				"[ticket] - Archive a specific ticket"
			],
			permissions: ["ManageChannels"]
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var config = await ctx.client.stores.configs.get(ctx.guild.id);

		var hid = ctx.options.getString('ticket')?.toLowerCase().trim()

		var ticket;
		if(hid) ticket = await ctx.client.stores.tickets.get(ctx.guild.id, hid);
		else ticket = await ctx.client.stores.tickets.getByChannel(ctx.guild.id, ctx.channel.id);
		if(!ticket) return "Please provide a valid ticket hid or use this command in a ticket channel.";

		try {
			var channel = await ctx.guild.channels.fetch(ticket.channel_id);
		} catch(e) {
			return "Couldn't find the channel associated with that ticket.";	
		}

		await ctx.client.handlers.ticket.archive({
			ticket,
			channel,
			cfg: config,
			user: ctx.user
		})

		if(channel.id != ctx.channel.id)
			return {content: "Ticket archived.", ephemeral: true};
	}
}

module.exports = (bot, stores) => new Command(bot, stores);