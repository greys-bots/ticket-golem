const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'find',
			description: "Find tickets matching specific criteria",
			options: [
				{
					name: 'from',
					description: "A user to see tickets from",
					type: 6,
					required: false
				},
				{
					name: 'search',
					description: "A term to search for",
					type: 3,
					required: false
				},
				{
					name: 'status',
					description: "A status to search with, ie. open/closed",
					type: 3,
					required: false,
					choices: [
						{
							name: 'open',
							value: 'open'
						},
						{
							name: 'closed',
							value: 'closed'
						}
					]
				}
			],
			usage: [
				"[from] - View all tickets opened by the given user",
				"[search] - View tickets matching the given search term",
				"[status: open] - Find open tickets",
				"[status: closed] - Find closed tickets",
				"(a mix of above) - Find tickets matching all criteria"
			],
			extra: "Search terms look through the ticket's name and description, NOT messages sent within them.",
			permissions: ["ManageChannels"],
			v2: true
		})
		this.#bot = bot;
		this.#stores = stores;
	}
	
	async execute(ctx) {
		var from = ctx.options.getUser('from');
		var search = ctx.options.getString('search')?.toLowerCase().trim();
		var status = ctx.options.getString('status');
		if(!status && !from && !search) return "Must provide a query.";

		var tickets = await ctx.client.stores.tickets.search(ctx.guild.id, {
			opener: from?.id,
			text: search,
			status
		});
		if(!tickets?.length) return "Nothing found matching that query.";

		var embeds = [];
		for(var t of tickets) {
			embeds.push({components: t.genEmbed()})
		}
		
		return embeds;
	}
}

module.exports = (bot, stores) => new Command(bot, stores);