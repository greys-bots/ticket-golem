const { Models: { DataStore, DataObject } } = require("frame");

const KEYS = {
	id: { },
	server_id: { },
	category_id: { patch: true },
	archives_id: { patch: true },
	user_limit: { patch: true },
	ticket_limit: { patch: true },
	mod_only: { patch: true },
	starter: { patch: true }
}

class Config extends DataObject {
	constructor(store, keys, data) {
		super(store, keys, data);
	}
}

class ConfigStore extends DataStore {
	constructor(bot, db) {
		super(bot, db);
	}

	async init() {
		await this.db.query(`
			CREATE TABLE IF NOT EXISTS configs (
				id 				SERIAL PRIMARY KEY,
				server_id		TEXT,
				category_id		TEXT,
				archives_id 	TEXT,
				user_limit 		INTEGER,
				ticket_limit 	INTEGER,
				mod_only 		TEXT[],
				starter 		TEXT
			);
		`);
	}

	async create(data = {}) {
		try {
			await this.db.query(`INSERT INTO configs (
				server_id,
				category_id,
				archives_id,
				user_limit,
				ticket_limit,
				mod_only,
				starter
			) VALUES ($1,$2,$3,$4,$5,$6,$7)
			returning id`,
			[data.server_id, data.category_id, data.archives_id, data.user_limit || 10,
			 data.ticket_limit || 5, data.mod_only, data.starter]);
		} catch(e) {
			console.log(e);
	 		return Promise.reject(e.message);
		}
		
		return await this.getID(c.rows[0].id);
	}

	async get(server) {
		try {
			var data = await this.db.query(`SELECT * FROM configs WHERE server_id = $1`,[server]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}
		
		if(data.rows?.[0]) return new Config(this, KEYS, data.rows[0]);
		else return new Config(this, KEYS, { server_id: server });
	}

	async getID(id) {
		try {
			var data = await this.db.query(`SELECT * FROM configs WHERE id = $1`,[id]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}
		
		if(data.rows?.[0]) return new Config(this, KEYS, data.rows[0]);
		else return undefined;
	}

	async update(id, data = {}) {
		try {
			await this.db.query(`UPDATE configs SET ${Object.keys(data).map((k, i) => k+"=$"+(i+2)).join(",")} WHERE id = $1`,[id, ...Object.values(data)]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}

		return await this.getID(id);
	}

	async delete(id) {
		try {
			await this.db.query(`DELETE FROM configs WHERE id = $1`, [id]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}
		
		return;
	}
}

module.exports = (bot, db) => new ConfigStore(bot, db);