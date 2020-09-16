module.exports = {
	//configs
	getConfig: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM configs WHERE server_id=?`,[server],{
				id: Number,
				server_id: String,
				category_id: String,
				user_limit: Number,
				ticket_limit: Number,
				mod_only: val => val ? JSON.parse(val) : undefined
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
	updateConfig: async (bot, server, data) => {
		var config = await bot.utils.getConfig(bot, server);
		return new Promise(res => {
			if(config) {
				bot.db.query(`UPDATE configs SET ${Object.keys(data).map((k) => k+"=?").join(",")} WHERE server_id=?`,[...Object.values(data), server], (err, rows)=> {
					if(err) {
						console.log(err);
						res(false)
					} else {
						res(true)
					}
				})
			} else {
				bot.db.query(`INSERT INTO configs (server_id, category_id, archives_id, user_limit, ticket_limit, mod_only) VALUES (?,?,?,?,?,?)`,
							 [server, data.category_id, data.archives_id, data.user_limit, data.ticket_limit, data.mod_only || []], (err, rows)=> {
					if(err) {
						console.log(err);
						res(false);
					} else {
						res(true);
					}
				})
			}
		})
	},

	//tickets
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
				name: String,
				description: String,
				timestamp: String,
				closed: Boolean
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
			else {
				tickets.count = tickets.filter(t => !t.closed).length;
				res(tickets);
			}
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
				name: String,
				description: String,
				timestamp: String,
				closed: Boolean
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
		return new Promise(res => {
			bot.db.query(`SELECT * FROM tickets WHERE server_id=? AND channel_id=?`,[server, channel],{
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				first_message: String,
				opener: String,
				users: JSON.parse,
				name: String,
				description: String,
				timestamp: String,
				closed: Boolean
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
	getTicketByFirstMessage: async (bot, server, channel, message) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM tickets WHERE server_id=? AND channel_id=? AND first_message=?`,[server, channel, message],{
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				first_message: String,
				opener: String,
				users: JSON.parse,
				name: String,
				description: String,
				timestamp: String,
				closed: Boolean
			}, async (err, rows)=> {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					var ticket = rows[0];
					if(!ticket) return res(undefined);

					var users = [];
					for(var i = 0; i < ticket.users.length; i++) {
						var us = await bot.utils.fetchUser(bot, ticket.users[i]);
						users.push(us);
					}

					ticket.userids = ticket.users;
					ticket.users = users;
					var opener = await bot.utils.fetchUser(bot, ticket.opener);
					ticket.opener = opener;

					res(ticket);
				}
			})
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
					content: `Thank you for opening a ticket, ${user.mention}. You can chat with support staff here.\nReact with :pencil2: to edit this ticket, or :x: to close it. If the ticket is closed, react with :white_check_mark: to re-open it.`,
					embed: {
						title: "Untitled Ticket",
						description: "(no description)",
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

			try {
				message.pin();
			} catch(e) {
				console.log(e);
				channel.createMessage("Could not pin the above message; please make sure I have permission. Also, it's preferable that you pin it yourself now.");
			}

			try {
				["\u270f","❌", "✅"].forEach(r => message.addReaction(r));
			} catch(e) {
				console.log(e);
				bot.createMessage(channel.id, "Could not add one or more reaction to the ticket post. You will have to manually react to it if you wish to edit or close this ticket.")
			}

			var scc = await bot.utils.addTicket(bot, code, server, channel.id, message.id, user.id, [user.id], time.toISOString());
			if(scc) res({hid: code});
			else res({err: "Couldn't insert data"})
		})
	},
	addTicket: async (bot, hid, server, channel, message, opener, users, timestamp) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO tickets (hid, server_id, channel_id, first_message, opener, users, name, description, timestamp, closed) VALUES (?,?,?,?,?,?,?,?,?,?)`,
						 [hid, server, channel, message, opener, users, "Untitled Ticket", "(no description)", timestamp, 0], (err, rows)=> {
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

	//posts
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

	//general utils
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
	paginateEmbeds: async function(bot, m, reaction) {
		switch(reaction.emoji.name) {
			case "⬅️":
				if(this.index == 0) {
					this.index = this.data.length-1;
				} else {
					this.index -= 1;
				}
				await m.edit(this.data[this.index]);
				await reaction.users.remove(this.user)
				bot.menus[m.id] = this;
				break;
			case "➡️":
				if(this.index == this.data.length-1) {
					this.index = 0;
				} else {
					this.index += 1;
				}
				await m.edit(this.data[this.index]);
				await reaction.users.remove(this.user)
				bot.menus[m.id] = this;
				break;
			case "⏹️":
				await m.delete();
				delete bot.menus[m.id];
				break;
		}
	},
	checkPermissions: async (bot, msg, cmd)=>{
		return new Promise((res)=> {
			if(cmd.permissions) res(msg.member.permissions.has(cmd.permissions))
			else res(true);
		})
	},
	isDisabled: async (bot, srv, cmd, name) =>{
		return new Promise(async res=>{
			var cfg = await bot.stores.configs.get(srv);
			if(!cfg?.mod_only?.[0]) return res(false);
			let dlist = cfg.mod_only;
			name = name.split(" ");
			if(dlist && (dlist.includes(name[0]) || dlist.includes(name.join(" ")))) {
				res(true);
			} else {
				res(false);
			}
		})
	}


	//search
	searchTickets: async (bot, server, query) => {
		var tickets = await bot.utils.getTickets(bot, server);
		return new Promise(res => {
			if(!tickets || !tickets[0]) return res(undefined);
			res(tickets.filter(r => r.name.toLowerCase().includes(query) || r.description.toLowerCase().includes(query)));
		})
	},
	searchTicketsFromUser: async (bot, server, id, query) => {
		var tickets = await bot.utils.getTicketsByUser(bot, server, id);
		return new Promise(res => {
			if(!tickets || !tickets[0]) return res(undefined);
			res(tickets.filter(r => r.name.toLowerCase().includes(query) || r.description.toLowerCase().includes(query)));
		})
	}
}