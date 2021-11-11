module.exports = {
	help: ()=> "Renames a ticket.",
	usage: ()=> [" <hid> [new name] - Changes a ticket's name. If no hid is given, renames the current channel's ticket."],
	desc: ()=> "The name's length must total 100 characters or less altogether. Keep in mind that the ticket's hid (usually 4 characters) and one separator are factored into this count.\nAlso, tickets can only be edited by a moderator or the ticket opener, unless the command has been set to mod-only using `tg!config modonly`.",
	execute: async (bot, msg, args) => {
		var cfg = await bot.stores.configs.get(msg.guild.id);
		var name = args.join(" ");
		var ticket;
		if(args[0]) ticket = await bot.stores.tickets.get(msg.guild.id, args[0].toLowerCase());
		if(ticket) name = args.slice(1).join("-");
		else ticket = await bot.stores.tickets.getByChannel(msg.guild.id, msg.channel.id);
		
		if(!ticket) return "Please provide a valid ticket hid or use this command in a ticket channel.";
		if((cfg.mod_only?.includes('rename') && !msg.member.permissions.has("MANAGE_CHANNELS")) ||
			(msg.author.id != ticket.opener.id) && !msg.member.permissions.has("MANAGE_CHANNELS"))
				return "You do not have permission to edit this ticket.";

		if(name.length > (100 - (ticket.hid + 1))) return msg.channel.send(`That name is too long. The name must be ${(100 - (ticket.hid + 1))} characters or less.`)
		
		try {
			await bot.stores.tickets.update(msg.guild.id, ticket.hid, {name});
			var channel = await bot.channels.fetch(ticket.channel_id);
			await channel.edit({name: `${ticket.hid}-${name}`});
			var message = await channel.messages.fetch(ticket.first_message);
			message.embeds[0].title = name;
			await message.edit({embed: message.embeds[0]});
		} catch(e) {
			return "Error:\n" + (e.message || e);
		}
		
		return "Ticket updated.";
	},
	alias: ["rn"]
}