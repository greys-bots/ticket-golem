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
		if(!ticket) return"Please provide a valid ticket hid or use this command in a ticket channel.";

		var channel = msg.guild.channels.resolve(ticket.channel_id);
		if(!channel) return "Couldn't find the channel associated with that ticket";

		var messages = await channel.messages.fetch({limit: 100});
		if(!messages) return "Either that channel has no messages, or I couldn't get them.";
		console.log(messages.first().id, messages.last().id, ticket.first_message);
		while(messages.last().id != ticket.first_message) {
			console.log('fetching more...')
			var extra = await channel.messages.fetch({limit: 100, before: messages.last().id});
			console.log(extra.first().id, extra.last().id, ticket.first_message);
			messages = messages.concat(extra);
		}

		var data = [];
		messages.forEach(m => {
			var date = m.createdAt;
			data.push([`ID: ${m.id}`,
						`\r\n${m.author.username}#${m.author.discriminator + (m.author.bot ? " BOT" : "")} (${m.author.id})`,
						` | ${('00' + (date.getMonth() + 1)).slice(-2)}.${('00' + date.getDate()).slice(-2)}.${date.getFullYear()}`,
						` at ${('00' + date.getHours()).slice(-2)}:${('00' + date.getMinutes()).slice(-2)}`,
						`\r\n${m.content}`].join(""))
		})

		var c;
		if(!config?.archives_id) {
			try {
				await msg.author.send({content: "Here is the archive:", file: Buffer.from([`Ticket opened: ${bot.formatTime(new Date(ticket.timestamp))}\r\n`,
				`Ticket opener: ${ticket.opener.username}#${ticket.opener.discriminator} (${ticket.opener.id})\r\n`,
				 `Users involved:\r\n${ticket.users.map(u => `${u.username}#${u.discriminator} (${u.id})`).join("\r\n")}`,"\r\n------\r\n"].join("")+data.reverse().join("\r\n------\r\n")),name: channel.name+".txt"})
			} catch(e) {
				console.log(e);
				return "Error while DMing the archive:\n"+e.message+"\n\nAction aborted due to error";
			}
			return;
		}

		c = msg.guild.channels.resolve(config.archives_id);
		if(!c) return "Couldn't find your archives channel; please reconfigure it.";

		var date = new Date();

		var embed = new MessageEmbed({
			title: "Ticket Archive",
			fields: [
				{name: "Ticket name", value: ticket.name || "Untitled Ticket"},
				{name: "Ticket description", value: ticket.description || "(no description)"},
				{name: "Time opened", value: bot.formatTime(new Date(ticket.timestamp))},
				{name: "Opener", value: `${ticket.opener.username}#${ticket.opener.discriminator} (${ticket.opener.id})`},
				{name: "Users involved", value: ticket.users.map(u => `${u.username}#${u.discriminator} (${u.id})`).join("\n")},
				{name: "Time closed", value: bot.formatTime(date)}
			],
			timestamp: date.toISOString(),
			color: 5821280
		});

		var file = new MessageAttachment(Buffer.from([
			`Ticket name: ${ticket.name || "Untitled Ticket"}\r\n`,
			`Ticket description: ${ticket.description || "(no description)"}\r\n`,
			`Ticket opened: ${bot.formatTime(new Date(ticket.timestamp))}\r\n`,
			`Ticket opener: ${ticket.opener.username}#${ticket.opener.discriminator} (${ticket.opener.id})\r\n`,
			`Users involved:\r\n${ticket.users.map(u => `${u.username}#${u.discriminator} (${u.id})`).join("\r\n")}`,"\r\n------\r\n"].join("")+data.reverse().join("\r\n------\r\n")
		), channel.name+".txt")

		try {
			await c.send({embeds: [embed], files: [file]});
			await channel.delete("Ticket archived.");
			await bot.stores.tickets.delete(msg.guild.id, ticket.hid);
		} catch(e) {
			console.log(e);
			await msg.author.send("Error during operation:\n"+(e.message || e));
		}

		return;
	},
	permissions: ['MANAGE_CHANNELS'],
	alias: ["a","arch"],
	guildOnly: true
}