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
				 data.description, data.timestamp || new Date(), data.closed ?? false]);
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
				 data.description, data.timestamp || new Date(), data.closed ?? false]);
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

	async getByUser(server, opener) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM tickets WHERE server_id = $1 AND opener = $2`, [server, opener]);
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
				if(query.status) tickets = tickets.filter(x => x.closed == (query.status == "open" ? false : true));

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
}

module.exports = (bot, db) => new TicketStore(bot, db);