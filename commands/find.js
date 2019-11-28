module.exports = {
	help: ()=> "Find tickets opened by a specific user",
	usage: ()=> [" [user] - Find tickets from the given user"],
	desc: ()=> "User can be a @mention or ID. Does not include past tickets, as those are fully deleted from the database",
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide a user to search for tickets from");

		var tickets = await bot.utils.getTicketsByUser(bot, msg.guild.id, args[0].replace(/[<@!>]/g,""));

		if(!tickets) return msg.channel.createMessage("No tickets from that user found");

		msg.channel.createMessage({embed: {
			title: "Tickets Found",
			description: tickets.map(t => `ID: ${t.hid} | Opened: ${bot.formatTime(new Date(t.timestamp))}`).join("\n")
		}})
	},
	alias: ["search","s","f"],
	guildOnly: true,
	permissions: ["manageMessages"]
}