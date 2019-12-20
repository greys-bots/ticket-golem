module.exports = {
	help: ()=> "Renames a ticket.",
	usage: ()=> [" <hid> [new name] - Changes a ticket's name. If no hid is given, renames the current channel's ticket."],
	desc: ()=> "The name's length must total 100 characters or less altogether. Keep in mind that the ticket's hid (usually 4 characters) and one separator are factored into this count.\nAlso, tickets can only be edited by a moderator or the ticket opener, unless the command has been set to mod-only using `tg!config modonly`.",
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		var name = args.join("-");
		var ticket = await bot.utils.getTicketByChannel(bot, msg.guild.id, msg.channel.id);
		if(!ticket) {
			ticket = await bot.utils.getTicket(bot, msg.guild.id, args[0].toLowerCase());
			name = args.slice(1).join("-");
		}

		if(!ticket) return msg.channel.createMessage("Please provide a valid ticket hid or use this command in a ticket channel.");
		if((cfg.mod_only && cfg.mod_only.includes("rename") && !msg.member.hasPermission("manageMessages")) || 
		   (!msg.member.hasPermission("manageMessages") && msg.author.id != ticket.opener.id)) return msg.channel.createMessage("You do not have permission to edit this ticket.");

		if(name.length > (100 - (ticket.hid + 1))) return msg.channel.createMessage(`That name is too long. The name must be ${(100 - (ticket.hid + 1))} characters or less.`)
		
		var scc = await bot.utils.editTicket(bot, msg.guild.id, ticket.hid, "name", name);
		if(!scc) return msg.channel.createMessage("Something went wrong.");

		try {
			await bot.editChannel(ticket.channel_id, {name: `${ticket.hid}-${name}`});
		} catch(e) {
			console.log(e);
			msg.channel.createMesasge("Couldn't change the channel name.");
		}

		try {
			var message = await bot.getMessage(ticket.channel_id, ticket.first_message);
			message.embeds[0].title = name;
			await bot.editMessage(ticket.channel_id, ticket.first_message, {embed: message.embeds[0]});
		} catch(e) {
			console.log(e);
			msg.channel.createMessage("Couldn't edit the ticket's first message.")
		}

		msg.channel.createMessage("Ticket updated.");
	},
	alias: ["rn"]
}