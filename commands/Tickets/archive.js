const {MessageAttachment, MessageEmbed} = require('discord.js');

module.exports = {
	help: ()=> "Archive a ticket.",
	usage: ()=> [" - Sends the user a text transcript of the channel's ticket and deletes the channel.",
				 " [hid] - Sends the user a text transcript of the ticket with the given hid and deletes its channel."],
	desc: ()=> "This command does NOT save images. Please save images yourself before using the command!",
	execute: async (bot, msg, args) => {
		var config = await bot.stores.configs.get(msg.guild.id);
		
		var ticket;
		if(args[0]) ticket = await bot.stores.tickets.get(msg.guild.id, args[0].toLowerCase());
		else ticket = await bot.stores.tickets.getByChannel(msg.guild.id, msg.channel.id);
		if(!ticket) return "Please provide a valid ticket hid or use this command in a ticket channel.";

		try {
			var channel = await msg.guild.channels.fetch(ticket.channel_id);
		} catch(e) {
			return "Couldn't find the channel associated with that ticket.";	
		}

		await bot.handlers.ticket.archive({
			bot,
			ticket,
			channel,
			cfg: config,
			user: msg.author
		})
	},
	permissions: ['MANAGE_CHANNELS'],
	alias: ["a","arch"],
	guildOnly: true
}