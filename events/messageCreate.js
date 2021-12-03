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
	if(msg.content.toLowerCase() == bot.prefix) return msg.channel.send("Hello there.");

	var log = [
		`Guild: ${msg.guild ? msg.guild.name : "DMs"} (${msg.guild ? msg.guild.id : msg.channel.id})`,
		`User: ${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`,
		`Message: ${msg.content}`,
		`--------------------`
	];
	var config = {};
	if(msg.guild) config = await bot.stores.configs.get(msg.guild.id);

	var content = msg.content.slice(bot.prefix.length);
	let {command, args} = await bot.handlers.command.parse(content);
	if(!command) {
		log.push('- Command not found -');
		console.log(log.join('\r\n'));
		bot.writeLog(log.join('\r\n'));
		return await msg.channel.send("Command not found.");
	}
	
	try {
		var result = await bot.handlers.command.handle({command, args, msg, config});

		if(!result) return;
		if(Array.isArray(result)) { //embeds
			var message = await msg.channel.send({embeds: [result[0].embed ?? result[0]]});
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
		} else if(typeof result == "object") await msg.channel.send({embeds: [result.embed ?? result]});
		else await msg.channel.send(result);
	} catch(e) {
		console.log(e);
		log.push(`Error: ${e}`);
		log.push(`--------------------`);
		msg.channel.send('Error: '+(e.message ?? e));
	}
}
