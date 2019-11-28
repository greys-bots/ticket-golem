module.exports = {
	help: ()=> "Delete a ticket",
	usage: ()=> [" - Deletes the current channel's ticket and associated channel",
				 " [hid] - Deletes the given ticket and its associated channel"],
	execute: async (bot, msg, args) => {
		var ticket = args[0] ? await bot.utils.getTicket(bot, msg.guild.id, args[0].toLowerCase()) : await bot.utils.getTicketByChannel(bot, msg.guild.id, msg.channel.id);
		if(!ticket) return msg.channel.createMessage("Please provide a valid ticket hid or use this command in a ticket channel");

		var channel = msg.guild.channels.find(c => c.id == ticket.channel_id);
		if(!channel) return msg.channel.createMessage("Couldn't find the channel associated with that ticket");

		try {
			channel.delete("Ticket deleted");
		} catch(e) {
			console.log(e);
			return msg.channel.createMessage("Error while deleting channel:\n"+e.message)
		}

		var c = await bot.getDMChannel(msg.author.id);
		if(!c) return msg.channel.createMessage("Please make sure I can DM you");

		var scc = await bot.utils.deleteTicket(bot, msg.guild.id, channel.id);
		if(scc) {
			channel.id == msg.channel.id ? c.createMessage("Ticket successfully deleted!") : msg.channel.createMessage("Ticket successfully deleted!")
		} else {
			channel.id == msg.channel.id ? c.createMessage("Channel deleted, but the ticket could not be deleted from the database") : msg.channel.createMessage("Channel deleted, but the ticket could not be deleted from the database")
		}
	},
	permissions: ['manageMessages'],
	alias: ["del","d"],
	guildOnly: true
}