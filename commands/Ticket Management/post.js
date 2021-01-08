module.exports = {
	help: ()=> "Post a message that users can react to in order to open tickets.",
	usage: ()=> [" [channel] - Post the starter message."],
	desc: ()=> "The channel can be a #mention, channel ID, or channel-name.",
	execute: async (bot, msg, args) => {
		if(!args[0]) return "Please provide a channel to post to."

		var cfg = await bot.stores.configs.get(msg.guild.id);
		if(!cfg?.category_id) return "Please run `tg!setup` before doing this.";

		var channel = msg.guild.channels.cache.find(ch => [ch.id, ch.name].includes(args[0].replace(/[<#>]/g, "").toLowerCase()));
		if(!channel) return "Channel not found.";

		try {
			var message = await channel.send({embed: {
				title: "Start Ticket",
				description: `React to this post with ✅ to start a new ticket.\n\nNOTE: Users can have ${cfg?.ticket_limit || 5} tickets open at once.`,
				color: 2074412
			}});
			message.react("✅")
			await bot.stores.posts.create(msg.guild.id, message.channel.id, message.id);
		} catch(e) {
			console.log(e.stack);
			return "Error:\n"+(e.message || e);
		}

		return "Post sent.";
	},
	permissions: ["MANAGE_MESSAGES"],
	alias: ["p","send"],
	guildOnly: true
}