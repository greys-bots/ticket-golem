module.exports = async (reaction, user, bot)=> {
	if(bot.user.id == user.id) return;

	if(reaction.partial) reaction = await reaction.fetch();
	var msg;
	if(reaction.message.partial) msg = await reaction.message.fetch();
	else msg = reaction.message;

	if(bot.menus?.[msg.id]?.user == user.id) {
		try {
			await bot.menus[msg.id].execute(bot, msg, reaction, user);
		} catch(e) {
			console.log(e);
			bot.writeLog(e);
			msg.channel.send("ERR! "+e.message);
		}
	}
}