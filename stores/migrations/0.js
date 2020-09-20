//migrates data from sqlite to postgres

var fs = require('fs');
var dblite = require('dblite');

//uncomment if you put sqlite tools in the root folder
// dblite.bin = `${__dirname}/../../sqlite/sqlite3.exe`;
module.exports = async (bot, db) => {
	if(!fs.existsSync(`${__dirname}/../../data.sqlite`)) return Promise.resolve();

	var old = dblite(`${__dirname}/../../data.sqlite`, '-header');

	old.query(`SELECT * FROM configs;`, {
		id: Number,
		server_id: String,
		category_id: String,
		archives_id: String,
		user_limit: Number,
		ticket_limit: Number,
		mod_only: val => val ? JSON.parse(val) : null
	}, async (err, rows) => {
		if(err) throw err;

		for(var row of rows) {
			console.log('inserting config id '+row.id);
			await bot.stores.configs.index(row.server_id, row);
		}
	})

	old.query(`SELECT * FROM posts;`, {
		id: Number,
		server_id: String,
		channel_id: String,
		message_id: String
	}, async (err, rows) => {
		if(err) throw err;

		for(var row of rows) {
			console.log('inserting post id '+row.id);
			await bot.stores.posts.index(row.server_id, row.channel_id, row.message_id);
		}
	})

	old.query(`SELECT * FROM tickets;`, {
		id: Number,
		hid: String,
		server_id: String,
		channel_id: String,
		first_message: String,
		opener: String,
		users: val => val ? JSON.parse(val) : null,
		name: String,
		description: String,
		timestamp: Date,
		closed: Boolean
	}, async (err, rows) => {
		if(err) throw err;

		for(var row of rows) {
			console.log('inserting ticket id '+row.id);
			await bot.stores.tickets.index(row.server_id, row.hid, row);
		}
	})

	var version = (await db.query(`SELECT * FROM extras WHERE key = 'version'`)).rows[0]?.val;
	if(!version) await db.query(`INSERT INTO extras (key, val) VALUES ('version', 0)`);
	else await db.query(`UPDATE extras SET val = 0 WHERE key = 'version'`);

	return Promise.resolve();
}