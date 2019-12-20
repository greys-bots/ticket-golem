module.exports = {
	help: ()=> "Find specific tickets using a search query.",
	usage: ()=> [" from:[userID] - Find tickets from a specific user.",
				 " [search words] - Find tickets that contain the given words in their name or description.",
				 " from:[userID] [search words] - Find tickets that contain the given words and were opened by a specific user."],
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide a search query.")
		var query;
		var user;
		var tickets;
		if(args[0].toLowerCase().startsWith('from:')) {
			user = args[0].toLowerCase().replace('from:','');
			query = args[1] ? args.slice(1).join(" ").toLowerCase() : undefined;
		} else {
			query = args[0] ? args.join(" ").toLowerCase() : undefined;
		}
		if(!user && !query) return msg.channel.createMessage("Please provide a search query");
		console.log(query)

		if(user && !query) tickets = await bot.utils.getTicketsByUser(bot, msg.guild.id, user);
		if(user && query) tickets = await bot.utils.searchTicketsFromUser(bot, msg.guild.id, user, query);
		if(!user && query) tickets = await bot.utils.searchTickets(bot, msg.guild.id, query);

		if(!tickets || !tickets[0]) return msg.channel.createMessage('No tickets found matching that query');

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
	alias: ["search"],
	permissions: ["manageMessages"],
	guildOnly: true
}