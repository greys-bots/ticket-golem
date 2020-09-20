module.exports = {
	help: ()=> "Close a ticket.",
	usage: ()=> [" <hid> - Closes a ticket. If no hid is given, closes the current channel's ticket."],
	desc: ()=> "Closing a ticket acts as an alternative method of archival. Users in the ticket will still be able to read, but not send, messages. The channel will not be deleted.\nThis command can only be used by moderators and the ticket owner, unless the command has been set to mod-only using `tg!config modonly`.",
	execute: async (bot, msg, args) => {
		var cfg = await bot.stores.configs.get(msg.guild.id);
		var ticket;
		if(args[0]) ticket = await bot.stores.tickets.get(msg.guild.id, args[0].toLowerCase());
		else ticket = await bot.stores.tickets.getByChannel(msg.guild.id, msg.channel.id);
		if(!ticket) return "Please provide a valid ticket hid or use this command in a ticket channel.";

		if((cfg.mod_only?.includes('close') && !msg.member.permissions.has("MANAGE_CHANNELS")) ||
			(msg.author.id != ticket.opener.id) && !msg.member.permissions.has("MANAGE_CHANNELS"))
				return "You do not have permission to close this ticket.";
		
		var message = await msg.channel.send("Are you sure you want to close this ticket?\nNOTE: This will remove the ability to send messages; users involved will still see the ticket.");
		["✅","❌"].forEach(r => message.react(r));

		var confirmation = await bot.utils.getConfirmation(bot, message, msg.author);
		if(confirmation.msg) return confirmation.msg;

		try {
			await bot.stores.tickets.update(m.channel.guild.id, this.data.hid, {closed: true});
		} catch(e) {
			return "Error:\n"+e;
		}

		try {
			var channel = await bot.channels.fetch(ticket.channel_id);
			var tmessage = await channel.messages.fetch(ticket.first_message);

			for(var i = 0; i < ticket.users.length; i++) {
				await tmessage.channel.edit({
					permissionOverwrites:[
						{id: this.data.users[i].id, allow: 1024, deny: 2048, type: "member"}
					]
				});
			}

			if(tmessage) {
				var embed = {
					title: `${ticket.name || "Untitled ticket"} (CLOSED)`,
					description: ticket.description || "(no description)",
					fields: [
						{name: "Ticket Opener", value: `${ticket.opener}`},
						{name: "TIcket Users", value: ticket.users.map(u => `${u}`).join("\n")},
					],
					color: parseInt("55aa55", 16),
					footer: {
						text: `Ticket ID: ${ticket.hid} | This ticket has been closed.`
					},
					timestamp: ticket.timestamp
				}
				
				await tmessage.edit({embed: embed});

				await tmessage.reactions.cache.get("🔒").remove();
				await tmessage.react("🔓");
			}
		} catch(e) {
			console.log(e);
			return "Error:\n"+e;
		}
	},
	alias: ["cls"],
	guildOnly: true
}