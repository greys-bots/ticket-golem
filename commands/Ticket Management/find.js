module.exports = {
	help: ()=> "Find specific tickets using a search query.",
	usage: ()=> [" from:[userID] - Find tickets opened by a specific user.",
				 " [search words] - Find tickets that contain the given words in their name or description.",
				 " from:[userID] [search words] - Find tickets that contain the given words and were opened by a specific user."],
	execute: async (bot, msg, args) => {
		if(!args[0]) return "Please provide a search query.";
		var query = {};
		var tickets;
		query.user = args.join(" ").match(/from\:(\d{17,})/i)?.[1];
		query.text = args.join(" ").replace(/from\:(\d{17,})\s?/i, "");
		
		if(!query.user && !query.text) return "Please provide a search query."; 

		tickets = await bot.stores.tickets.search(msg.guild.id, query);

		if(!tickets || !tickets[0]) return 'No tickets found matching that query.';

		var embeds = tickets.map((t,i) => {
			return {embed: {
				title: `${t.name || "Untitled"} (ticket ${i+1}/${tickets.length})`,
				description: t.description || "*(no description)*",
				color: t.closed ? parseInt("aa5555", 16) : parseInt("55aa55", 16),
				fields: [
					{name: "Ticket Opener", value: `${t.opener}`},
					{name: "Ticket Users", value: t.users.map(u => `${u}`).join("\n")}
				],
				footer: {
					text: `ID: ${t.hid}${t.closed ? " | This ticket has been closed." : ""}`
				},
				timestamp: t.timestamp
			}}
		})

		return embeds;
	},
	alias: ["search"],
	permissions: ["MANAGE_MESSAGES"],
	guildOnly: true
}