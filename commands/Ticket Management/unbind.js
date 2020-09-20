module.exports = {
	help: ()=> "Unbind the ticket starter reaction from a custom message.",
	usage: ()=> [" [channel] [messageID] - Unbind the reaction from a message."],
	desc: ()=> "The channel can be a #mention, ID, or channel-name.",
	execute: async (bot, msg, args) => {
		if(!args[1]) return "Please provide the channel and message ID to unbind the reaction from.";

		var cfg = await bot.stores.configs.get(msg.guild.id);
		if(!cfg || !cfg.category_id) return `Please run \`${bot.prefix}setup\` before doing this.`;

		try {
			var channel = msg.guild.channels.cache.find(ch => [ch.id, ch.name].includes(args[0].replace(/[<#>]/g,"")));
			if(!channel) return "Channel not found.";
			var message = await channel.messages.fetch(args[1]);
			if(!message) return "Message not found.";
			await message.reactions.cache.get("✅").remove();

			await bot.stores.posts.delete(msg.guild.id, message.channel.id, message.id);
		} catch(e) {
			console.log(e);
			return "Error:\n"+(e.message || e);
		}	

		return "Reaction unbound.";	
	},
	permissions: ["MANAGE_MESSAGES"],
	guildOnly: true,
	alias: ["ub","u"]
}