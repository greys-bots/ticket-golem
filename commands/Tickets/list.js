module.exports = {
	help: ()=> "Manage server tickets.",
	usage: ()=> [" - List open tickets."],
	execute: async (bot, msg, args) => {
		var tickets = await bot.stores.tickets.getAll(msg.guild.id);
		if(!tickets) return "No tickets registered for this server.";

		for(var ticket of tickets) {
			var deleted;
			try {
				var channel = await bot.channels.fetch(ticket.channel_id);
				if(!channel || channel.deleted) {
					await bot.stores.tickets.deleteByChannel(msg.guild.id, ticket.channel_id);
					deleted = true;
				}
			} catch(e) {
				console.log(e);
				await bot.stores.tickets.deleteByChannel(msg.guild.id, ticket.channel_id);
				deleted = true;
			}
			if(deleted) tickets = tickets.filter(t => t.channel_id != ticket.channel_id);
		}

		var embeds = tickets.map((t,i) => {
			return {embed: {
				title: `${t.name || "Untitled ticket"} (ticket ${i+1}/${tickets.length})`,
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

		return embeds?.[0] ? embeds : "No valid tickets registered for this server.";
	},
	alias: ["see","view","l","v","ls"],
	permissions: ["MANAGE_MESSAGES"],
	guildOnly: true
}