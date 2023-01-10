const { Models: { DataStore, DataObject } } = require('frame');

const KEYS = {
	id: { },
	hid: { },
	server_id: { },
	channel_id: { patch: true },
	first_message: { patch: true },
	opener: { },
	users: { patch: true },
	name: { patch: true },
	description: { patch: true },
	timestamp: { },
	closed: { patch: true }
}

class Ticket extends DataObject {
	constructor(store, keys, data) {
		super(store, keys, data);
	}

	async getUsers() {
		var users = [];
		for(var u of this.users) {
			users.push(await this.store.bot.users.fetch(u));
		}

		if(!this.resolved) this.resolved = {};
		this.resolved.users = users;
		return users;
	}

	async getOpener() {
		var opener = await this.store.bot.users.fetch(this.opener);
		
		if(!this.resolved) this.resolved = {};
		this.resolved.opener = opener;
		return opener;
	}
}

class TicketStore extends DataStore {
	constructor(bot, db) {
		super(bot, db);
	};

	async init() {
		this.bot.on('channelDelete', async (channel) => {
			await this.deleteByChannel(channel.guild.id, channel.id);
		})

		await this.db.query(`
			CREATE TABLE IF NOT EXISTS tickets (
				id 				SERIAL PRIMARY KEY,
				hid 			TEXT,
				server_id 		TEXT,
				channel_id		TEXT,
				first_message 	TEXT,
				opener 			TEXT,
				users 			TEXT[],
				name 			TEXT,
				description 	TEXT,
				timestamp 		TIMESTAMPTZ,
				closed 			BOOLEAN
			);
		`)
	}

	async create(data = {}) {
		try {
			var c = await this.db.query(`INSERT INTO tickets (
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
			) VALUES (find_unique('tickets'), $1,$2,$3,$4,$5,$6,$7,$8,$9)
			RETURNING id`,
			[data.server_id, data.channel_id, data.first_message, data.opener, data.users, data.name,
			 data.description, data.timestamp || new Date(), data.closed ?? false]);
		} catch(e) {
			console.log(e);
	 		return Promise.reject(e.message);
		}
		
		return await this.getID(c.rows[0].id);
	}

	async get(server, hid) {
		try {
			var data = await this.db.query(`SELECT * FROM tickets WHERE server_id = $1 AND hid = $2`, [server, hid]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}
		
		if(data.rows?.[0]) return new Ticket(this, KEYS, data.rows[0]);		
		else return new Ticket(this, KEYS, { server_id: server });
	}

	async getID(id) {
		try {
			var data = await this.db.query(`SELECT * FROM tickets WHERE id = $1`, [id]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}

		if(data.rows?.[0]) return new Ticket(this, KEYS, data.rows[0]);		
		else return new Ticket(this, KEYS, { server_id: server });
	}

	async getByChannel(server, channel) {
		try {
			var data = await this.db.query(`SELECT * FROM tickets WHERE server_id = $1 AND channel_id = $2`, [server, channel]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}
		
		if(data.rows?.[0]) return new Ticket(this, KEYS, data.rows[0]);		
		else return undefined;
	}

	async getAll(server) {
		try {
			var data = await this.db.query(`SELECT * FROM tickets WHERE server_id = $1`, [server]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}
		
		if(data.rows?.[0]) {
			return data.rows.map(r => new Ticket(this, KEYS, r));
		} else return undefined;
	}

	async getByUser(server, opener) {
		try {
			var data = await this.db.query(`SELECT * FROM tickets WHERE server_id = $1 AND opener = $2`, [server, opener]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}

		if(data.rows?.[0]) {
			return data.rows.map(r => new Ticket(this, KEYS, r));
		} else return undefined;
	}

	async search(server, query) {
		try {
			var data = await this.db.query(`SELECT * FROM tickets WHERE server_id = $1`, [server]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
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

			return tickets.map(r => new Ticket(this, KEYS, r));
		} else return undefined;
	}

	async update(id, data = {}) {
		try {
			await this.db.query(`UPDATE tickets SET ${Object.keys(data).map((k, i) => k+"=$"+(i+2)).join(",")} WHERE id = $1`,[id, ...Object.values(data)]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}
		
		return await this.getID(id)
	}

	async delete(id) {
		try {
			await this.db.query(`DELETE FROM tickets WHERE id = $1`,[id]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}
		
		return;
	}

	async deleteAll(server) {
		try {
			await this.db.query(`DELETE FROM tickets WHERE server_id = $1`,[server]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}
		
		return;
	}

	async deleteByChannel(server, channel) {
		try {
			await this.db.query(`DELETE FROM tickets WHERE server_id = $1 AND channel_id = $2`,[server, channel]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}
		
		return;
	}
}

module.exports = (bot, db) => new TicketStore(bot, db);