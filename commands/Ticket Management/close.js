module.exports = {
	help: ()=> "Close a ticket.",
	usage: ()=> [" <hid> - Closes a ticket. If no hid is given, closes the current channel's ticket."],
	desc: ()=> "Closing a ticket acts as an alternative method of archival. Users in the ticket will still be able to read, but not send, messages. The channel will not be deleted.\nThis command can only be used by moderators and the ticket owner, unless the command has been set to mod-only using `tg!config modonly`",
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		var ticket = await bot.utils.getTicketByChannel(bot, msg.guild.id, msg.channel.id);
		if(!ticket) ticket = await bot.utils.getTicket(bot, msg.guild.id, args[0].toLowerCase());
		if(!ticket) return msg.channel.createMessage("Please provide a valid ticket hid or use this command in a ticket channel.");

		if((cfg.mod_only && cfg.mod_only.includes("close") && !msg.member.hasPermission("manageMessages")) || 
		   (!msg.member.hasPermission("manageMessages") && msg.author.id != ticket.opener.id)) return msg.channel.createMessage("You do not have permission to close this ticket.");

		var tmessage;
		try {
			tmessage = await bot.getMessage(ticket.channel_id, ticket.first_message);
		} catch(e) {
			console.log(e);
			msg.channel.createMessage("Couldn't get the ticket's first message; any changes won't be reflected there.");
		}
		
		ticket.message = tmessage;

		var message = await msg.channel.createMessage("Are you sure you want to close this ticket?\nNOTE: This will remove the ability to send messages; users involved will still see the ticket.");
		if(!bot.menus) bot.menus = {};
		bot.menus[message.id] = {
			user: msg.author.id,
			index: 0,
			data: ticket,
			timeout: setTimeout(()=> {
				if(!bot.menus[message.id]) return;
				if(message.channel.guild) {
					try {
						message.removeReactions();
					} catch(e) {
						console.log(e);
						message.channel.createMesage("ERR: Couldn't remove reactions. Make sure I have the `mangeMessages` permission")
					}
				}
				delete bot.menus[message.id];
			}, 900000),
			execute: async function(bot, m, e){
				switch(e.name) {
					case "✅":
						if(this.data.message) {
							var embed = this.data.message.embeds[0];
							if(!embed) embed = {
								title: this.data.name,
								description: this.data.description,
								fields: [
									{name: "Ticket Opener", value: `${this.data.opener.mention}`},
									{name: "TIcket Users", value: this.data.users.map(u => u.mention).join("\n")},
								],
								color: 2074412,
								footer: {
									text: "Ticket ID: "+this.data.hid
								},
								timestamp: this.data.timestamp
							}

							embed.color = parseInt("aa5555", 16);
							embed.title = this.data.name + " (CLOSED)";
							embed.footer = {text: `Ticket ID: ${this.data.hid} | This ticket has been closed.`}
							this.data.message.edit({embed: embed});
						}
						
						try {
							for(var i = 0; i < this.data.users.length; i++) {
								await m.channel.editPermission(this.data.users[i].id, 1024, 2048, "member");
							}
						} catch(e) {
							console.log(e);
							m.channel.createMessage("Couldn't edit overrides for at least one user on the ticket. The ticket is closed, but can still be seen by some users.");
						}

						var scc = await bot.utils.editTicket(bot, m.channel.guild.id, this.data.hid, "closed", true);
						if(scc) m.channel.createMessage("The ticket has been closed.");
						else m.channel.createMessage("The ticket has been closed; however, this could not be saved to the database. This ticket may still count towards the opener's open tickets.");
						break;
					case "❌":
						m.channel.createMessage("Action cancelled");
						break;
				}
			}
		};
		["✅","❌"].forEach(r => message.addReaction(r))
	},
	alias: ["cls"],
	guildOnly: true
}