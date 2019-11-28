module.exports = {
	help: ()=> "Remove users from a ticket",
	usage: ()=> [" [user] [user] ... - Remove users from the ticket attached to the current channel",
				 " [hid] [user] [user] ... - Remove users from a ticket with the given hid"],
	desc: ()=> "Users can be @mentions or user IDs. You cannot remove the ticket opener from the ticket via commands.",
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide users to remove from the ticket");

		var ids;
		var ticket = await bot.utils.getTicket(bot, msg.guild.id, args[0].toLowerCase());
		if(ticket) ids = args.slice(1).map(id => id.replace(/[<@!>]/g,""));
		else {
			ticket = await bot.utils.getTicketByChannel(bot, msg.guild.id, msg.channel.id);
			ids = args.map(id => id.replace(/[<@!>]/g,""))
		}
		if(!ticket) return msg.channel.createMessage("Please provide a valid ticket hid or use this command in a ticket channel");

		ids = ids.filter(id => ticket.userids.includes(id) && id != ticket.opener.id);

		var members = msg.guild.members.filter(m => ids.includes(m.id));
		if(!members || !members[0]) return msg.channel.createMessage("Please provide valid members to add to the ticket");

		var channel = msg.guild.channels.find(c => c.id == ticket.channel_id);
		if(!channel) return msg.channel.createMessage("ERR: Couldn't get the channel associated with that ticket");

		try {
			await Promise.all(members.map(m => {
				return channel.editPermission(m.id, 0, 1024, "member");
			}))
		} catch(e) {
			console.log(e);
			return msg.channel.createMessage("ERR:\n"+e.message);
		}

		var message = await msg.channel.getMessage(ticket.first_message);
		if(!message) msg.channel.createMessage("Couldn't get the ticket's first message; users have been added, but won't be shown there")
		else {
			try {
				await message.edit({embed: {
					title: "Ticket opened!",
					fields: [
						{name: "Ticket Opener", value: message.embeds[0].fields[0].value},
						{name: "Ticket Users", value: message.embeds[0].fields[1].value.split("\n").filter(m => !ids.includes(m.replace(/[<@!>]/g,""))).join("\n")}
					],
					color: 2074412,
					footer: {
						text: "Ticket ID: "+ticket.hid
					},
					timestamp: ticket.timestamp
				}})
			} catch(e) {
				console.log(e);
				msg.channel.createMessage("Couldn't edit ticket message; users have been removed, but won't be reflected there");
			}
		}

		var scc = await bot.utils.editTicket(bot, msg.guild.id, ticket.hid, "users", ticket.userids.filter(u => !ids.includes(u)));
		if(scc) msg.channel.createMessage("Users removed from ticket!");
		else msg.channel.createMessage("Users removed from channel, but could not be saved to the ticket");

	},
	permissions: ['manageMessages'],
	guildOnly: true,
	alias: ["r","rmv","-"]
}