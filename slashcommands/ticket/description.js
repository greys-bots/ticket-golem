const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'description',
			description: "Set the description for a ticket",
			options: [
				{
					name: 'desc',
					description: "The new ticket description",
					type: 3,
					required: true
				},
				{
					name: 'ticket',
					description: "The ticket to open",
					type: 3,
					required: false
				}
			],
			usage: [
				'[desc] - Sets description for the ticket associated with the current channel',
				"[desc] [ticket] - Sets description for another ticket"
			]
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var cfg = await ctx.client.stores.configs.get(ctx.guild.id);
		var description = ctx.options.getString('desc')?.trim();
		if(description.length > 1024) return "Descriptions must be 1024 characters or less.";		
		
		var hid = ctx.options.getString('ticket')?.toLowerCase().trim();
		var ticket;
		if(hid) ticket = await ctx.client.stores.tickets.get(ctx.guild.id, hid);
		else ticket = await ctx.client.stores.tickets.getByChannel(ctx.guild.id, ctx.channel.id);

		await ctx.deferReply()
		var check = await ctx.client.utils.checkTicketPerms({
			msg: ctx,
			ticket,
			user: ctx.user,
			cfg,
			action: 'description'
		})
		if(!check) return "You do not have permission to edit this ticket.";

		var channel;
		try {
			if(ctx.channel.id == ticket.channel_id) channel = ctx.channel;
			else channel = await ctx.guild.channels.fetch(ticket.channel_id);

			await channel.edit({topic: description})
			ticket.description = description;
			await ticket.save();

			await ctx.client.handlers.ticket.editTicket({
				ticket,
				channel,
				msg: ctx
			})
		} catch(e) {
			return e.message ?? e;
		}

		return "Ticket updated."
	}
}

module.exports = (bot, stores) => new Command(bot, stores);