module.exports = {
	help: ()=> "Post a message that users can react to in order to open tickets.",
	usage: ()=> [" [channel] - Post the starter message."],
	desc: ()=> "The channel can be a #mention, channel ID, or channel-name.",
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide a channel to post to");

		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(!cfg) return msg.channel.createMessage("Please run `tg!config setup` before doing this");

		var channel = msg.channelMentions.length > 0 ?
				   msg.guild.channels.find(ch => ch.id == msg.channelMentions[0]) :
				   msg.guild.channels.find(ch => ch.id == args[0] || ch.name == args[0].toLowerCase());
		if(!channel) return msg.channel.createMessage("Channel not found");

		try {
			var message = await channel.createMessage({embed: {
				title: "Start Ticket",
				description: "React to this post with ✅ to start a new ticket.\n\nNOTE: Users can have 5 tickets open at once.",
				color: 2074412
			}});
		} catch(e) {
			console.log(e.stack);
			return msg.channel.createMessage("ERR: \n"+e.message);
		}

		try {
			message.addReaction("✅")
		} catch(e) {
			console.log(e.stack);
			return msg.channel.createMessage("ERR: \n"+e.message);
		}

		var scc = await bot.utils.addPost(bot, msg.guild.id, message.channel.id, message.id);
		if(scc) msg.channel.createMessage("Post sent!");
		else msg.channel.createMessage("Something went wrong")
	},
	permissions: ["manageMessages"],
	alias: ["p","send"],
	guildOnly: true
}