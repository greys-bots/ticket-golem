const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: "invite",
			description: "Receive a server invite",
			usage: [
				"- Gives an invite for the bot"	
			],
			ephemeral: true
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		return `You can invite me with this:\n${process.env.INVITE}`;
	}
}

module.exports = (bot, stores) => new Command(bot, stores);