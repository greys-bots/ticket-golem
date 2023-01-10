const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'remove',
			description: "Remove users from a ticket",
			options: [
				{
					name: 'user',
					description: "A user to remove from the ticket",
					type: 6,
					required: true
				},
				{
					name: 'ticket',
					description: "The ticket to remove a user from",
					type: 3,
					required: false
				}
			],
			usage: [
				"[user] - Removes a user from the ticket belonging to the current channel",
				"[user] [ticket] - Removes a user from another ticket"
			]
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var cfg = await ctx.client.stores.configs.get(ctx.guild.id);
		
		var hid = ctx.options.getString('ticket')?.toLowerCase().trim();
		var ticket;
		if(hid) ticket = await ctx.client.stores.tickets.get(ctx.guild.id, hid);
		else ticket = await ctx.client.stores.tickets.getByChannel(ctx.guild.id, ctx.channel.id);
		if(!ticket) return "Ticket not found.";

		var check = await ctx.client.utils.checkTicketPerms({
			msg: ctx,
			ticket,
			user: ctx.user,
			cfg,
			action: 'remove'
		})
		if(!check) return "You do not have permission to edit this ticket.";

		var user = ctx.options.getUser('user');

		var channel;
		try {
			if(ctx.channel.id == ticket.channel_id)
				channel = ctx.channel;
			else channel = await ctx.guild.channels.fetch(ticket.channel_id);
			
			await channel.permissions.delete(user.id);
			ticket.users = ticket.users.filter(x => x != user.id);
			await ticket.save();

			await ctx.client.handlers.ticket.editTicket({
				ticket,
				channel,
				msg: ctx
			})
		} catch(e) {
			return e.message ?? e;
		}

		return "User removed from ticket.";
	}
}

module.exports = (bot, stores) => new Command(bot, stores);