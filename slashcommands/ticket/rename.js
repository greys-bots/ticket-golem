const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'rename',
			description: "Rename a ticket",
			options: [
				{
					name: 'name',
					description: "The new ticket name",
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
				'[name] - Renames the ticket associated with the current channel',
				"[name] [ticket] - Renames another ticket"
			]
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var cfg = await ctx.client.stores.configs.get(ctx.guild.id);
		
		var name = ctx.options.getString('name')?.trim();
		if(name.length + 5 > 100) return "Names must be 95 characters or less.";		
		
		var hid = ctx.options.getString('ticket')?.toLowerCase().trim();
		var ticket;
		if(hid) ticket = await ctx.client.stores.tickets.get(ctx.guild.id, hid);
		else ticket = await ctx.client.stores.tickets.getByChannel(ctx.guild.id, ctx.channel.id);

		var check = await ctx.client.utils.checkTicketPerms({
			msg: ctx,
			ticket,
			user: ctx.user,
			cfg,
			action: 'rename'
		})
		if(!check) return "You do not have permission to edit this ticket.";

		var channel;
		try {
			if(ctx.channel.id == ticket.channel_id) channel = ctx.channel;
			else channel = await ctx.guild.channels.fetch(ticket.channel_id);

			ticket.name = name;
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