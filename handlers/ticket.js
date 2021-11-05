class TicketHandler {
	constructor(bot) {
		this.bot = bot;

		bot.on('messageReactionAdd', (...args) => {
			this.handleReactions(...args)
		})
	}

	async handleReactions(react, user) {
		if(user.bot) return;

		try {
			if(react.partial) react = await react.fetch();
			if(react.message.partial) var msg = await msg.fetch();
			else var msg = react.message;
		} catch(e) {
			if(!e.message.toLowerCase().includes("unknown message")) console.log(e);
			return Promise.reject(e.message);
		}

		if(!msg.channel.guild) return;

		var post = await this.bot.stores.posts.get(msg.guild.id, msg.channel.id, msg.id);
		if(post) return await this.handlePost({msg, react, user, post});

		var ticket = await this.bot.stores.tickets.getByChannel(msg.guild.id, msg.channel.id);
		if(ticket) return await this.handleTicket({msg, react, user, ticket});
	}

	async createTicket(ctx) {
		var { msg, user, cfg } = ctx;
		
		var code = this.bot.utils.genCode(this.bot.chars);
		var time = new Date();

		try {
			var channel = await msg.guild.channels.create(`ticket-${code}`, {
				topic: `Ticket ${code}`,
				parent: cfg.category_id
			})
			await channel.lockPermissions(); //get perms from parent category
			await channel.permissionOverwrites.edit(user.id, {
				'VIEW_CHANNEL': true,
				'SEND_MESSAGES': true
			})


			var message = await channel.send({
				content:
					`Thank you for opening a ticket, ${user}. ` +
					`You can chat with support staff here.\n` +
					`React with :pencil2: to edit this ticket, or ` +
					`:lock: to close it. If the ticket is closed, react with ` +
					`:unlock: to re-open it. :white_check_mark: will archive the ticket.`,
				embeds: [{
					title: "Untitled Ticket",
					description: "(no description)",
					fields: [
						{name: "Ticket Opener", value: `${user}`},
						{name: "Ticket Users", value: `${user}`}
					],
					color: 2074412,
					footer: {
						text: "Ticket ID: "+code
					},
					timestamp: time
				}]
			})

			message.pin();
			["✏️","🔒", "✅"].forEach(r => message.react(r));

			await this.bot.stores.tickets.create(msg.guild.id, code, {
				channel_id: channel.id,
				first_message: message.id,
				opener: user.id,
				users: [user.id],
				timestamp: time.toISOString()
			});
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message || e);
		}

		return {code, channel};
	}

	async handlePost(ctx) {
		var { msg, react, user, post } = ctx;
		
		if(react.emoji.name != "✅") return;

		await react.users.remove(user.id);

		var cfg = await this.bot.stores.configs.get(msg.guild.id);
		if(!cfg) {
			await user.send("That server is missing a ticket category setup. Please alert the mods.");
			return;
		}

		var open = (await this.bot.stores.tickets.getByUser(msg.guild.id, user.id));
		if(open?.length >= cfg.ticket_limit) {
			await user.send(`You already have ${open.length} ticket(s) open in that server. The current limit is ${cfg.ticket_limit}.`);
			return;
		}

		return await this.createTicket({msg, user, cfg})
	}
	
	async handleTicket(ctx) {
		var { msg, user, react, ticket } = ctx;
		if(msg.id !== ticket.first_message) return;

		var cfg = await this.bot.stores.configs.get(msg.guild.id);
		if(!cfg) return;

		var member = await msg.guild.members.fetch(user);

		var embed = msg.embeds[0];
		if(!embed) embed = {
			title: ticket.name,
			description: ticket.description,
			fields: [
				{name: "Ticket Opener", value: `${ticket.opener}`},
				{name: "TIcket Users", value: ticket.users.map(u => `${u}`).join("\n")},
			],
			color: 2074412,
			footer: {
				text: "Ticket ID: "+ticket.hid
			},
			timestamp: ticket.timestamp
		}

		var resp;
		switch(react.emoji.name) {
			case "✏️":
				await react.users.remove(user);
				if(ticket.closed) return;
				if((cfg.mod_only?.find(cmd => ['rename', 'description'].includes(cmd)) && !member.permissions.has("MANAGE_CHANNELS")) ||
					(member.id != ticket.opener.id) && !member.permissions.has("MANAGE_CHANNELS"))
						return user.send("You do not have permission to edit this ticket.");

				var message = await msg.channel.send({embeds: [{
					description: "Choose what to edit.",
					fields: [
						{name: "1️⃣ Name", value: "Change the ticket name."},
						{name: "2️⃣ Description", value: "Change the ticket description."},
						{name: "❌ Cancel", value: "Cancel editing."}
					],
					footer: {
						text: "Use reactions or type 'one,' 'two,' or 'cancel' to make your choice."
					}
				}]});
				["1️⃣", "2️⃣", "❌"].forEach(r => message.react(r));

				var choice = await this.bot.utils.handleChoices(this.bot, message, user, [
					{
						name: 'name',
						accepted: ['1', 'name', '1️⃣']
					},
					{
						name: 'desc',
						accepted: ['2', 'desc', 'description', '2️⃣']
					},
					{
						name: 'cancel',
						accepted: ['cancel', 'x', 'no', 'stop', '❌']
					}
				]);

				if(['none', 'cancel'].includes(choice.name)) return msg.channel.send("Action cancelled.");
				if(choice.name == 'invalid') return msg.channel.send("Action cancelled due to invalid input.");

				switch(choice.name) {
					case "name":
						await msg.channel.send("Enter the new name. You have 1 minute to do this. The name must be " + (100-(ticket.hid.length+1)) + " characters or less. Cancel the action by typing `cancel`.");
						resp = (await msg.channel.awaitMessages({filter: m => m.author.id == user.id, max: 1, time: 60000}))?.first();
						if(!resp) return msg.channel.send("ERR: Timed out.");
						if(resp.content.toLowerCase() == "cancel") return msg.channel.send("Action cancelled.");
						if(resp.content.length > (100-(ticket.hid.length+1))) return msg.channel.send("ERR: Name too long. Must be between 1 and " + (100-(ticket.hid.length+1)) +" characters in length.");

						try {
							await this.bot.stores.tickets.update(msg.channel.guild.id, ticket.hid, {name: resp.content});
							embed.title = resp.content;
							await msg.edit({embeds: [embed]});
							await msg.channel.send("Ticket updated. Note that the channel itself may take time to update due to ratelimits.");
							await msg.channel.edit({name: `${ticket.hid}-${resp.content}`});
						} catch(e) {
							console.log(e);
							return msg.channel.send(`Error:\n${e.message || e}`);
						}
						break;
					case "desc": 
						await msg.channel.send("Enter the new description. You have 5 minutes to do this. The description must be 1024 characters or less. Cancel the action by typing `cancel`.");
						resp = (await msg.channel.awaitMessages({filter: m => m.author.id == user.id, max: 1, time: 300000}))?.first();
						if(!resp) return msg.channel.send("ERR: Timed out.");
						if(resp.content.toLowerCase() == "cancel") return msg.channel.send("Action cancelled.");
						if(resp.content.length > 1024) return msg.channel.send("That description is too long. Must be between 1 and 1024 characters in length.");

						try {
							await this.bot.stores.tickets.update(msg.channel.guild.id, ticket.hid, {description: resp.content});
							embed.description = resp.content;
							await msg.edit({embeds: [embed]});
							await msg.channel.send("Ticket updated. Note that the channel itself may take time to update due to ratelimits.");
							await msg.channel.edit({topic: resp.content})
						} catch(e) {
							console.log(e);
							return msg.channel.send(`Error:\n${e.message || e}`);
						}
						break;
				}
				break;
			case "🔒":
				await react.users.remove(user);
				if((cfg.mod_only?.includes('close') && !member.permissions.has("MANAGE_CHANNELS")) ||
					(member.id != ticket.opener.id) && !member.permissions.has("MANAGE_CHANNELS"))
						return user.send("You do not have permission to close this ticket.");

				var message = await msg.channel.send("Are you sure you want to close this ticket?\nNOTE: This will remove the ability to send messages; users involved will still see the ticket.");
				["✅","❌"].forEach(r => message.react(r));

				var confirmation = await this.bot.utils.getConfirmation(this.bot, message, user);
				if(confirmation.msg) return msg.channel.send(confirmation.msg);
				
				embed.color = parseInt("aa5555", 16);
				embed.title = `${ticket.name || "Untitled Ticket"} (CLOSED)`;
				embed.footer = {text: `Ticket ID: ${ticket.hid} | This ticket has been closed.`}

				try {
					var channel = await this.bot.channels.fetch(ticket.channel_id);
					await msg.edit({embeds: [embed]});
					for(var i = 0; i < ticket.users.length; i++) {
						await channel.permissionOverwrites.edit(ticket.users[i].id, {
							'VIEW_CHANNEL': true,
							'SEND_MESSAGES': false
						})
					}

					await this.bot.stores.tickets.update(msg.channel.guild.id, ticket.hid, {closed: true});
					await msg.reactions.removeAll();
					["🔓", "✅"].forEach(r => msg.react(r));
				} catch(e) {
					console.log(e);
					msg.channel.send(`Error:\n${e.message || e}`);
				}

				await msg.channel.send("Ticket closed.");
				break;
			case "🔓":
				await react.users.remove(user);
				if((cfg.mod_only?.find(cmd => ["open", "reopen"].includes(cmd)) && !member.permissions.has("MANAGE_CHANNELS")) ||
					(member.id != ticket.opener.id) && !member.permissions.has("MANAGE_CHANNELS"))
						return user.send("You do not have permission to open this ticket.");

				embed.color = parseInt("55aa55", 16);
				embed.title = ticket.name || "Untitled Ticket";
				embed.footer = {text: `Ticket ID: ${ticket.hid}`}

				try {
					var channel = await this.bot.channels.fetch(ticket.channel_id);
					await msg.edit({embeds: [embed]});
					for(var i = 0; i < ticket.users.length; i++) {
						await channel.permissionOverwrites.edit(ticket.users[i].id, {
							'VIEW_CHANNEL': true,
							'SEND_MESSAGES': true
						})
					}

					await this.bot.stores.tickets.update(msg.channel.guild.id, ticket.hid, {closed: false});
					await msg.reactions.removeAll();
					["✏️","🔒", "✅"].forEach(r => msg.react(r));
				} catch(e) {
					console.log(e);
					msg.channel.send(`Error:\n${e.message || e}`);
				}

				await msg.channel.send("Ticket re-opened.");
				break;
			case "✅":
				await react.users.remove(user.id);
				if(!member.permissions.has("MANAGE_CHANNELS"))
					return user.send("You do not have permission to archive this ticket.");

				var message = await msg.channel.send("Are you sure you want to archive this ticket?\nNOTE: This will delete the channel and send an archive to you.");
				["✅","❌"].forEach(r => message.react(r));

				var confirmation = await this.bot.utils.getConfirmation(this.bot, message, user);
				if(confirmation.msg) return msg.channel.send(confirmation.msg);
				
				var results = await this.bot.commands.get('archive').execute(this.bot, message, []);
				if(results) await msg.channel.send(results);
				break;
		}
	}
}

module.exports = (bot) => new TicketHandler(bot);