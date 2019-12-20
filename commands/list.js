module.exports = {
	help: ()=> "Manage server tickets.",
	usage: ()=> [" - List open tickets."],
	execute: async (bot, msg, args) => {
		var tickets = await bot.utils.getTickets(bot, msg.guild.id);
		if(!tickets) return msg.channel.createMessage("No tickets registered for this server.");

		var embeds = tickets.map((t,i) => {
			return {embed: {
				title: `${t.name} (ticket ${i+1}/${tickets.length})`,
				description: t.description,
				color: t.closed ? parseInt("aa5555", 16) : parseInt("55aa55", 16),
				fields: [
					{name: "Ticket Opener", value: t.opener.mention},
					{name: "Ticket Users", value: t.users.map(u => u.mention).join("\n")}
				],
				footer: {
					text: `ID: ${t.hid}${t.closed ? " | This ticket has been closed." : ""}`
				},
				timestamp: t.timestamp
			}}
		})

		var message = await msg.channel.createMessage(embeds[0]);

		if(!bot.menus) bot.menus = {};
		bot.menus[message.id] = {
			user: msg.author.id,
			index: 0,
			data: embeds,
			timeout: setTimeout(()=> {
				if(!bot.menus[message.id]) return;
				message.removeReaction("\u2b05");
				message.removeReaction("\u27a1");
				message.removeReaction("\u23f9");
				delete bot.menus[message.id];
			}, 900000),
			execute: bot.utils.paginateEmbeds
		}
		message.addReaction("\u2b05");
		message.addReaction("\u27a1");
		message.addReaction("\u23f9");
	},
	permissions: ["manageMessages"],
	guildOnly: true,
	alias: ["see","view","l","v","ls"]
}