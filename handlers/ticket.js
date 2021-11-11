const { MessageAttachment } = require("discord.js");

const COMPS = {
	closed: [
		{
			type: 2,
			style: 1,
			emoji: '✏️',
			label: "Edit ticket",
			custom_id: "edit",
			disabled: true
		},
		{
			type: 2,
			style: 3,
			emoji: '🔓',
			label: "Open ticket",
			custom_id: "open"
		},
		{
			type: 2,
			style: 2,
			emoji: '📕',
			label: "Archive ticket",
			custom_id: "archive"
		},
	],
	open: [
		{
			type: 2,
			style: 1,
			emoji: '✏️',
			label: "Edit ticket",
			custom_id: "edit"
		},
		{
			type: 2,
			style: 4,
			emoji: '🔒',
			label: "Close ticket",
			custom_id: "close"
		},
		{
			type: 2,
			style: 2,
			emoji: '📕',
			label: "Archive ticket",
			custom_id: "archive"
		},
	]
}

class TicketHandler {
	constructor(bot) {
		this.bot = bot;

		bot.on('messageReactionAdd', (...args) => {
			this.handleReactions(...args)
		})

		bot.on("interactionCreate", (ctx) => this.handleInteractions(ctx));
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

	async handleInteractions(ctx) {
		if(!ctx.isButton()) return;
		if(ctx.user.bot) return;
		if(!ctx.guild) return;

		var post = await this.bot.stores.posts.get(ctx.guild.id, ctx.channel.id, ctx.message.id);
		if(post) return await this.handlePost({
			msg: ctx.message,
			interaction: ctx,
			user: ctx.user,
			post
		});

		var ticket = await this.bot.stores.tickets.getByChannel(ctx.guild.id, ctx.channel.id);
		if(ticket) return await this.handleTicket({
			msg: ctx.message,
			interaction: ctx,
			user: ctx.user,
			ticket
		});
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
					`React or interact below for options.`,
				embeds: [{
					title: "Untitled Ticket",
					description: "(no description)",
					fields: [
						{name: "Ticket Opener", value: `${user}`},
						{name: "Ticket Users", value: `${user}`}
					],
					color: 0x55aa55,
					footer: {
						text: "Ticket ID: "+code
					},
					timestamp: time
				}],
				components: [{
					type: 1,
					components: COMPS.open
				}]
			})

			message.pin();

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

	async editTicket(ctx) {
		var {
			ticket,
			channel,
			msg
		} = ctx;

		try {
			if(!channel) {
				if(msg.channel.id == ticket.channel_id)
					channel = msg.channel;
				else channel = await msg.guild.channels.fetch(ticket.channel_id);
			}

			var message = await channel.messages.fetch(ticket.first_message);
			var users;
			if(ticket.users.length > 20) {
				users = ticket.users.slice(0, 21)
					.map(u => `<@${u.id}>`)
					.join("\n") +
					`\nand ${ticket.users.length - 20} more`;
			} else users = ticket.users.map(u => `<@${u.id}>`).join("\n");

			await message.edit({
				embeds: [{
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
				}],
				components: [{
					type: 1,
					components: ticket.closed ? COMPS.closed : COMPS.open
				}]
			})
		} catch(e) {
			if(!channel) throw new Error("Couldn't get channel associated with that ticket.");
			if(!msg) throw new Error("Couldn't get the ticket's first message.");
			return {
				content: 'Error: ' + (e.message ?? e),
				ephemeral: true
			};
		}
	}

