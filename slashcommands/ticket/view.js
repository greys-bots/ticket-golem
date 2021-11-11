module.exports = {
	data: {
		name: 'view',
		description: "View and list tickets",
		options: [{
			name: 'ticket',
			description: "A specific ticket to view",
			type: 3,
			required: false
		}]
	},
	usage: [
		'- View all tickets in the server',
		'[ticket] - View info for a specific ticket'
	],
	async execute(ctx) {
		var hid = ctx.options.getString('ticket')?.toLowerCase().trim();
		var tickets = await ctx.client.stores.tickets.getAll(ctx.guild.id);
		if(!tickets?.length) return "No tickets to view.";
		if(hid) tickets = tickets.filter(t => t.hid == hid);
		if(!tickets[0]) return "Ticket not found.";

		var embeds = [];
		for(var t of tickets) {
			embeds.push(ctx.client.utils.genTicketEmbed(t))
		}

		if(embeds.length > 1) {
			for(var i = 0; i < embeds.length; i++)
				embeds[i].title += ` (${i+1}/${embeds.length})`;
		}
		
		return embeds;
	},
	permissions: ['MANAGE_CHANNELS'],
	ephemeral: true
}