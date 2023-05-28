const { AttachmentBuilder } = require("discord.js");
const { starterVars: KEYS } = require('../extras');

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

	formatTime(date, format = 'F') {
		return `<t:${Math.floor(date.getTime() / 1000)}:${format}>`
	}

	async handleReactions(react, user) {
		if(user.bot) return;

		try {
			if(react.partial) react = await react.fetch();
			if(react.message.partial) var msg = await react.message.fetch();
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
		var { msg, user, cfg, name, description } = ctx;

		var time = new Date();

		try {
			var tk = await this.bot.stores.tickets.create({
				server_id: msg.guild.id,
				opener: user.id,
				users: [user.id],
				timestamp: time,
				name,
				description
			});
			var code = tk.hid;
			var n = name ? `${code}-${name}` : `ticket-${code}`;

			var channel = await msg.guild.channels.create({
				name: n,
				topic: description ?? `Ticket ${code}`,
				parent: cfg.category_id
			})
			await channel.lockPermissions(); //get perms from parent category
			await channel.permissionOverwrites.create(user.id, {
				'ViewChannel': true,
				'SendMessages': true
			})
			tk.channel_id = channel.id;

			var mdata = {
				embeds: [{
					title: name ?? "Untitled Ticket",
					description: description ?? "(no description)",
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
			}

			if(cfg.starter) {
				var tmp = cfg.starter;
				for(var k of Object.keys(KEYS)) {
					tmp = tmp.replace(k, KEYS[k].repl({
						user,
						guild: msg.guild
					}))
				}

				mdata.content = tmp;
			} else {
				mdata.content =
					`Thank you for opening a ticket, ${user}. ` +
					`You can chat with support staff here.\n` +
					`React or interact below for options.`;
			}

			var message = await channel.send(mdata)
			message.pin();
			tk.first_message = message.id;
			await tk.save();
		} catch(e) {
			console.log(e);
			await tk.delete();
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
					.map(u => `<@${u}>`)
					.join("\n") +
					`\nand ${ticket.users.length - 20} more`;
			} else users = ticket.users.map(u => `<@${u}>`).join("\n");

			await message.edit({
				embeds: [{
					title: ticket.name ?? "Untitled Ticket",
					description: ticket.description ?? "(no description)",
					fields: [
						{
							name: "Ticket Opener",
							value: `<@${ticket.opener}>`
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

			await channel.edit({
				name: ticket.name ? `${ticket.hid}-${ticket.name}` : `ticket-${ticket.hid}`,
				topic: ticket.description ?? `Ticket ${ticket.hid}`
			})
		} catch(e) {
			console.log(e);
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
		await ticket.getUsers();
		await ticket.getOpener();

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

			var file = new AttachmentBuilder(
				Buffer.from([
					`Ticket name: ${ticket.name || "Untitled Ticket"}\r\n`,
					`Ticket description: ${ticket.description || "(no description)"}\r\n`,
					`Ticket opened: ${this.bot.formatTime(new Date(ticket.timestamp))}\r\n`,
					`Ticket opener: ${ticket.resolved.opener.username}#${ticket.resolved.opener.discriminator} (${ticket.resolved.opener.id})\r\n`,
					`Users involved:\r\n${ticket.resolved.users.map(u => `${u.username}#${u.discriminator} (${u.id})`).join("\r\n")}`,"\r\n------\r\n"
				].join("")+data.reverse().join("\r\n------\r\n")),
				{name: channel.name+".txt"}
			)

			var date = new Date();

			var embed = {
				title: "Ticket Archive",
				fields: [
					{name: "Ticket name", value: ticket.name || "Untitled Ticket"},
					{name: "Ticket description", value: ticket.description || "(no description)"},
					{name: "Time opened", value: this.formatTime(new Date(ticket.timestamp))},
					{name: "Opener", value: `${ticket.resolved.opener.username}#${ticket.resolved.opener.discriminator} (${ticket.resolved.opener.id})`},
					{name: "Users involved", value: ticket.resolved.users.map(u => `${u.username}#${u.discriminator} (${u.id})`).join("\n")},
					{name: "Time closed", value: this.formatTime(date)}
				],
				timestamp: date.toISOString(),
				color: 5821280
			};

			var c;
			if(!cfg?.archives_id) {
				await user.send({embeds: [embed], files: [file]})
			} else {
				c = await channel.guild.channels.fetch(cfg.archives_id);
				if(!c) return "Couldn't find your archives channel; please reconfigure it.";
				
				await c.send({embeds: [embed], files: [file]});
			}
				
			await channel.delete("Ticket archived.");
			await ticket.delete();
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
				{name: "Ticket Opener", value: `<@${ticket.opener}>`},
				{name: "TIcket Users", value: ticket.users.map(u => `<@${u}>`).join("\n")},
			],
			color: 2074412,
			footer: {
				text: "Ticket ID: "+ticket.hid
			},
			timestamp: ticket.timestamp
		}

		var action = interaction.customId;

		var resp;
		switch(action) {
			case "edit":
				if(ticket.closed) return;
				var nchk = await this.bot.utils.checkTicketPerms({
					msg,
					ticket,
					user,
					cfg,
					action: 'rename'
				});
				var dchk = await this.bot.utils.checkTicketPerms({
					msg,
					ticket,
					user,
					cfg,
					action: 'description'
				})
				if(!nchk && !dchk) return await interaction.reply({
					content: "You do not have permission to edit this ticket.",
					ephemeral: true
				});

				var message;
				var mdata = {
					title: "Edit ticket",
					custom_id: `question-add-${ticket.hid}`,
					components: [ ]
				}

				if(nchk) mdata.components.push({
					type: 1,
					components: [{
						type: 4,
						custom_id: 'name',
						label: "Ticket name",
						style: 1,
						max_length: 90,
						placeholder: (
							"Need help with the bot"
						),
						value: ticket.name,
						required: true
					}]
				});

				if(dchk) mdata.components.push({
					type: 1,
					components: [{
						type: 4,
						custom_id: 'description',
						label: "Ticket description",
						style: 2,
						max_length: 2000,
						placeholder: (
							"The thing I need help with is..."
						),
						value: ticket.description,
						required: true
					}]
				});

				var m = await this.bot.utils.awaitModal(interaction, mdata, user, false, 300000)
				if(!m) return await m.followUp("No data received.");

				var name = ticket.name;
				var desc = ticket.description;
				if(nchk) name = m.fields.getField('name').value.trim();
				if(dchk) desc = m.fields.getField('description').value.trim();

				ticket.name = name;
				ticket.description = desc;
				await ticket.save();

				await this.editTicket({
					ticket,
					msg,
					channel: msg.channel
				})

				await m.followUp("Ticket updated. Note that the channel itself may take time to update due to ratelimits.");
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
								custom_id: 'yes'
							},
							{
								type: 2,
								style: 1,
								label: 'Keep open',
								custom_id: 'no'
							},
						]
					}]
				};
				if(interaction) message = await interaction.reply({...data, fetchReply: true});
				else message = await msg.channel.send(data);

				var conf = await this.bot.utils.getConfirmation(this.bot, message, user);
				if(conf.msg) {
					if(interaction) await interaction.followUp(conf.msg);
					else await msg.channel.send(conf.msg);
					return;
				}
				
				try {
					var channel = await this.bot.channels.fetch(ticket.channel_id);
					for(var i = 0; i < ticket.users.length; i++) {
						await channel.permissionOverwrites.create(ticket.users[i], {
							'ViewChannel': true,
							'SendMessages': false
						})
					}

					ticket.closed = true;
					await ticket.save();
					await this.editTicket({
						ticket,
						msg,
						channel
					})
				} catch(e) {
					console.log(e);
					if(interaction) await interaction.followUp(`Error:\n${e.message || e}`);
					else await msg.chanel.send(`Error:\n${e.message || e}`);
					return
				}

				if(interaction) await interaction.followUp("Ticket closed.");
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
						await channel.permissionOverwrites.create(ticket.users[i], {
							'ViewChannel': true,
							'SendMessages': true
						})
					}

					ticket.closed = false;
					await ticket.save();
					await this.editTicket({
						ticket,
						msg,
						channel
					})
				} catch(e) {
					console.log(e);
					msg.channel.send(`Error:\n${e.message || e}`);
				}

				if(interaction) await interaction.followUp("Ticket re-opened.");
				else await msg.channel.send("Ticket re-opened.");
				break;
			case "archive":
				if(!member.permissions.has("ManageChannels"))
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
								custom_id: 'yes'
							},
							{
								type: 2,
								style: 2,
								label: 'Cancel',
								custom_id: 'no'
							}
						]
					}]
				}
				
				if(interaction) message = await interaction.reply({...data, fetchReply: true});
				else message = await msg.channel.send(data);

				var conf = await this.bot.utils.getConfirmation(this.bot, message, user);
				if(conf.msg) {
					if(interaction) await interaction.followUp(conf.msg);
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