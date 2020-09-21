module.exports = {
	help: ()=> "Re-open a closed ticket.",
	usage: ()=> [" <hid> - Re-opens a ticket. If no hid is given, opens the current channel's ticket."],
	desc: ()=> "This command can only be used by moderators and the ticket owner, unless the command has been set to mod-only using `tg!config modonly`",
	execute: async (bot, msg, args) => {
		var cfg = await bot.stores.configs.get(msg.guild.id);
		var ticket;
		if(args[0]) ticket = await bot.stores.tickets.get(msg.guild.id, args[0].toLowerCase());
		else ticket = await bot.stores.tickets.getByChannel(msg.guild.id, msg.channel.id);
		if(!ticket) return "Please provide a valid ticket hid or use this command in a ticket channel.";

		if((cfg.mod_only?.find(cmd => ["open", "reopen"].includes(cmd)) && !msg.member.permissions.has("MANAGE_CHANNELS")) ||
			(msg.author.id != ticket.opener.id) && !msg.member.permissions.has("MANAGE_CHANNELS"))
				return "You do not have permission to open this ticket.";

		try {
			await bot.stores.tickets.update(msg.channel.guild.id, ticket.hid, {closed: false});
		} catch(e) {
			return "Error:\n"+e;
		}

		try {
			var channel = await bot.channels.fetch(ticket.channel_id);
			var tmessage = await channel.messages.fetch(ticket.first_message);

			for(var i = 0; i < ticket.users.length; i++) {
				await tmessage.channel.updateOverwrite(ticket.users[i].id, {
					'VIEW_CHANNEL': true,
					'SEND_MESSAGES': true
				});
			}

			if(tmessage) {
				var embed = {
					title: `${ticket.name || "Untitled ticket"}`,
					description: ticket.description || "(no description)",
					fields: [
						{name: "Ticket Opener", value: `${ticket.opener}`},
						{name: "TIcket Users", value: ticket.users.map(u => `${u}`).join("\n")},
					],
					color: parseInt("55aa55", 16),
					footer: {
						text: "Ticket ID: "+ticket.hid
					},
					timestamp: ticket.timestamp
				}

				await tmessage.edit({embed: embed});

				await tmessage.reactions.cache.get("🔓").remove();
				await tmessage.react("🔒");
			}
		} catch(e) {
			console.log(e);
			return "Error:\n"+e;
		}
	},
	alias: ["reopen"],
	guildOnly: true
}