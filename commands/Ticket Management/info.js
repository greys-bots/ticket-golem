module.exports = {
	help: ()=> "Get info on a ticket.",
	usage: ()=> [" [hid] - Gets info on the given ticket."],
	execute: async (bot, msg, args) => {
		if(!args[0]) return "Please provide a ticket hid.";
		var ticket = await bot.stores.tickets.get(msg.guild.id, args[0].toLowerCase());
		if(!ticket) return "Ticket not found. Keep in mind that tickets archived with " +
						   "`tg!archive` or deleted with `tg!delete` are removed from the database.";

		return {embed: {
			title: ticket.name,
			description: ticket.description,
			color: ticket.closed ? parseInt("aa5555", 16) : parseInt("55aa55", 16),
			fields: [
				{name: "Ticket Opener", value: `${ticket.opener}`},
				{name: "Ticket Users", value: ticket.users.map(u => `${u}`).join("\n")}
			],
			footer: {
				text: `ID: ${ticket.hid}${ticket.closed ? " | This ticket has been closed." : ""}`
			},
			timestamp: ticket.timestamp
		}};
	},
	guildOnly: true,
	permissions: ["MANAGE_MESSAGES"]
}