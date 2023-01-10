const { confButtons } = require('../../extras');
const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'close',
			description: "Close a ticket",
			options: [{
				name: 'ticket',
				description: "The ticket to close",
				type: 3,
				required: false
			}],
			usage: [
				'- Closes the ticket associated with the current channel',
				"[ticket] - Closes another ticket"
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

		var check = await ctx.client.utils.checkTicketPerms({
			msg: ctx,
			ticket,
			user: ctx.user,
			cfg,
			action: 'close'
		})
		if(!check) return "You do not have permission to edit this ticket.";

		var message = await ctx.reply({
			content: "Are you sure you want to close this ticket?\nNOTE: This will remove the ability to send messages; " +
					 "users involved will still see the ticket.",
			components: [{
				type: 1,
				components: confButtons
			}],
			fetchReply: true
		})

		var conf = await ctx.client.utils.getConfirmation(ctx.client, message, ctx.user);
		if(conf.msg) {
			if(!conf.interaction) return conf.msg;
			await conf.interaction.reply(conf.msg);
			return;
		}

		var channel;
		try {
			if(ctx.channel.id == ticket.channel_id) channel = ctx.channel;
			else channel = await ctx.guild.channels.fetch(ticket.channel_id);
			
			ticket.closed = true;
			await ticket.save();
			
			for(var u of ticket.users) {
				await channel.permissionOverwrites.edit(u.id, {
					'SEND_MESSAGES': false
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

		if(!conf.interaction) return "Ticket closed.";
		await conf.interaction.reply("Ticket closed.");
		return;
	}
}

module.exports = (bot, stores) => new Command(bot, stores);