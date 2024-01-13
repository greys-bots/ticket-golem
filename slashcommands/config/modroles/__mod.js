const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'modroles',
			description: "Commands for configuring the server's mod roles",
			guildOnly: true,
			permissions: ['ManageMessages', 'ManageRoles'],
			type: 2
		})
		this.#bot = bot;
		this.#stores = stores;
	}
}

module.exports = (bot, stores) => new Command(bot, stores);