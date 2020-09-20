const {Collection} = require("discord.js");

class PostStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

	init() {
		this.bot.on('channelDelete', async (channel) => {
			await this.deleteByChannel(channel.guild.id, channel.id);
		})

		this.bot.on('messageDelete', async (message) => {
			await this.delete(message.channel.guild.id, message.channel.id, message.id);
		})

		this.bot.on('messageReactionAdd', async (...args) => this.handleReactions(...args))
	}

	async create(server, channel, message) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO posts (
					server_id,
					channel_id,
					message_id
				) VALUES ($1,$2,$3)`,
				[server, channel, message]);
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res(await this.get(server, channel, message));
		})
	}

	async index(server, channel, message) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO posts (
					server_id,
					channel_id,
					message_id
				) VALUES ($1,$2,$3)`,
				[server, channel, message]);
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res();
		})
	}

	async get(server, channel, message, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			if(!forceUpdate) {
				var post = super.get(`${server}-${channel}-${message}`);
				if(post) return res(post);
			}
			
			try {
				var data = await this.db.query(`SELECT * FROM posts WHERE server_id = $1 AND channel_id = $2 AND message_id = $3`, [server, channel, message]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows?.[0]) {
				this.set(`${server}-${channel}-${message}`, data.rows[0])
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM posts WHERE server_id = $1`, [server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows?.[0]) {
				res(data.rows)
			} else res(undefined);
		})
	}

	async update(server, channel, message, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE posts SET ${Object.keys(data).map((k, i) => k+"=$"+(i+4)).join(",")} WHERE server_id = $1 AND channel_id = $2 AND message_id = $3`,[server, channel, message, ...Object.values(data)]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			res(await this.get(server, true));
		})
	}

	async delete(server, channel, message) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM posts WHERE server_id = $1 AND channel_id = $2 AND message_id = $3`,[server, channel, message]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			super.delete(`${server}-${channel}-${message}`);
			res();
		})
	}

	async deleteAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var posts = await this.getAll(server);
				await this.db.query(`DELETE FROM posts WHERE server_id = $1`,[server]);
				for(var post of posts) super.delete(`${server}-${post.channel_id}-${post.message_id}`);
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
				var posts = await this.getAll(server);
				posts = posts.filter(p => p.channel_id == channel);
				await this.db.query(`DELETE FROM posts WHERE server_id = $1 AND channel_id = $2`,[server, channel]);
				for(var post of posts) super.delete(`${server}-${channel_id}-${post.message_id}`);
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
			if(react.emoji.name != "✅") return res();

			try {
				if(react.partial) react = await react.fetch();
				if(react.message.partial) var msg = await msg.fetch();
				else var msg = react.message;
			} catch(e) {
				if(!e.message.toLowerCase().includes("unknown message")) console.log(e);
				return rej(e.message);
			}

			if(!msg.channel.guild) return res();

			var post = await this.get(msg.guild.id, msg.channel.id, msg.id);
			if(!post) return res();

			await react.users.remove(user.id);

			var cfg = await this.bot.stores.configs.get(msg.guild.id);
			if(!cfg) {
				await user.send("That server is missing a ticket category setup. Please alert the mods.");
				return res();
			}

			var open = (await this.bot.stores.tickets.getByUser(msg.guild.id, user.id))?.filter(x => x.closed == false);
			if(open?.length >= cfg.ticket_limit) {
				await user.send(`You already have ${open.length} ticket(s) open in that server. The current limit is ${cfg.ticket_limit}.`);
				return res();
			}

			var code = this.bot.utils.genCode(this.bot.chars);
			var time = new Date();

			try {
				var channel = await msg.guild.channels.create(`ticket-${code}`, {
					topic: `Ticket ${code}`,
					parent: cfg.category_id
				})
				await channel.lockPermissions(); //get perms from parent category
				await channel.updateOverwrite(user.id, {
					'VIEW_CHANNEL': true,
					'SEND_MESSAGES': true
				})


				var message = await channel.send({
					content: `Thank you for opening a ticket, ${user}. You can chat with support staff here.\nReact with :pencil2: to edit this ticket, or :x: to close it. If the ticket is closed, react with :white_check_mark: to re-open it.`,
					embed: {
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
					}
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
				return rej(e.message || e);
			}

			res();
		})
	}
}

module.exports = (bot, db) => new PostStore(bot, db);