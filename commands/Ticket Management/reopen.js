module.exports = {
	help: ()=> "Re-open a closed ticket.",
	usage: ()=> [" <hid> - Re-opens a ticket. If no hid is given, opens the current channel's ticket."],
	desc: ()=> "This command can only be used by moderators and the ticket owner, unless the command has been set to mod-only using `tg!config modonly`",
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		var ticket = await bot.utils.getTicketByChannel(bot, msg.guild.id, msg.channel.id);
		if(!ticket) ticket = await bot.utils.getTicket(bot, msg.guild.id, args[0].toLowerCase());
		if(!ticket) return msg.channel.createMessage("Please provide a valid ticket hid or use this command in a ticket channel.");
		if(!ticket.closed) return msg.channel.createMessage("This ticket is already open.");

		if((cfg.mod_only && cfg.mod_only.includes("reopen") && !msg.member.hasPermission("manageMessages")) || 
		   (!msg.member.hasPermission("manageMessages") && msg.author.id != ticket.opener.id)) return msg.channel.createMessage("You do not have permission to close this ticket.");

		var message;
		try {
			message = await bot.getMessage(ticket.channel_id, ticket.first_message);
		} catch(e) {
			console.log(e);
			msg.channel.createMessage("Couldn't get the ticket's first message; any changes won't be reflected there.");
		}

		if(message) {
			var embed = message.embeds[0];
			if(!embed) embed = {
				title: ticket.name,
				description: ticket.description,
				fields: [
					{name: "Ticket Opener", value: `${ticket.opener.mention}`},
					{name: "TIcket Users", value: ticket.users.map(u => u.mention).join("\n")},
				],
				color: 2074412,
				footer: {
					text: "Ticket ID: "+ticket.hid
				},
				timestamp: ticket.timestamp
			}

			embed.color = parseInt("55aa55", 16);
			embed.title = ticket.name;
			embed.footer = {text: `Ticket ID: ${ticket.hid}`}
			message.edit({embed: embed});
		}

		try {
			for(var i = 0; i < ticket.users.length; i++) {
				await msg.channel.editPermission(ticket.users[i].id, 1024, 0, "member");
			}
		} catch(e) {
			console.log(e);
			msg.channel.createMessage("Couldn't edit overrides for at least one user on the ticket. The ticket is closed, but can still be seen by some users.");
		}
		
		var scc = await bot.utils.editTicket(bot, msg.channel.guild.id, ticket.hid, "closed", false);
		if(scc) msg.channel.createMessage("The ticket has been re-opened.");
		else msg.channel.createMessage("The ticket has been closed; however, this could not be saved to the database. This ticket may not count towards the opener's open tickets.");
	},
	alias: ["open"],
	guildOnly: true
}