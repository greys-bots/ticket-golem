var fs = require('fs');
var {Pool} = require('pg');

module.exports = async (bot) => {
	const db = new Pool();

	await db.query(`
		CREATE TABLE IF NOT EXISTS configs (
			id 				SERIAL PRIMARY KEY,
			server_id		TEXT,
			category_id		TEXT,
			archives_id 	TEXT,
			user_limit 		INTEGER,
			ticket_limit 	INTEGER,
			mod_only 		TEXT[]
		);

		CREATE TABLE IF NOT EXISTS extras (
			id 				SERIAL PRIMARY KEY,
			key 			TEXT,
			val 			TEXT
		);

		CREATE TABLE IF NOT EXISTS posts (
			id			SERIAL PRIMARY KEY,
			server_id	TEXT,
			channel_id	TEXT,
			message_id	TEXT
		);

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
	`);

	bot.stores = {};
	var files = fs.readdirSync(__dirname);
	for(var file of files) {
		if(!file.endsWith('.js') || ["__db.js"].includes(file)) continue;
		var tmpname = file.replace(/store\.js/i, "");
		var name =  tmpname[0].toLowerCase() + 
				   (tmpname.endsWith("y") ?
				   	tmpname.slice(1, tmpname.length-1) + "ies" :
				    tmpname.slice(1) + "s");

		bot.stores[name] = require(__dirname+'/'+file)(bot, db);
		if(bot.stores[name].init) bot.stores[name].init();
	}

	files = fs.readdirSync(__dirname + '/migrations');
	var version = (await db.query(`SELECT * FROM extras WHERE key = 'version'`)).rows[0]?.val || -1;
	if(files.length > version + 1) {
		for(var i = version; i < files.length; i++) {
			if(!files[i]) continue;
			var migration = require(`${__dirname}/migrations/${files[i]}`);
			await migration(bot, db);
		}
	}

	return db;
}