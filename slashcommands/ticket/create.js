const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'create',
			description: "Create a new ticket",
			options: [
				{
					name: 'name',
					description: "The name/title of the ticket",
					type: 3,
					required: false
				},
				{
					name: 'description',
					description: "The description of the ticket",
					type: 3,
					required: false
				}
			],
			usage: [
				'<name> <description> - Create a new ticket with an optional name and description'
			],
			ephemeral: true
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var name = ctx.options.getString('name')?.trim();
		var description = ctx.options.getString('description')?.trim();
		console.log(name, description)

		var cfg = await this.#bot.stores.configs.get(ctx.guild.id);
		if(!cfg) return "That server is missing a ticket category setup. Please alert the mods.";

		var open = (await this.#bot.stores.tickets.getByUser(ctx.guild.id, ctx.user.id));
		if(open?.length >= cfg.ticket_limit) return `You already have ${open.length} ticket(s) open in that server. The current limit is ${cfg.ticket_limit}.`;

		var result = await this.#bot.handlers.ticket.createTicket({msg: ctx, user: ctx.user, cfg, name, description})
		return {
			embeds: [{
				title: "Ticket opened",
				description: `ID: ${result.code}\nChannel: ${result.channel}`
			}],
			ephemeral: true
		}
	}
}

module.exports = (bot, stores) => new Command(bot, stores);