module.exports = {
	data: {
		name: "about",
		description: "Info about the bot"
	},
	usage: [
		"- Gives info about the bot"
	],
	async execute(ctx) {
		return {embeds: [{
			title: "About Me",
			description: "Hello. I'm the ticket golem. I help handle support tickets"+
						 " so you don't have to."+
						 "\nMy prefix is `tg!`."+
						 "\nHere's some more about me:",
			fields: [
				{name: "Creators", value: "[greysdawn](https://github.com/greysdawn) | GreySkies#9950"},
				{name: "Support Server", value: "[Click here.](https://discord.gg/EvDmXGt)", inline: true},
				{name: "GitHub Repo", value: "[Click here.](https://github.com/greys-bots/ticket-golem)", inline: true},
				{name: "Stats", value: `Guilds: ${ctx.client.guilds.cache.size} | Users: ${ctx.client.users.cache.size}`},
				{name: "Want to support my creators?", value: "[Patreon](https://patreon.com/greysdawn) | [Ko-Fi](https://ko-fi.com/greysdawn)"}
			]
		}]}
	},
	ephemeral: true
}