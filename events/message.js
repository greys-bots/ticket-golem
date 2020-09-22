const WELCOMES = [
	"Of course.",
	"Don't mention it.",
	"You're very welcome."
];

module.exports = async (msg, bot)=>{
	if(msg.author.bot) return;
	if(!new RegExp(`^(${bot.prefix})`,"i").test(msg.content.toLowerCase())) {
		var thanks = msg.content.match(/^(thanks? ?(you)?|ty),? ?(tg|ticket golem)/i);
		if(thanks) return await msg.channel.send(WELCOMES[Math.floor(Math.random() * WELCOMES.length)]);
		return;
	}
	var log = [
		`Guild: ${msg.guild ? msg.guild.name : "DMs"} (${msg.guild ? msg.guild.id : msg.channel.id})`,
		`User: ${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`,
		`Message: ${msg.content}`,
		`--------------------`
	];
	let args = msg.content.replace(new RegExp(`^(${bot.prefix})`,"i"), "").split(" ");
	if(!args[0]) args.shift();
	if(!args[0]) return msg.channel.send("Hello there.");
	var config = {};
	var usages = {whitelist: [], blacklist: []};
	if(msg.guild) config = await bot.stores.configs.get(msg.guild.id);

	let {command, nargs} = await bot.parseCommand(bot, msg, args);
	if(!command) {
		await msg.channel.send("Command not found.");
		log.push('- Command Not Found -')
		console.log(log.join("\r\n"));
		bot.writeLog(log.join("\r\n"));
		return;
	}

	if(!msg.guild && command.guildOnly) {
		console.log("- Command is guild only -")
		return await msg.channel.send("That command can only be used in guilds.");
	}
	
	var check = await bot.utils.checkPermissions(bot, msg, command);
	if(!check) {
		console.log("- Missing Permissions -")
		return await msg.channel.send('You do not have permission to use that command.');
	}
	
	try {
		var result = await command.execute(bot, msg, nargs, config);
	} catch(e) {
		console.log(e.stack);
		log.push(`Error: ${e.stack}`);
		log.push(`--------------------`);
		await msg.channel.send('Error:\n'+(e.message || e))
	}
	console.log(log.join('\r\n'));
	bot.writeLog(log.join('\r\n'));
	
	if(!result) return;
	if(typeof result == "object" && result[0]) { //embeds
		var message = await msg.channel.send(result[0]);
		if(result[1]) {
			if(!bot.menus) bot.menus = {};
			bot.menus[message.id] = {
				user: msg.author.id,
				data: result,
				index: 0,
				timeout: setTimeout(()=> {
					if(!bot.menus[message.id]) return;
					try {
						message.reactions.removeAll();
					} catch(e) {
						console.log(e);
					}
					delete bot.menus[message.id];
				}, 900000),
				execute: bot.utils.paginateEmbeds
			};
			["⬅️", "➡️", "⏹️"].forEach(r => message.react(r));
		}
	} else await msg.channel.send(result);
}
