const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'view',
			description: "View and list tickets",
			options: [{
				name: 'ticket',
				description: "A specific ticket to view",
				type: 3,
				required: false
			}],
			usage: [
				'- View all tickets in the server',
				'[ticket] - View info for a specific ticket'
			],
			permissions: ['ManageChannels'],
			ephemeral: true,
			v2: true
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var hid = ctx.options.getString('ticket')?.toLowerCase().trim();
		var tickets = await ctx.client.stores.tickets.getAll(ctx.guild.id);
		if(!tickets?.length) return "No tickets to view.";
		if(hid) tickets = tickets.filter(t => t.hid == hid);
		if(!tickets[0]) return "Ticket not found.";

		var embeds = [];
		for(var t of tickets) {
			embeds.push({components: t.genEmbed()})
		}
		
		return embeds;
	}
}

module.exports = (bot, stores) => new Command(bot, stores);