	async archive(ctx) {
		var {
			ticket,
			cfg,
			channel,
			user,
		} = ctx;

		try {
			var messages = await channel.messages.fetch({limit: 100});
			if(!messages) return "Either that channel has no messages, or I couldn't get them.";
			while(messages.last().id != ticket.first_message) {
				console.log('fetching more...')
				var extra = await channel.messages.fetch({limit: 100, before: messages.last().id});
				messages = messages.concat(extra);
			}

			var data = [];
			messages.forEach(m => {
				var date = m.createdAt;
				data.push([`ID: ${m.id}`,
							`\r\n${m.author.username}#${m.author.discriminator + (m.author.bot ? " BOT" : "")} (${m.author.id})`,
							` | ${('00' + (date.getMonth() + 1)).slice(-2)}.${('00' + date.getDate()).slice(-2)}.${date.getFullYear()}`,
							` at ${('00' + date.getHours()).slice(-2)}:${('00' + date.getMinutes()).slice(-2)}`,
							`\r\n${m.content}`].join(""))
			})

			var file = new MessageAttachment(Buffer.from([
				`Ticket name: ${ticket.name || "Untitled Ticket"}\r\n`,
				`Ticket description: ${ticket.description || "(no description)"}\r\n`,
				`Ticket opened: ${this.bot.formatTime(new Date(ticket.timestamp))}\r\n`,
				`Ticket opener: ${ticket.opener.username}#${ticket.opener.discriminator} (${ticket.opener.id})\r\n`,
				`Users involved:\r\n${ticket.users.map(u => `${u.username}#${u.discriminator} (${u.id})`).join("\r\n")}`,"\r\n------\r\n"
			].join("")+data.reverse().join("\r\n------\r\n")),
			channel.name+".txt")

			var date = new Date();

			var embed = {
				title: "Ticket Archive",
				fields: [
					{name: "Ticket name", value: ticket.name || "Untitled Ticket"},
					{name: "Ticket description", value: ticket.description || "(no description)"},
					{name: "Time opened", value: this.bot.formatTime(new Date(ticket.timestamp))},
					{name: "Opener", value: `${ticket.opener.username}#${ticket.opener.discriminator} (${ticket.opener.id})`},
					{name: "Users involved", value: ticket.users.map(u => `${u.username}#${u.discriminator} (${u.id})`).join("\n")},
					{name: "Time closed", value: this.bot.formatTime(date)}
				],
				timestamp: date.toISOString(),
				color: 5821280
			};

			var c;
			if(!cfg?.archives_id) {
				await user.send({embeds: [embed], files: [file]})
				return;
			}

			c = await channel.guild.channels.fetch(cfg.archives_id);
			if(!c) return "Couldn't find your archives channel; please reconfigure it.";
			
			await c.send({embeds: [embed], files: [file]});
			await channel.delete("Ticket archived.");
			await this.bot.stores.tickets.delete(channel.guild.id, ticket.hid);
		} catch(e) {
			console.log(e);
			await user.send("Error during operation:\n"+(e.message || e));
		}

		return;
	}

	async handlePost(ctx) {
		var { msg, react, interaction, user, post } = ctx;

		if(react) {
			if(react.emoji.name != "✅") return;
			await react.users.remove(user.id);
		}

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

		var result = await this.createTicket({msg, user, cfg})
		if(interaction)
			await interaction.reply({
				embeds: [{
					title: "Ticket opened",
					description: `ID: ${result.code}\nChannel: ${result.channel}`
				}],
				ephemeral: true
			});
		else return result;
	}
	
