module.exports = {
	help: ()=> "Bind the ticket starter reaction to a custom message",
	usage: ()=> [" [channel] [messageID] - Bind the reaction to a message"],
	desc: ()=> "The channel can be a #mention, ID, or channel-name",
	execute: async (bot, msg, args) => {
		if(!args[1]) return msg.channel.createMessage("Please provide the channel and message ID to bind the reaction to");

		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(!cfg) return msg.channel.createMessage("Please run `tg!config setup` before doing this");

		var channel = msg.guild.channels.find(ch => ch.id == args[0].replace(/[<#>]/g,"") || ch.name == args[0].toLowerCase());
		if(!channel) return msg.channel.createMessage("Channel not found");
		var message = await bot.getMessage(channel.id, args[1]);
		if(!message) return msg.channel.createMessage("Message not found");

		try {
			message.addReaction("✅")
		} catch(e) {
			console.log(e);
			return msg.channel.createMessage("ERR: Couldn't add the reaction; aborting");
		}

		var scc = await bot.utils.addPost(bot, msg.guild.id, message.channel.id, message.id);
		if(scc) msg.channel.createMessage("Reaction bound!");
		else msg.channel.createMessage("Something went wrong")		

	},
	permissions: ["manageMessages"],
	guildOnly: true,
	alias: ["b"]
}