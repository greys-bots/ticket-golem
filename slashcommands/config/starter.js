const {
	clearButtons,
	starterVars: KEYS
} = require('../../extras');
const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'starter',
			description: "View and change the ticket starter message",
			options: [{
				name: 'message',
				description: "The new message to send when a ticket is opened",
				type: 3,
				required: false
			}],
			usage: [
				'- View and optionally clear the current message',
				' [message] - Set a new ticket starter message'
			],
			extra: `Available variables:\n${Object.keys(KEYS).map(k => `${k} - ${KEYS[k]}.desc`).join("\n")}`,
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var message = ctx.options.getString('message')?.trim();
		var cfg = await ctx.client.stores.configs.get(ctx.guild.id);

		if(message) {
			cfg.starter = message;
			await cfg.save();

			return "Config updated.";
		}

		if(!cfg?.starter) return "No custom starter message set.";

		var data = {
			embeds: [{
				title: "Current message",
				description: cfg.starter
			}],
			components: [{ type: 1, components: clearButtons }]
		}

		var reply = await ctx.reply({...data, fetchReply: true});
		var conf = await ctx.client.utils.getConfirmation(ctx.client, reply, ctx.user);
		var msg;
		if(conf.msg) {
			msg = conf.msg;
		} else {
			await ctx.client.stores.configs.update(ctx.guild.id, {starter: undefined});
			msg = 'Config cleared.';
		}

		if(conf.interaction) {
			await conf.interaction.update({
				content: msg,
				embeds: [],
				components: [{
					type: 1,
					components: clearButtons.map(b => {
						b.disabled = true;
						return b;
					})
				}]
			})
		} else {
			await ctx.editReply({
				content: msg,
				embeds: [],
				components: [{
					type: 1,
					components: clearButtons.map(b => {
						b.disabled = true;
						return b;
					})
				}]
			})
		}
		return;
	}
}

module.exports = (bot, stores) => new Command(bot, stores);