	async handleTicket(ctx) {
		var { msg, user, react, interaction, ticket } = ctx;
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

		var action;
		if(react) {
			switch(react.emoji.name) {
				case '✏️':
					action = 'edit';
					break;
				case '🔒':
					action = 'close';
					break;
				case '🔓':
					action = 'open';
					break;
				case '📕':
					action = 'archive';
					break;
				default:
					return;
			}
			await react.remove()
		} else action = interaction.customId;

		var resp;
		switch(action) {
			case "edit":
				if(ticket.closed) return;

				var message;
				var data = {
					content: "Choose what to edit.",
					components: [{
						type: 1,
						components: [
							{
								type: 2,
								style: 1,
								label: 'Name',
								emoji: '1️⃣',
								custom_id: 'name'
							},
							{
								type: 2,
								style: 2,
								label: 'Description',
								emoji: '2️⃣',
								custom_id: 'desc'
							},
							{
								type: 2,
								style: 4,
								label: 'Cancel',
								emoji: '❌',
								custom_id: 'cancel'
							},
						]
					}]
				}

				if(interaction) message = await interaction.reply({...data, fetchReply: true});
				else message = await msg.channel.send(data);

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

				var txt;
				switch(choice.name) {
					case "name":
						if(!(await this.bot.utils.checkTicketPerms({
							msg,
							ticket,
							user,
							cfg,
							action: 'rename'
						})))
							return user.send("You do not have permission to edit this property of the ticket.");
							
						txt = "Enter the new name. You have 1 minute to do this. The name must be " + (100-(ticket.hid.length+1)) + " characters or less. Cancel the action by typing `cancel`.";
						if(choice.interaction) await choice.interaction.reply(txt);
						else await msg.channel.send(txt);
						
						resp = (await msg.channel.awaitMessages({filter: m => m.author.id == user.id, max: 1, time: 60000}))?.first();
						if(!resp) return msg.channel.send("ERR: Timed out.");
						if(resp.content.toLowerCase() == "cancel") return msg.channel.send("Action cancelled.");
						if(resp.content.length > (100-(ticket.hid.length+1))) return msg.channel.send("ERR: Name too long. Must be between 1 and " + (100-(ticket.hid.length+1)) +" characters in length.");

						try {
							ticket = await this.bot.stores.tickets.update(msg.channel.guild.id, ticket.hid, {name: resp.content});
							await msg.channel.edit({name: `${ticket.hid}-${resp.content}`});
						} catch(e) {
							console.log(e);
							return msg.channel.send(`Error:\n${e.message || e}`);
						}
						break;
					case "desc":
						if(!(await this.bot.utils.checkTicketPerms({
							msg,
							ticket,
							user,
							cfg,
							action: 'description'
						})))
							return user.send("You do not have permission to edit this property of the ticket.");
							
						txt = "Enter the new description. You have 5 minutes to do this. The description must be 1024 characters or less. Cancel the action by typing `cancel`.";
						if(choice.interaction) await choice.interaction.reply(txt);
						else await msg.channel.send(txt);
						
						resp = (await msg.channel.awaitMessages({filter: m => m.author.id == user.id, max: 1, time: 300000}))?.first();
						if(!resp) return msg.channel.send("ERR: Timed out.");
						if(resp.content.toLowerCase() == "cancel") return msg.channel.send("Action cancelled.");
						if(resp.content.length > 1024) return msg.channel.send("That description is too long. Must be between 1 and 1024 characters in length.");

						try {
							ticket = await this.bot.stores.tickets.update(msg.channel.guild.id, ticket.hid, {description: resp.content});
							await msg.channel.edit({topic: resp.content})
						} catch(e) {
							console.log(e);
							return msg.channel.send(`Error:\n${e.message || e}`);
						}
						break;
				}
				await this.editTicket({
					ticket,
					msg,
					channel: msg.channel
				})

				await msg.channel.send("Ticket updated. Note that the channel itself may take time to update due to ratelimits.");
				break;
			case "close":
				if(!(await this.bot.utils.checkTicketPerms({
					msg,
					ticket,
					user,
					cfg,
					action: 'close'
				})))
					return user.send("You do not have permission to edit this ticket.");

				var message;
				var data = {
					content: "Are you sure you want to close this ticket?\nNOTE: This will remove the ability to send messages; users involved will still see the ticket.",
					components: [{
						type: 1,
						components: [
							{
								type: 2,
								style: 4,
								label: 'Close',
								custom_id: 'confirm'
							},
							{
								type: 2,
								style: 1,
								label: 'Keep open',
								custom_id: 'cancel'
							},
						]
					}]
				};
				if(interaction) message = await interaction.reply({...data, fetchReply: true});
				else message = await msg.channel.send(data);

				var conf = await this.bot.utils.getConfirmation(this.bot, message, user);
				if(conf.msg) {
					if(conf.interaction) await conf.interaction.reply(conf.msg);
					else await msg.channel.send(conf.msg);
					return;
				}
				
				try {
					var channel = await this.bot.channels.fetch(ticket.channel_id);
					for(var i = 0; i < ticket.users.length; i++) {
						await channel.permissionOverwrites.edit(ticket.users[i].id, {
							'VIEW_CHANNEL': true,
							'SEND_MESSAGES': false
						})
					}

					ticket = await this.bot.stores.tickets.update(msg.channel.guild.id, ticket.hid, {closed: true});
					await this.editTicket({
						ticket,
						msg,
						channel
					})
				} catch(e) {
					console.log(e);
					if(conf.interaction) await conf.interaction.reply(`Error:\n${e.message || e}`);
					else await msg.chanel.send(`Error:\n${e.message || e}`);
					return
				}

				if(conf.interaction) await conf.interaction.reply("Ticket closed.");
				else await msg.channel.send("Ticket closed.");
				break;
			case "open":
				if(!(await this.bot.utils.checkTicketPerms({
					msg,
					ticket,
					user,
					cfg,
					action: 'open'
				})))
					return user.send("You do not have permission to edit this ticket.");

				try {
					var channel = await this.bot.channels.fetch(ticket.channel_id);
					for(var i = 0; i < ticket.users.length; i++) {
						await channel.permissionOverwrites.edit(ticket.users[i].id, {
							'VIEW_CHANNEL': true,
							'SEND_MESSAGES': true
						})
					}

					ticket = await this.bot.stores.tickets.update(msg.channel.guild.id, ticket.hid, {closed: false});
					await this.editTicket({
						ticket,
						msg,
						channel
					})
				} catch(e) {
					console.log(e);
					msg.channel.send(`Error:\n${e.message || e}`);
				}

				if(interaction) await interaction.reply("Ticket re-opened.");
				else await msg.channel.send("Ticket re-opened.");
				break;
			case "archive":
				if(!member.permissions.has("MANAGE_CHANNELS"))
					return user.send("You do not have permission to archive this ticket.");

				var message;
				var data = {
					content: "Are you sure you want to archive this ticket?\nNOTE: This will delete the channel and send an archive to you.",
					components: [{
						type: 1,
						components: [
							{
								type: 2,
								style: 3,
								label: "Archive",
								custom_id: 'confirm'
							},
							{
								type: 2,
								style: 2,
								label: 'Cancel',
								custom_id: 'cancel'
							}
						]
					}]
				}
				
				if(interaction) message = await interaction.reply({...data, fetchReply: true});
				else message = await msg.channel.send(data);

				var conf = await this.bot.utils.getConfirmation(this.bot, message, user);
				if(conf.msg) {
					if(conf.interaction) await conf.interaction.reply(conf.msg);
					else msg.channel.send(conf.msg);
					return;
				}

				var results = await this.archive({
					ticket,
					channel: msg.channel,
					msg,
					user,
					cfg
				});
				if(results) await msg.channel.send(results);
				break;
		}
	}
}

module.exports = (bot) => new TicketHandler(bot);