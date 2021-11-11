module.exports = {
	data: {
		name: 'open',
		description: "Re-open a ticket",
		options: [{
			name: 'ticket',
			description: "The ticket to open",
			type: 3,
			required: false
		}]
	},
	usage: [
		'- Opens the ticket associated with the current channel',
		"[ticket] - Opens another ticket"
	],
	async execute(ctx) {
		var cfg = await ctx.client.stores.configs.get(ctx.guild.id);
		var hid = ctx.options.getString('ticket')?.toLowerCase().trim();

		var ticket;
		if(hid) ticket = await ctx.client.stores.tickets.get(ctx.guild.id, hid);
		else ticket = await ctx.client.stores.tickets.getByChannel(ctx.guild.id, ctx.channel.id);

		var check = await ctx.client.utils.checkTicketPerms({
			msg: ctx,
			ticket,
			user: ctx.user,
			cfg,
			action: 'open'
		})
		if(!check) return "You do not have permission to edit this ticket.";

		var channel;
		try {
			if(ctx.channel.id == ticket.channel_id) channel = ctx.channel;
			else channel = await ctx.guild.channels.fetch(ticket.channel_id);
			
			ticket = await ctx.client.stores.tickets.update(
				ctx.guild.id,
				ticket.hid,
				{closed: false}
			)
			
			for(var u of ticket.users) {
				await channel.permissionOverwrites.edit(u.id, {
					'VIEW_CHANNEL': true,
					'SEND_MESSAGES': true
				})
			}

			await ctx.client.handlers.ticket.editTicket({
				ticket,
				channel,
				msg: ctx
			})
		} catch(e) {
			return e.message ?? e;
		}

		return "Ticket opened."
	}
}