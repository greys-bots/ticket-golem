module.exports = {
	help: ()=> "Add users to a ticket",
	usage: ()=> [" <hid> [user] [user] ... - Add users to a ticket. If no hid is given, adds them to the current channel's ticket."],
	desc: ()=> "Users can be @mentions or user IDs. The default limit to how many users can be added to a ticket via commands is 10 - others will need to be added manually, or the limit will need to be changed. This does not include moderators or the original opener of the ticket.\nThis command can only be used by moderators and the ticket owner, unless the command has been set to mod-only using `tg!config modonly`",
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide users to add to the ticket.");
		var ids;
		var limit;
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(cfg) limit = cfg.user_limit || 10;
		else limit = 10;
		var ticket = await bot.utils.getTicket(bot, msg.guild.id, args[0].toLowerCase());
		if(ticket) ids = args.slice(1).map(id => id.replace(/[<@!>]/g,""));
		else {
			ticket = await bot.utils.getTicketByChannel(bot, msg.guild.id, msg.channel.id);
			ids = args.map(id => id.replace(/[<@!>]/g,""))
		}
		if(!ticket) return msg.channel.createMessage("Please provide a valid ticket hid or use this command in a ticket channel.");
		if((cfg.mod_only && cfg.mod_only.includes("add") && !msg.member.hasPermission("manageMessages")) || 
		   (!msg.member.hasPermission("manageMessages") && msg.author.id != ticket.opener.id)) return msg.channel.createMessage("You do not have permission to edit this ticket.");

		if(limit > -1 && (ids.length > limit || (ids.length + ticket.users.length-1) > limit)) return msg.channel.createMessage(`${limit > -1 ? "Only up to "+limit : "No"} users can be added to tickets via this command.`);
		ids = ticket.users.map(u => u.id).concat(ids.filter(id => !ticket.users.includes(id)));

		var members = msg.guild.members.filter(m => ids.includes(m.id));
		if(!members || !members[0]) return msg.channel.createMessage("Please provide valid members to add to the ticket.");

		var channel = msg.guild.channels.find(c => c.id == ticket.channel_id);
		if(!channel) return msg.channel.createMessage("ERR: Couldn't get the channel associated with that ticket.");

		try {
			for(var i = 0; i < members.length; i++) {
				await channel.editPermission(members[i].id, 1024, 0, "member");
			}
		} catch(e) {
			console.log(e);
			return msg.channel.createMessage("ERR:\n"+e.message);
		}

		var message = await msg.channel.getMessage(ticket.first_message);
		if(!message) msg.channel.createMessage("Couldn't get the ticket's first message; users have been added, but won't be reflected there.")
		else {
			try {
				await message.edit({embed: {
					title: ticket.name,
					description: ticket.description,
					fields: [
						{name: "Ticket Opener", value: message.embeds[0].fields[0].value},
						{name: "Ticket Users", value: members.length > 20 ? members.slice(0, 21).map(m => m.mention).join("\n") + `\nAnd ${members.length - 20} more...` : members.map(m => m.mention).join("\n")}
					],
					color: 2074412,
					footer: {
						text: "Ticket ID: "+ticket.hid
					},
					timestamp: ticket.timestamp
				}})
			} catch(e) {
				console.log(e);
				msg.channel.createMessage("Couldn't edit ticket message; users have been added, but won't be reflected there.");
			}
		}

		var scc = await bot.utils.editTicket(bot, msg.guild.id, ticket.hid, "users", members.map(m => m.id));
		if(scc) msg.channel.createMessage("Users have been added to ticket.");
		else msg.channel.createMessage("Users have been added to the ticket, but this data could not be saved to the database.");

	},
	alias: ["a","+"],
	guildOnly: true
}