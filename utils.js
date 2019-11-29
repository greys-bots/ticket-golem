module.exports = {
	getConfig: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM configs WHERE server_id=?`,[server],{
				id: Number,
				server_id: String,
				category_id: String
			}, (err, rows)=> {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows[0])
				}
			})
		})
	},
	createConfig: async (bot, server, category, archives) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO configs (server_id, category_id, archives_id) VALUES (?,?,?)`,[server, category, archives], (err, rows)=> {
				if(err) {
					console.log(err);
					res(false);
				} else {
					res(true);
				}
			})
		})
	},
	updateConfig: async (bot, server, key, val) => {
		return new Promise(res => {
			if(val) {
				bot.db.query(`UPDATE configs SET ?=? WHERE server_id=?`,[key, val, server], (err, rows)=> {
					if(err) {
						console.log(err);
						res(false)
					} else {
						res(true)
					}
				})
			} else {
				bot.db.query(`UPDATE configs SET ${key.map((k,i) => (i%2 == 0 ? "?=?" : null)).filter(x => x!=null).join(",")} WHERE server_id=?`,[...key, server], (err, rows)=> {
					if(err) {
						console.log(err);
						res(false)
					} else {
						res(true)
					}
				})
			}
		})
	},
	getTickets: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM tickets WHERE server_id=?`,[server],{
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				first_message: String,
				opener: String,
				users: JSON.parse,
				timestamp: String
			}, async (err, rows)=> {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					var tickets = rows;
					if(!tickets[0]) return res(undefined);

					await bot.asyncForEach(tickets, bot, null, null, async (bot, msg, args, ticket, ind) => {
						var users = [];
						await Promise.all(ticket.users.map(async u => {
							var us = await bot.utils.fetchUser(bot, u);
							users.push(us);
							return Promise.resolve()
						}))
						tickets[ind].userids = tickets[ind].users;
						tickets[ind].users = users;
						var opener = await bot.utils.fetchUser(bot, ticket.opener);
						tickets[ind].opener = opener;
					})

					res(tickets);
				}
			})
		})
	},
	getTicketsByUser: async (bot, server, user) => {
		return new Promise(async res => {
			var tickets = await bot.utils.getTickets(bot, server); //so all the user info is there
			if(!tickets) return res(undefined);
			tickets = tickets.filter(t => t.opener.id == user);
			if(!tickets[0]) res(undefined);
			else res(tickets);
		})
	},
	getTicket: async (bot, server, hid) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM tickets WHERE server_id=? AND hid=?`,[server, hid],{
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				first_message: String,
				opener: String,
				users: JSON.parse,
				timestamp: String
			}, async (err, rows)=> {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					var ticket = rows[0];
					if(!ticket) return res(undefined);

					var users = [];
					await Promise.all(ticket.users.map(async u => {
						var us = await bot.utils.fetchUser(bot, u);
						users.push(us);
						return Promise.resolve()
					}))
					ticket.userids = ticket.users;
					ticket.users = users;
					var opener = await bot.utils.fetchUser(bot, ticket.opener);
					ticket.opener = opener;

					res(ticket);
				}
			})
		})
	},
	getTicketByChannel: async (bot, server, channel) => {
		return new Promise(async res => {
			var tickets = await bot.utils.getTickets(bot, server);
			if(!tickets) return res(undefined);
			var ticket = tickets.find(t => t.channel_id == channel);
			res(ticket);
		})
	},
	createTicket: async (bot, server, user) => {
		return new Promise(async res => {
			var cfg = await bot.utils.getConfig(bot, server);
			if(!cfg) return res({err: "No config registered; please run `hub!ticket config setup` first."});
			var code = bot.utils.genCode(bot.chars);
			var time = new Date();
			try {
				var channel = await bot.createChannel(server, `ticket-${code}`, 0, "", {
					topic: `Ticket ${code}`,
					parentID: cfg.category_id
				})
				channel.editPermission(user.id, 1024, 0, "member");
			} catch(e) {
				console.log(e);
				return res({err: "Couldn't create and/or edit channel; please make sure I have permission and there are channel slots left."});
			}

			try {
				var message = await bot.createMessage(channel.id, {
					content: `Thank you for opening a ticket, ${user.mention}. You can chat with support staff here.`,
					embed: {
						title: "Ticket opened!",
						fields: [
							{name: "Ticket Opener", value: user.mention},
							{name: "Ticket Users", value: user.mention}
						],
						color: 2074412,
						footer: {
							text: "Ticket ID: "+code
						},
						timestamp: time
					}
				})
			} catch(e) {
				console.log(e);
				return res({err: "Could not send message; please make sure I have permission."})
			}

			var scc = await bot.utils.addTicket(bot, code, server, channel.id, message.id, user.id, [user.id], time.toISOString());
			if(scc) res({hid: code});
			else res({err: "Couldn't insert data"})
		})
	},
	addTicket: async (bot, hid, server, channel, message, opener, users, timestamp) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO tickets (hid, server_id, channel_id, first_message, opener, users, timestamp) VALUES (?,?,?,?,?,?,?)`,[hid, server, channel, message, opener, users, timestamp], (err, rows)=> {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(true);
				}
			})
		})
	},
	deleteTicket: async (bot, server, channel) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM tickets WHERE server_id = ? AND channel_id = ?`,[server, channel], (err, rows)=> {
				if(err) {
					console.log(err);
					res(false)
				} else res(true)
			})
		})
	},
	editTicket: async (bot, server, ticket, key, val) => {
		return new Promise(res => {
			bot.db.query(`UPDATE tickets SET ?=? WHERE server_id = ? AND hid = ?`,[key, val, server, ticket], (err, rows)=> {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	addPost: async (bot, server, channel, message) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO posts (server_id, channel_id, message_id) VALUES (?,?,?)`,[server, channel, message], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else res(true)
			})
		})
	},
	getPosts: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM posts WHERE server_id = ?`,[server],{
				id: Number,
				server_id: String,
				channel_id: String,
				message_id: String
			}, (err, rows)=> {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows)
				}
			})
		})
	},
	getPost: async (bot, server, channel, message) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM posts WHERE server_id = ? AND channel_id = ? AND message_id = ?`,[server, channel, message],{
				id: Number,
				server_id: String,
				channel_id: String,
				message_id: String
			}, (err, rows)=> {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows[0])
				}
			})
		})
	},
	deletePost: async (bot, server, channel, message) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM posts WHERE server_id = ? AND channel_id = ? AND message_id = ?`,[server, channel, message], (err, rows)=> {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(true)
				}
			})
		})
	},
	fetchUser: async (bot, id) => {
		return new Promise(async res => {
			try {
				var user = await bot.getRESTUser(id);
			} catch(e) {
				console.log(e);
				var user = undefined;
			}
			res(user);
		})
	},
	genCode: (table, num = 4) =>{
		var codestring="";
		var codenum=0;
		while (codenum<num){
			codestring=codestring+table[Math.floor(Math.random() * (table.length))];
			codenum=codenum+1;
		}
		return codestring;
	},
	genEmbeds: async (bot, arr, genFunc, info = {}, fieldnum) => {
		return new Promise(async res => {
			var embeds = [];
			var current = { embed: {
				title: info.title,
				description: info.description,
				fields: []
			}};
			
			for(let i=0; i<arr.length; i++) {
				if(current.embed.fields.length < (fieldnum || 10)) {
					current.embed.fields.push(await genFunc(arr[i], bot));
				} else {
					embeds.push(current);
					current = { embed: {
						title: info.title,
						description: info.description,
						fields: [await genFunc(arr[i], bot)]
					}};
				}
			}
			embeds.push(current);
			if(embeds.length > 1) {
				for(let i = 0; i < embeds.length; i++)
					embeds[i].embed.title += ` (page ${i+1}/${embeds.length}, ${arr.length} total)`;
			}
			res(embeds);
		})
	}
}