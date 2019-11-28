module.exports = {
	help: ()=> "Unbind the ticket starter reaction from a custom message",
	usage: ()=> [" [channel] [messageID] - Unbind the reaction from a message"],
	desc: ()=> "The channel can be a #mention, ID, or channel-name",
	execute: async (bot, msg, args) => {
		if(!args[1]) return msg.channel.createMessage("Please provide the channel and message ID to unbind the reaction from");

		var channel = msg.guild.channels.find(ch => ch.id == args[0].replace(/[<#>]/g,"") || ch.name == args[0].toLowerCase());
		if(!channel) return msg.channel.createMessage("Channel not found");
		var message = await bot.getMessage(channel.id, args[1]);
		if(!message) return msg.channel.createMessage("Message not found");

		try {
			message.removeReaction("✅")
		} catch(e) {
			console.log(e);
			return msg.channel.createMessage("ERR: Couldn't remove the reaction; aborting");
		}

		var scc = await bot.utils.deletePost(bot, msg.guild.id, message.channel.id, message.id);
		if(scc) msg.channel.createMessage("Reaction unbound!");
		else msg.channel.createMessage("Something went wrong")		

	},
	permissions: ["manageMessages"],
	guildOnly: true,
	alias: ["ub","u"]
}