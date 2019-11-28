module.exports = {
	help: ()=> "Manage server tickets.",
	usage: ()=> [" - List open tickets."],
	execute: async (bot, msg, args) => {
		var tickets = await bot.utils.getTickets(bot, msg.guild.id);
		if(!tickets) return msg.channel.createMessage("No tickets registered for this server.");

		if(tickets.length > 5) {
			var embeds = await bot.utils.genEmbeds(bot, tickets, async dat => {
				return {
					name: `Ticket ${dat.hid}`,
					value: [
						`[first message](https://discordapp.com/channels/${msg.guild.id}/${dat.channel_id}/${dat.first_message})`,
						`Opener: ${dat.opener.username}#${dat.opener.discriminator} (${dat.opener.id})`,
						`Users:\n${dat.users.map(u => `${u.username}#${u.discriminator} (${u.id})`).join("\n")}`
					].join("\n")
				}
			}, {
				title: "Server Tickets",
				description: `Total tickets: ${tickets.length}`
			}, 5);
			
			var message = await msg.channel.createMessage(embeds[0]);
			if(!bot.menus) bot.menus = {};
			bot.menus[message.id] = {
				user: msg.author.id,
				data: embeds,
				index: 0,
				timeout: setTimeout(()=> {
					if(!bot.pages[message.id]) return;
					message.removeReaction("\u2b05");
					message.removeReaction("\u27a1");
					message.removeReaction("\u23f9");
					delete bot.pages[msg.author.id];
				}, 900000),
				execute: async function(m, emoji) {
					switch(emoji.name) {
						case "\u2b05":
							if(this.index == 0) {
								this.index = this.data.length-1;
							} else {
								this.index -= 1;
							}
							await bot.editMessage(m.channel.id, m.id, this.data[this.index]);
							await bot.removeMessageReaction(m.channel.id, m.id, emoji.name, msg.author.id)
							bot.menus[m.id] = this;
							break;
						case "\u27a1":
							if(this.index == this.data.length-1) {
								this.index = 0;
							} else {
								this.index += 1;
							}
							await bot.editMessage(m.channel.id, m.id, this.data[this.index]);
							await bot.removeMessageReaction(m.channel.id, m.id, emoji.name, msg.author.id)
							bot.menus[m.id] = this;
							break;
						case "\u23f9":
							await bot.deleteMessage(m.channel.id, m.id);
							delete bot.menus[m.id];
							break;
					}
				}
			}
			message.addReaction("\u2b05");
			message.addReaction("\u27a1");
			message.addReaction("\u23f9");
		} else {
			msg.channel.createMessage({embed: {
				title: "Server Tickets",
				description: `Total tickets: ${tickets.length}`,
				fields: tickets.map(t => {
					return {
						name: `Ticket ${t.hid}`,
						value: [
							`[first message](https://discordapp.com/channels/${msg.guild.id}/${t.channel_id}/${t.first_message})`,
							`Opener: ${t.opener.username}#${t.opener.discriminator} (${t.opener.id})`,
							`Users:\n${t.users.map(u => `${u.username}#${u.discriminator} (${u.id})`).join("\n")}`
						].join("\n")
					}
				})
			}})
		}
	},
	permissions: ["manageMessages"],
	guildOnly: true,
	alias: ["see","view","l","v","ls"]
}