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
}

module.exports = (bot, db) => new PostStore(bot, db);