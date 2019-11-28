module.exports = {
	help: ()=> "Archive a ticket",
	usage: ()=> [" - Sends the user a text transcript of the channel's ticket and deletes the channel",
				 " [hid] - Sends the user a text transcript of the ticket with the given hid and deletes its channel"],
	desc: ()=> "This command does NOT save images. Please save images yourself before using the command!",
	execute: async (bot, msg, args) => {
		var config = await bot.utils.getConfig(bot, msg.guild.id);
		if(!config) config = {archives_id: null};
		
		var ticket = args[0] ? await bot.utils.getTicket(bot, msg.guild.id, args[0].toLowerCase()) : await bot.utils.getTicketByChannel(bot, msg.guild.id, msg.channel.id);
		if(!ticket) return msg.channel.createMessage("Please provide a valid ticket hid or use this command in a ticket channel");

		var channel = msg.guild.channels.find(c => c.id == ticket.channel_id);
		if(!channel) return msg.channel.createMessage("Couldn't find the channel associated with that ticket");

		var messages = await channel.getMessages(10000, null, ticket.first_message);
		if(!messages) return msg.channel.createMessage("Either that channel has no messages or I couldn't get them");

		var data = [];
		messages.forEach(m => {
			var date = new Date(m.timestamp);
			data.push([`ID: ${m.id}`,
						`\r\n${m.author.username}#${m.author.discriminator + (m.author.bot ? " BOT" : "")} (${m.author.id})`,
						` | ${date.getMonth()+1}.${date.getDate()}.${date.getFullYear()}`,
						` at ${date.getHours()}:${date.getMinutes()}`,
						`\r\n${m.content}`].join(""))
		})

		var c;
		if(config.archives_id) {
			c = msg.guild.channels.find(ch => ch.id == config.archives_id);
			if(!c) return msg.channel.createMessage("Couldn't find your archives channel; please reconfigure it");

			var date = new Date();

			var embed = {
				title: "Ticket Archive",
				fields: [
					{name: "Time opened", value: bot.formatTime(new Date(ticket.timestamp))},
					{name: "Opener", value: `${ticket.opener.username}#${ticket.opener.discriminator} (${ticket.opener.id})`},
					{name: "Users involved", value: ticket.users.map(u => `${u.username}#${u.discriminator} (${u.id})`).join("\n")},
					{name: "Time closed", value: bot.formatTime(date)}
				],
				timestamp: date.toISOString(),
				color: 5821280
			}
			try {
				c.createMessage({embed: embed},{file: Buffer.from([`Ticket opened: ${bot.formatTime(new Date(ticket.timestamp))}\r\n`,
				`Ticket opener: ${ticket.opener.username}#${ticket.opener.discriminator} (${ticket.opener.id})\r\n`,
				 `Users involved:\r\n${ticket.users.map(u => `${u.username}#${u.discriminator} (${u.id})`).join("\r\n")}`,"\r\n------\r\n"].join("")+data.reverse().join("\r\n------\r\n")),name: channel.name+".txt"})
			} catch(e) {
				console.log(e);
				return msg.channel.createMessage("Error while sending the archive:\n"+e.message+"\n\nAction aborted due to error");
			}
		} else {
			c = await bot.getDMChannel(msg.author.id);
			if(!c) return msg.channel.createMessage("Please make sure I can DM you");

			try {
				c.createMessage("Here is the archive:",{file: Buffer.from([`Ticket opened: ${bot.formatTime(new Date(ticket.timestamp))}\r\n`,
				`Ticket opener: ${ticket.opener.username}#${ticket.opener.discriminator} (${ticket.opener.id})\r\n`,
				 `Users involved:\r\n${ticket.users.map(u => `${u.username}#${u.discriminator} (${u.id})`).join("\r\n")}`,"\r\n------\r\n"].join("")+data.reverse().join("\r\n------\r\n")),name: channel.name+".txt"})
			} catch(e) {
				console.log(e);
				return msg.channel.createMessage("Error while DMing the archive:\n"+e.message+"\n\nAction aborted due to error");
			}

		}

		try {
			channel.delete("Ticket archived");
		} catch(e) {
			console.log(e);
			return msg.channel.createMessage("Error while deleting channel:\n"+e.message)
		}

		var scc = await bot.utils.deleteTicket(bot, msg.guild.id, channel.id);
		if(!scc) {
			channel.id == msg.channel.id ? c.createMessage("Ticket archived, but could not be deleted from the database") : msg.channel.createMessage("Ticket archived, but could not be deleted from the database")
		}
	},
	permissions: ['manageMessages'],
	alias: ["a","arch"],
	guildOnly: true
}