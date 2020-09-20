module.exports = {
	help: ()=> "Bind the ticket starter reaction to a custom message.",
	usage: ()=> [" [channel] [messageID] - Bind the reaction to a message."],
	desc: ()=> "The channel can be a #mention, ID, or channel-name.",
	execute: async (bot, msg, args) => {
		if(!args[1]) return "Please provide the channel and message ID to bind the reaction to.";

		var cfg = await bot.stores.configs.get(msg.guild.id);
		if(!cfg || !cfg.category_id) return `Please run \`${bot.prefix}setup\` before doing this.`;

		try {
			var channel = msg.guild.channels.cache.find(ch => ch.id == args[0].replace(/[<#>]/g,"") || ch.name == args[0].toLowerCase());
			if(!channel) return "Channel not found.";
			var message = await channel.messages.fetch(args[1]);
			if(!message) return "Message not found.";
			await message.react("✅")

			await bot.stores.posts.create(msg.guild.id, message.channel.id, message.id);
		} catch(e) {
			console.log(e);
			return "Error:\n"+(e.message || e);
		}	

		return "Reaction bound.";
	},
	permissions: ["MANAGE_MESSAGES"],
	guildOnly: true,
	alias: ["b"]
}