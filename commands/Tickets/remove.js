module.exports = {
	help: ()=> "Remove users from a ticket",
	usage: ()=> [" [user] [user] ... - Remove users from the ticket attached to the current channel",
				 " [hid] [user] [user] ... - Remove users from a ticket with the given hid"],
	desc: ()=> "Users can be @mentions or user IDs. You cannot remove the ticket opener from the ticket via commands.\nThis command can only be used by moderators and the ticket owner, unless the command has been set to mod-only using `tg!config modonly`",
	execute: async (bot, msg, args) => {
		if(!args[0]) return "Please provide users to remove from the ticket.";
		var ids;
		var cfg = await bot.stores.configs.get(msg.guild.id);
		var ticket;
		if(args[0]) ticket = await bot.stores.tickets.get(msg.guild.id, args[0].toLowerCase());
		if(ticket) ids = args.slice(1).map(id => id.replace(/[<@!>]/g,""));
		else {
			ticket = await bot.stores.tickets.getByChannel(msg.guild.id, msg.channel.id);
			ids = args.map(id => id.replace(/[<@!>]/g,""))
		}

		console.log(ticket);
		if(!ticket) return "Please provide a valid ticket hid or use this command in a ticket channel.";
		if((cfg.mod_only?.includes('remove') && !msg.member.permissions.has("MANAGE_CHANNELS")) ||
			(msg.author.id != ticket.opener.id) && !msg.member.permissions.has("MANAGE_CHANNELS"))
				return "You do not have permission to edit this ticket.";

		ids = ids.filter(id => ticket.userids.includes(id) && id != ticket.opener.id);

		var members = msg.guild.members.cache.filter(m => ids.includes(m.id))?.map(m => m);
		if(!members || !members[0]) return "Please provide valid members to remove from the ticket.";

		ticket.users = ticket.users.filter(u => !members.find(m => m.id == u.id));

		var channel = msg.guild.channels.cache.find(c => c.id == ticket.channel_id);
		if(!channel) return "Couldn't get the channel associated with that ticket.";

		try {
			for(var i = 0; i < members.length; i++) {
				await channel.permissionOverwrites.delete(members[i].id)
			}

			await bot.stores.tickets.update(msg.guild.id, ticket.hid, {users: ticket.users.map(u => u.id)});
		} catch(e) {
			console.log(e);
			return "Error:\n" + (e.message || e);
		}

		var message = await channel.messages.fetch(ticket.first_message);
		if(!message) return "Couldn't get the ticket's first message; users have been removed, but won't be reflected there.";
		
		try {
			await message.edit({embed: {
				title: ticket.name || "Untitled Ticket",
				description: ticket.description || "(no description)",
				fields: [
					{name: "Ticket Opener", value: message.embeds[0].fields[0].value},
					{name: "Ticket Users", value: ticket.users.length > 20 ? ticket.users.slice(0, 21).map(u => `${u}`).join("\n") + `\nAnd ${ticket.users.length - 20} more...` : ticket.users.map(u => `${u}`).join("\n")}
				],
				color: 2074412,
				footer: {
					text: "Ticket ID: "+ticket.hid
				},
				timestamp: ticket.timestamp
			}})
		} catch(e) {
			console.log(e);
			return "Couldn't edit ticket message; users have been removed, but won't be reflected there.";
		}

		return "Users removed from the ticket.";
	},
	guildOnly: true,
	alias: ["r","rmv","-"]
}