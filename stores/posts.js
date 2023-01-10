const { Models: { DataStore, DataObject } } = require("frame");

const KEYS = {
	id: { },
	server_id: { },
	channel_id: { },
	message_id: { }
}

class Post extends DataObject {
	constructor(store, keys, data) {
		super(store, keys, data)
	}
}

class PostStore extends DataStore {
	constructor(bot, db) {
		super(bot, db);
	}

	async init() {
		this.bot.on('channelDelete', async (channel) => {
			await this.deleteByChannel(channel.guild.id, channel.id);
		})

		this.bot.on('messageDelete', async (message) => {
			await this.deleteByMessage(message.channel.guild.id, message.channel.id, message.id);
		})

		await this.db.query(`
			CREATE TABLE IF NOT EXISTS posts (
				id			SERIAL PRIMARY KEY,
				server_id	TEXT,
				channel_id	TEXT,
				message_id	TEXT
			);
		`)
	}

	async create(data = { }) {
		try {
			var c = await this.db.query(`INSERT INTO posts (
				server_id,
				channel_id,
				message_id
			) VALUES ($1,$2,$3)
			returning *`,
			[data.server_id, data.channel_id, data.message_id]);
		} catch(e) {
			console.log(e);
	 		return Promise.reject(e.message);
		}
		
		return await this.getID(c.rows[0].id);
	}

	async get(server, channel, message) {
		try {
			var data = await this.db.query(`SELECT * FROM posts WHERE server_id = $1 AND channel_id = $2 AND message_id = $3`, [server, channel, message]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}
		
		if(data.rows?.[0]) return new Post(this, KEYS, data.rows[0]);
		else return undefined;
	}

	async getID(id) {
		try {
			var data = await this.db.query(`SELECT * FROM posts WHERE id = $1`, [id]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}
		
		if(data.rows?.[0]) return new Post(this, KEYS, data.rows[0]);
		else return undefined;
	}

	async getAll(server) {
		try {
			var data = await this.db.query(`SELECT * FROM posts WHERE server_id = $1`, [server]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}
		
		if(data.rows?.[0]) return data.rows.map(r => new Post(this, KEYS, r));
		else return undefined;
	}

	async update(id, data = {}) {
		try {
			await this.db.query(`UPDATE posts SET ${Object.keys(data).map((k, i) => k+"=$"+(i+2)).join(",")} WHERE id = $1`,[id, ...Object.values(data)]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}

		return await this.getID(id);
	}

	async delete(id) {
		try {
			await this.db.query(`DELETE FROM posts WHERE id = $1`,[id]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}

		return;
	}

	async deleteAll(server) {
		try {
			await this.db.query(`DELETE FROM posts WHERE server_id = $1`,[server]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}
		
		return;
	}

	async deleteByChannel(server, channel) {
		try {
			await this.db.query(`DELETE FROM posts WHERE server_id = $1 AND channel_id = $2`,[server, channel]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}
		
		return;
	}

	async deleteByMessage(server, channel, message) {
		try {
			await this.db.query(`DELETE FROM posts WHERE server_id = $1 AND channel_id = $2 AND message_id = $3`,[server, channel, message]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}
		
		return;
	}
}

module.exports = (bot, db) => new PostStore(bot, db);