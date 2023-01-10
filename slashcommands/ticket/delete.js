const { delButtons } = require('../../extras');
const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'delete',
			description: "Deletes a ticket",
			options: [{
				name: 'ticket',
				description: "The ticket ID to delete",
				type: 3,
				required: false
			}],
			usage: [
				'- Deletes ticket associated with the current channel',
				'[ticket] - Deletes a specific ticket'
			],
			extra: "This command does NOT archive the ticket. It simply deletes the entire channel.",
			permissions: ['ManageChannels']
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var hid = ctx.options.getString('ticket')?.toLowerCase().trim();

		var ticket;
		if(hid) ticket = await ctx.client.stores.tickets.get(ctx.guild.id, hid);
		else ticket = await ctx.client.stores.tickets.getByChannel(ctx.guild.id, ctx.channel.id);
		if(!ticket) return "Ticket not found.";

		var message = await ctx.reply({
			content: "Are you sure you want to delete this ticket? This can't be undone.",
			components: [{
				type: 1,
				components: delButtons
			}],
			fetchReply: true
		})

		var conf = await ctx.client.utils.getConfirmation(ctx.client, message, ctx.user);
		if(conf.msg) {
			if(!conf.interaction) return conf.msg;
			await conf.interaction.reply(conf.msg);
			return;
		}

		try {
			await ctx.channel.delete('Ticket deleted.');
			await ctx.user.send('Ticket deleted.');
		} catch(e) {
			return `Error: ${e.message ?? e}`;
		}

		return;
	}
}

module.exports = (bot, stores) => new Command(bot, stores);