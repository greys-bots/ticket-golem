module.exports = {
	help: ()=> "Add users to a ticket.",
	usage: ()=> [" <hid> [user] [user] ... - Add users to a ticket. If no hid is given, adds them to the current channel's ticket."],
	desc: ()=> "Users can be @mentions or user IDs. The default limit to how many users can be added to a ticket via commands is 10 - others will need to be added manually, or the limit will need to be changed. This does not include moderators or the original opener of the ticket.\nThis command can only be used by moderators and the ticket owner, unless the command has been set to mod-only using `tg!config modonly`.",
	execute: async (bot, msg, args) => {
		if(!args[0]) return "Please provide users to add to the ticket.";
		var ids;
		var cfg = await bot.stores.configs.get(msg.guild.id);
		var limit = cfg?.user_limit || 10;
		var ticket;
		if(args[0]) ticket = await bot.stores.tickets.get(msg.guild.id, args[0].toLowerCase());
		if(ticket) ids = args.slice(1).map(id => id.replace(/[<@!>]/g,""));
		else {
			ticket = await bot.stores.tickets.getByChannel(msg.guild.id, msg.channel.id);
			ids = args.map(id => id.replace(/[<@!>]/g,""))
		}
		if(!ticket) return "Please provide a valid ticket hid or use this command in a ticket channel.";
		if((cfg.mod_only?.includes('add') && !msg.member.permissions.has("MANAGE_CHANNELS")) ||
			(msg.author.id != ticket.opener.id) && !msg.member.permissions.has("MANAGE_CHANNELS"))
				return "You do not have permission to edit this ticket.";

		if(limit > -1 && (ids.length > limit || (ids.length + ticket.users.length-1) > limit)) return `${limit > 0 ? "Only up to "+limit : "No"} users can be added to tickets via this command.`;
		ids = ticket.userids.concat(ids.filter(id => !ticket.userids.includes(id)));

		var members = msg.guild.members.cache.filter(m => ids.includes(m.id))?.map(m => m);
		if(!members || !members[0]) return "Please provide valid members to add to the ticket.";

		var channel = msg.guild.channels.cache.find(c => c.id == ticket.channel_id);
		if(!channel) return "Couldn't get the channel associated with that ticket.";

		try {
			for(var i = 0; i < members.length; i++) {
				await channel.updateOverwrite(members[i].id, {
					'VIEW_CHANNEL': true,
					'SEND_MESSAGES': true
				})
			}

			await bot.stores.tickets.update(msg.guild.id, ticket.hid, {users: members.map(m => m.id)});
		} catch(e) {
			console.log(e);
			return "Error:\n" + (e.message || e);
		}

		var message = await channel.messages.fetch(ticket.first_message);
		if(!message) return "Couldn't get the ticket's first message; users have been added, but won't be reflected there.";
		
		try {
			await message.edit({embed: {
				title: ticket.name,
				description: ticket.description,
				fields: [
					{name: "Ticket Opener", value: message.embeds[0].fields[0].value},
					{name: "Ticket Users", value: members.length > 20 ? members.slice(0, 21).map(m => `${m}`).join("\n") + `\nAnd ${members.length - 20} more...` : members.map(m => `${m}`).join("\n")}
				],
				color: 2074412,
				footer: {
					text: "Ticket ID: "+ticket.hid
				},
				timestamp: ticket.timestamp
			}})
		} catch(e) {
			console.log(e);
			return "Couldn't edit ticket message; users have been added, but won't be reflected there.";
		}

		return "Users added to the ticket.";
	},
	alias: ["a","+"],
	guildOnly: true
}