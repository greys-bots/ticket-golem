module.exports = {
	help: ()=> "Edits a ticket's description.",
	usage: ()=> [" <hid> [new description] - Changes a ticket's description. If no hid is given, edits the current channel's ticket."],
	desc: ()=> "The description's length must be 1024 characters or less.\nAlso, tickets can only be edited by a moderator or the ticket opener, unless the command has been set to mod-only using `tg!config modonly`.",
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		var description = args.join(" ");
		var ticket = await bot.utils.getTicketByChannel(bot, msg.guild.id, msg.channel.id);
		if(!ticket) {
			ticket = await bot.utils.getTicket(bot, msg.guild.id, args[0].toLowerCase());
			name = args.slice(1).join("-");
		}
		
		if(!ticket) return msg.channel.createMessage("Please provide a valid ticket hid or use this command in a ticket channel.");
		if((cfg.mod_only && cfg.mod_only.includes("description") && !msg.member.hasPermission("manageMessages")) || 
		   (!msg.member.hasPermission("manageMessages") && msg.author.id != ticket.opener.id)) return msg.channel.createMessage("You do not have permission to edit this ticket.");

		if(description.length > 1024) return msg.channel.createMessage(`That description is too long. The description must be 1024 characters or less.`)
		
		var scc = await bot.utils.editTicket(bot, msg.guild.id, ticket.hid, "description", description);
		if(!scc) return msg.channel.createMessage("Something went wrong.");

		try {
			await bot.editChannel(ticket.channel_id, {topic: description});
		} catch(e) {
			console.log(e);
			msg.channel.createMesasge("Couldn't change the channel topic.");
		}

		try {
			var message = await bot.getMessage(ticket.channel_id, ticket.first_message);
			message.embeds[0].description = description;
			await bot.editMessage(ticket.channel_id, ticket.first_message, {embed: message.embeds[0]});
		} catch(e) {
			console.log(e);
			msg.channel.createMessage("Couldn't edit the ticket's first message.")
		}

		msg.channel.createMessage("Ticket updated.");
	},
	alias: ["desc"]
}