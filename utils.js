const fs = require('fs');

const recursivelyReadDirectory = (dir) => {
	var results = [];
	var files = fs.readdirSync(dir, {withFileTypes: true});
	for(file of files) {
		if(file.isDirectory()) {
			results = results.concat(recursivelyReadDirectory(dir+"/"+file.name));
		} else {
			results.push(dir+"/"+file.name);
		}
	}

	return results;
}
module.exports = {
	recursivelyReadDirectory,
	genEmbeds: async (bot, arr, genFunc, info = {}, fieldnum, extras = {}) => {
		return new Promise(async res => {
			var embeds = [];
			var current = { embed: {
				title: typeof info.title == "function" ?
								info.title(arr[0], 0) : info.title,
						description: typeof info.description == "function" ?
								info.description(arr[0], 0) : info.description,
				color: typeof info.color == "function" ?
						info.color(arr[0], 0) : info.color,
				footer: info.footer,
				fields: []
			}};
			
			for(let i=0; i<arr.length; i++) {
				if(current.embed.fields.length < (fieldnum || 10)) {
					current.embed.fields.push(await genFunc(arr[i], bot));
				} else {
					embeds.push(current);
					current = { embed: {
						title: typeof info.title == "function" ?
								info.title(arr[i], i) : info.title,
						description: typeof info.description == "function" ?
								info.description(arr[i], i) : info.description,
						color: typeof info.color == "function" ?
								info.color(arr[i], i) : info.color,
						footer: info.footer,
						fields: [await genFunc(arr[i], bot)]
					}};
				}
			}
			embeds.push(current);
			if(extras.order && extras.order == 1) {
				if(extras.map) embeds = embeds.map(extras.map);
				if(extras.filter) embeds = embeds.filter(extras.filter);
			} else {
				if(extras.filter) embeds = embeds.filter(extras.filter);
				if(extras.map) embeds = embeds.map(extras.map);
			}
			if(embeds.length > 1) {
				for(let i = 0; i < embeds.length; i++)
					embeds[i].embed.title += (extras.addition != null ? eval("`"+extras.addition+"`") : ` (page ${i+1}/${embeds.length}, ${arr.length} total)`);
			}
			res(embeds);
		})
	},
	genTicketEmbed: (ticket) => {
		var users;
		if(ticket.users.length > 20) {
			users = ticket.users.slice(0, 21)
				.map(u => `<@${u.id}>`)
				.join("\n") +
				`\nand ${ticket.users.length - 20} more`;
		} else users = ticket.users.map(u => `<@${u.id}>`).join("\n");
		
		return {
			title: ticket.name ?? "Untitled Ticket",
			description: ticket.description ?? "(no description)",
			fields: [
				{
					name: "Ticket Opener",
					value: `<@${ticket.opener.id}>`
				},
				{
					name: "Ticket Users",
					value: users
				}
			],
			color: ticket.closed ? 0xaa5555 : 0x55aa55,
			footer: {
				text: `Ticket ID: ${ticket.hid}`
			},
			timestamp: ticket.timestamp
		}
	},
	async checkTicketPerms(ctx) {
		var {
			msg,
			ticket,
			user,
			cfg,
			action
		} = ctx;
		
		var member = await msg.guild.members.fetch(user);

		if(cfg?.mod_only?.includes(action) && !member.permissions.has("ManageChannels"))
			return false;
		if(member.id != ticket.opener && !member.permissions.has("ManageChannels"))
			return false;

		return true;
	},
}
