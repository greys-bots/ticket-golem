const {Collection} = require("discord.js");

class TicketStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

	init() {
		this.bot.on('channelDelete', async (channel) => {
			await this.deleteByChannel(channel.guild.id, channel.id);
		})

		this.bot.on('messageReactionAdd', async (...args) => this.handleReactions(...args))
	}

	async create(server, hid, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO tickets (
					hid,
					server_id,
					channel_id,
					first_message,
					opener,
					users,
					name,
					description,
					timestamp,
					closed
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
				[hid, server, data.channel_id, data.first_message, data.opener, data.users, data.name,
				 data.description, data.timestamp || new Date(), data.closed]);
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res(await this.get(server, hid));
		})
	}

	async index(server, hid, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO tickets (
					hid,
					server_id,
					channel_id,
					first_message,
					opener,
					users,
					name,
					description,
					timestamp,
					closed
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
				[hid, server, data.channel_id, data.first_message, data.opener, data.users, data.name,
				 data.description, data.timestamp || new Date(), data.closed]);
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res();
		})
	}

	async get(server, hid) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM tickets WHERE server_id = $1 AND hid = $2`, [server, hid]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows?.[0]) {
				var ticket = data.rows[0];

				var users = [];
				for(var u of ticket.users) {
					var user = await this.bot.users.fetch(u);
					users.push(user);
				}

				ticket.userids = Object.assign([], ticket.users);
				ticket.users = Object.assign([], users);
				ticket.opener = await this.bot.users.fetch(ticket.opener);

				res(ticket);
			} else res(undefined);
		})
	}

	async getByChannel(server, channel) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM tickets WHERE server_id = $1 AND channel_id = $2`, [server, channel]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows?.[0]) {
				var ticket = data.rows[0];

				var users = [];
				for(var u of ticket.users) {
					var user = await this.bot.users.fetch(u);
					users.push(user);
				}

				ticket.userids = Object.assign([], ticket.users);
				ticket.users = Object.assign([], users);
				ticket.opener = await this.bot.users.fetch(ticket.opener);

				res(ticket);
			} else res(undefined);
		})
	}

	async getAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM tickets WHERE server_id = $1`, [server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows?.[0]) {
				var tickets = data.rows;

				for(var i = 0; i < tickets.length; i++) {
					var users = [];
					for(var u of tickets[i].users) {
						var user = await this.bot.users.fetch(u);
						users.push(user);
					}

					tickets[i].userids = Object.assign([], tickets[i].users);
					tickets[i].users = Object.assign([], users);
					tickets[i].opener = await this.bot.users.fetch(tickets[i].opener);
				}
					

				res(tickets);
			} else res(undefined);
		})
	}

	async getByUser(server, user) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM tickets WHERE server_id = $1 AND opener = $2`, [server, user]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows?.[0]) {
				var tickets = data.rows;

				for(var i = 0; i < tickets.length; i++) {
					var users = [];
					for(var u of tickets[i].users) {
						var user = await this.bot.users.fetch(u);
						users.push(user);
					}

					tickets[i].userids = Object.assign([], tickets[i].users);
					tickets[i].users = Object.assign([], users);
					tickets[i].opener = await this.bot.users.fetch(tickets[i].opener);
				}
					

				res(tickets);
			} else res(undefined);
		})
	}

	async search(server, query) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM tickets WHERE server_id = $1`, [server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows?.[0]) {
				var tickets = data.rows;

				if(query.opener) tickets = tickets.filter(x => x.opener == query.opener);
				if(query.text) {
					tickets = tickets.filter(x => {
						return (x.name || "untitled ticket").toLowerCase().includes(query.text) ||
						       (x.description || "(no description)").toLowerCase().includes(query.text)
					});
				}

				for(var i = 0; i < tickets.length; i++) {
					var users = [];
					for(var u of tickets[i].users) {
						var user = await this.bot.users.fetch(u);
						users.push(user);
					}

					tickets[i].userids = Object.assign([],tickets[i].users);
					tickets[i].users = users;
					tickets[i].opener = await this.bot.users.fetch(tickets[i].opener);
				}
					

				res(tickets);
			} else res(undefined);
		})
	}

	async update(server, hid, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE tickets SET ${Object.keys(data).map((k, i) => k+"=$"+(i+3)).join(",")} WHERE server_id = $1 AND hid = $2`,[server, hid, ...Object.values(data)]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res(await this.get(server, hid));
		})
	}

	async delete(server, hid) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM tickets WHERE server_id = $1 AND hid = $2`,[server, hid]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res();
		})
	}

	async deleteAll(server) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM tickets WHERE server_id = $1`,[server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res();
		})
	}

	async deleteByChannel(server, channel) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM tickets WHERE server_id = $1 AND channel_id = $2`,[server, channel]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res();
		})
	}

	async handleReactions(react, user) {
		return new Promise(async (res, rej) => {
			if(this.bot.user.id == user.id) return res();
			if(user.bot) return res();

			try {
				if(react.partial) react = await react.fetch();
				if(react.message.partial) var msg = await react.message.fetch();
				else var msg = react.message;
			} catch(e) {
				if(!e.message.toLowerCase().includes("unknown message")) console.log(e);
				return rej(e.message);
			}

			if(!msg.channel.guild) return res();

			var ticket = await this.getByChannel(msg.guild.id, msg.channel.id);
			if(!ticket || ticket.first_message != msg.id) return res();

			var cfg = await this.bot.stores.configs.get(msg.guild.id);
			if(!cfg) return res();

			var member = msg.guild.member(user);

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
					if((cfg.mod_only?.find(cmd => ['rename', 'description'].includes(cmd)) && !msg.guild.member(user.id).permissions.has("MANAGE_CHANNELS")) ||
						(msg.author.id != ticket.opener.id) && !member.permissions.has("MANAGE_CHANNELS"))
							return user.send("You do not have permission to edit this ticket.");

					var message = await msg.channel.send({embed: {
						description: "Choose what to edit.",
						fields: [
							{name: "1️⃣ Name", value: "Change the ticket name."},
							{name: "2️⃣ Description", value: "Change the ticket description."},
							{name: "❌ Cancel", value: "Cancel editing."}
						],
						footer: {
							text: "Use reactions or type 'one,' 'two,' or 'cancel' to make your choice."
						}
					}});
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
							resp = (await msg.channel.awaitMessages(m => m.author.id == user.id, {max: 1, time: 60000}))?.first();
							if(!resp) return msg.channel.send("ERR: Timed out.");
							if(resp.content.toLowerCase() == "cancel") return msg.channel.send("Action cancelled.");
							if(resp.content.length > (100-(ticket.hid.length+1))) return msg.channel.send("ERR: Name too long. Must be between 1 and " + (100-(ticket.hid.length+1)) +" characters in length.");

							try {
								await this.update(msg.channel.guild.id, ticket.hid, {name: resp.content});
								embed.title = resp.content;
								await msg.edit({embed: embed});
								await msg.channel.send("Ticket updated. Note that the channel itself may take time to update due to ratelimits.");
								await msg.channel.edit({name: `${ticket.hid}-${resp.content}`});
							} catch(e) {
								console.log(e);
								return msg.channel.send(`Error:\n${e.message || e}`);
							}
							break;
						case "desc": 
							await msg.channel.send("Enter the new description. You have 5 minutes to do this. The description must be 1024 characters or less. Cancel the action by typing `cancel`.");
							resp = (await msg.channel.awaitMessages(m => m.author.id == user.id, {max: 1, time: 300000}))?.first();
							if(!resp) return msg.channel.send("ERR: Timed out.");
							if(resp.content.toLowerCase() == "cancel") return msg.channel.send("Action cancelled.");
							if(resp.content.length > 1024) return msg.channel.send("That description is too long. Must be between 1 and 1024 characters in length.");

							try {
								await this.update(msg.channel.guild.id, ticket.hid, {name: resp.content});
								embed.description = resp.content;
								await msg.edit({embed: embed});
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
					if((cfg.mod_only?.includes('close') && !msg.guild.member(user.id).permissions.has("MANAGE_CHANNELS")) ||
						(msg.author.id != ticket.opener.id) && !msg.guild.member(user.id).permissions.has("MANAGE_CHANNELS"))
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
						await msg.edit({embed: embed});
						for(var i = 0; i < ticket.users.length; i++) {
							await channel.updateOverwrite(ticket.users[i].id, {
								'VIEW_CHANNEL': true,
								'SEND_MESSAGES': false
							})
						}

						await this.update(msg.channel.guild.id, ticket.hid, {closed: true});
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
					if((cfg.mod_only?.find(cmd => ["open", "reopen"].includes(cmd)) && !msg.guild.member(user.id).permissions.has("MANAGE_CHANNELS")) ||
						(msg.author.id != ticket.opener.id) && !msg.guild.member(user.id).permissions.has("MANAGE_CHANNELS"))
							return user.send("You do not have permission to open this ticket.");

					embed.color = parseInt("55aa55", 16);
					embed.title = ticket.name || "Untitled Ticket";
					embed.footer = {text: `Ticket ID: ${ticket.hid}`}

					try {
						var channel = await this.bot.channels.fetch(ticket.channel_id);
						await msg.edit({embed: embed});
						for(var i = 0; i < ticket.users.length; i++) {
							await channel.updateOverwrite(ticket.users[i].id, {
								'VIEW_CHANNEL': true,
								'SEND_MESSAGES': true
							})
						}

						await this.update(msg.channel.guild.id, ticket.hid, {closed: false});
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
					if(!msg.guild.member(user.id).permissions.has("MANAGE_CHANNELS"))
						return user.send("You do not have permission to archive this ticket.");

					var message = await msg.channel.send("Are you sure you want to archive this ticket?\nNOTE: This will delete the channel and send an archive to you.");
					["✅","❌"].forEach(r => message.react(r));

					var confirmation = await this.bot.utils.getConfirmation(this.bot, message, user);
					if(confirmation.msg) return msg.channel.send(confirmation.msg);
					
					var results = await this.bot.commands.get('archive').execute(this.bot, message, []);
					if(results) await msg.channel.send(results);
					break;
			}

			res();
		})
	}
}

module.exports = (bot, db) => new TicketStore(bot, db);