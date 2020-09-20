module.exports = {
	help: ()=> "A bit about me.",
	usage: ()=> [" - Sends an about message."],
	execute: async (bot, msg, args) => {
		return {embed: {
			title: "About Me",
			description: "Hello. I'm the ticket golem. I help handle support tickets"+
						 " so you don't have to."+
						 "\nMy prefix is `tg!`."+
						 "\nHere's some more about me:",
			fields: [
				{name: "Creators", value: "[greysdawn](https://github.com/greysdawn) | GreySkies#9950"},
				{name: "Support Server", value: "[Click here.](https://discord.gg/EvDmXGt)", inline: true},
				{name: "GitHub Repo", value: "[Click here.](https://github.com/greys-bots/ticket-golem)", inline: true},
				{name: "Stats", value: `Guilds: ${bot.guilds.size} | Users: ${bot.users.size}`},
				{name: "Want to support my creators?", value: "[Patreon](https://patreon.com/greysdawn) | [Ko-Fi](https://ko-fi.com/greysdawn)"}
			]

		}}
	},
	alias: ["abt"]
}