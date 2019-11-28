module.exports = {
	help: ()=> "Invite me to your server.",
	usage: ()=> [" - Gives you a link to invite me in."],
	execute: async (bot, msg, args) => {
		await msg.channel.createMessage([
			`You can use this link to invite me: ${bot.invlink}\n`,
			"Please note that in addition to this link's permissions, ",
			"I also need to have the ability to `Manage Permissions`added to ",
			"the category you intend to use for tickets."
		].join(""))
	},
	alias: ["inv", "link", "i", "l"]
}