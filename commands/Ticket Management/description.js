module.exports = {
	help: ()=> "Edits a ticket's description.",
	usage: ()=> [" <hid> [new description] - Changes a ticket's description. If no hid is given, edits the current channel's ticket."],
	desc: ()=> "The description's length must be 1024 characters or less.\nAlso, tickets can only be edited by a moderator or the ticket opener, unless the command has been set to mod-only using `tg!config modonly`.",
	execute: async (bot, msg, args) => {
		var cfg = await bot.stores.configs.get(msg.guild.id);
		var description = args.join(" ");
		var ticket;
		if(args[0]) ticket = await bot.stores.tickets.get(msg.guild.id, args[0].toLowerCase());
		if(ticket) description = args.slice(1).join(" ");
		else ticket = await bot.stores.tickets.getByChannel(msg.guild.id, msg.channel.id);
		
		if(!ticket) return "Please provide a valid ticket hid or use this command in a ticket channel.";
		if((cfg.mod_only?.includes('description') && !msg.member.permissions.has("MANAGE_CHANNELS")) ||
			(msg.author.id != ticket.opener.id) && !msg.member.permissions.has("MANAGE_CHANNELS"))
				return "You do not have permission to edit this ticket.";

		if(description.length > 1024) return `That description is too long. The description must be 1024 characters or less.`;
		
		try {
			await bot.stores.tickets.update(msg.guild.id, ticket.hid, {description});
			var channel = await bot.channels.fetch(ticket.channel_id);
			await channel.edit({topic: description});
			var message = await channel.messages.fetch(ticket.first_message);
			message.embeds[0].description = description;
			await message.edit({embed: message.embeds[0]});
		} catch(e) {
			return "Error:\n" + (e.message || e);
		}
		
		return "Ticket updated.";
	},
	alias: ["desc"]
}