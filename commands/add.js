module.exports = {
	help: ()=> "Add users to a ticket",
	usage: ()=> [" [user] [user] ... - Add users to the ticket attached to the current channel",
				 " [hid] [user] [user] ... - Add users to a ticket with the given hid"],
	desc: ()=> "Users can be @mentions or user IDs. Up to 10 users can be added to a ticket via commands - others will need to be added manually. This does not include moderators or the original opener of the ticket.",
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide users to add to the ticket");

		var ids;
		var ticket = await bot.utils.getTicket(bot, msg.guild.id, args[0].toLowerCase());
		if(ticket) ids = args.slice(1).map(id => id.replace(/[<@!>]/g,""));
		else {
			ticket = await bot.utils.getTicketByChannel(bot, msg.guild.id, msg.channel.id);
			ids = args.map(id => id.replace(/[<@!>]/g,""))
		}
		if(!ticket) return msg.channel.createMessage("Please provide a valid ticket hid or use this command in a ticket channel");

		if(ids.length > 10 || (ids.length + ticket.users.length-1) > 10) return msg.channel.createMessage("Only to 10 users can be added to tickets via the command.");
		ids = ticket.users.map(u => u.id).concat(ids.filter(id => !ticket.users.includes(id)));

		var members = msg.guild.members.filter(m => ids.includes(m.id));
		if(!members || !members[0]) return msg.channel.createMessage("Please provide valid members to add to the ticket");

		var channel = msg.guild.channels.find(c => c.id == ticket.channel_id);
		if(!channel) return msg.channel.createMessage("ERR: Couldn't get the channel associated with that ticket");

		try {
			await Promise.all(members.map(m => {
				return channel.editPermission(m.id, 1024, 0, "member");
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
						{name: "Ticket Users", value: members.map(m => m.mention).join("\n")}
					],
					color: 2074412,
					footer: {
						text: "Ticket ID: "+ticket.hid
					},
					timestamp: ticket.timestamp
				}})
			} catch(e) {
				console.log(e);
				msg.channel.createMessage("Couldn't edit ticket message; users have been added, but won't be reflected there");
			}
		}

		var scc = await bot.utils.editTicket(bot, msg.guild.id, ticket.hid, "users", members.map(m => m.id));
		if(scc) msg.channel.createMessage("Users added to ticket!");
		else msg.channel.createMessage("Users added to channel, but could not be saved to the ticket");

	},
	permissions: ['manageMessages'],
	alias: ["a","+"],
	guildOnly: true
}