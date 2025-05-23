const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: "about",
			description: "Info about the bot",
			usage: [
				"- Gives info about the bot"
			],
			ephemeral: true,
			v2: true
		})

		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		return [{
			components: [{
				type: 17,
				accent_color: 0x8A8A8A,
				components: [
					{
						type: 10,
						content: "-# About"
					},
					{
						type: 14
					},
					{
						type: 10,
						content:
							"# Hello. I'm the ticket golem.\n" +
							"I help handle support tickets so you don't have to.\n" +
							"## Creators\n" +
							"[greysdawn](https://github.com/greysdawn) | @greysdawn\n" +
							"## Stats\n" +
							`**Guilds:** ${this.#bot.guilds.cache.size} | **Users:** ${this.#bot.users.cache.size}`
					},
					{
						type: 14
					},
					{
						type: 9,
						components: [{
							type: 10,
							content: "Invite me"
						}],
						accessory: {
							type: 2,
							style: '5',
							label: 'Invite',
							url: "https://discord.com/oauth2/authorize?client_id=649629984930922506&permissions=1099511942224&scope=bot+applications.commands"
						}
					},
					{
						type: 1,
						components: [
							{
								type: 2,
								style: 5,
								label: "Support server",
								url: "https://discord.gg/EvDmXGt"
							},
							{
								type: 2,
								style: 5,
								label: "Github",
								url: "https://github.com/greys-bots/ticket-golem"
							},
							{
								type: 2,
								style: 5,
								label: "Patreon",
								url: "https://patreon.com/greysdawn"
							},
							{
								type: 2,
								style: 5,
								label: "Ko-Fi",
								url: "https://ko-fi.com/greysdawn"
							}
						]
					}
				]
			}]
		}]
	}
}

module.exports = (bot, stores) => new Command(bot, stores);