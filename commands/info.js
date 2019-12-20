module.exports = {
	help: ()=> "Get info on a ticket.",
	usage: ()=> [" [hid] - Gets info on the given ticket."],
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide a ticket hid.");
		var ticket = await bot.utils.getTicket(bot, msg.guild.id, args[0].toLowerCase());
		if(!ticket) return msg.channel.createMessage("Ticket not found. Keep in mind that tickets archived with `tg!archive` are removed from the database.");

		msg.channel.createMessage({embed: {
			title: ticket.name,
			description: ticket.description,
			color: ticket.closed ? parseInt("aa5555", 16) : parseInt("55aa55", 16),
			fields: [
				{name: "Ticket Opener", value: ticket.opener.mention},
				{name: "Ticket Users", value: ticket.users.map(u => u.mention).join("\n")}
			],
			footer: {
				text: `ID: ${ticket.hid}${ticket.closed ? " | This ticket has been closed." : ""}`
			},
			timestamp: ticket.timestamp
		}})
	},
	guildOnly: true,
	permissions: ["manageMessages"]
}