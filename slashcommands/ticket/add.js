const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'add',
			description: "Add users to a ticket",
			options: [
				{
					name: 'user',
					description: "A user to add to the ticket",
					type: 6,
					required: true
				},
				{
					name: 'ticket',
					description: "The ticket to add a user to",
					type: 3,
					required: false
				}
			],
			usage: [
				"[user] - Adds a user to the ticket belonging to the current channel",
				"[user] [ticket] - Adds a user to another ticket"
			]
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var cfg = await ctx.client.stores.configs.get(ctx.guild.id);
		var limit = cfg?.user_limit ?? 10;
		
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
			action: 'add'
		})
		if(!check) return "You do not have permission to edit this ticket.";
		
		var user = ctx.options.getUser('user');
		if(ticket.users.includes(user.id))
			return "User already added to ticket.";

		var channel;
		try {
			if(ctx.channel.id == ticket.channel_id)
				channel = ctx.channel;
			else channel = await ctx.guild.channels.fetch(ticket.channel_id);

			await channel.permissionOverwrites.edit(user.id, {
				'ViewChannel': true,
				'SendMessages': true
			})
			ticket.users = ticket.users.concat(user.id);
			await ticket.save();

			await ctx.client.handlers.ticket.editTicket({
				ticket,
				channel,
				msg: ctx
			})
		} catch(e) {
			return e.message ?? e;
		}

		return "User added to ticket.";
	}
}

module.exports = (bot, stores) => new Command(bot, stores);