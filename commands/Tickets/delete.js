module.exports = {
	help: ()=> "Delete a ticket.",
	usage: ()=> [
		" - Deletes the current channel's ticket and associated channel.",
		" [hid] - Deletes the given ticket and its associated channel."
	],
	execute: async (bot, msg, args) => {
		var ticket;
		if(args[0]) ticket = await bot.stores.tickets.get(msg.guild.id, args[0].toLowerCase());
		else ticket = await bot.stores.tickets.getByChannel(msg.guild.id, msg.channel.id);
		if(!ticket) return "Please provide a valid ticket hid or use this command in a ticket channel.";

		var channel = await msg.guild.channels.fetch(ticket.channel_id);
		if(!channel) return "Couldn't find the channel associated with that ticket.";

		try {
			await channel.delete("Ticket deleted.");
			await bot.stores.tickets.delete(msg.guild.id, ticket.hid);

			if(channel.id == msg.channel.id) await msg.author.send("Ticket deleted.");
			else await msg.channel.send("Ticket deleted.");
		} catch(e) {
			console.log(e);
			return "Error:\n" + (e.message || e);
		}

		return;
	},
	permissions: ['MANAGE_CHANNELS'],
	alias: ["del","d"],
	guildOnly: true
}