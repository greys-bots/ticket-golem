module.exports = {
	help: ()=> "Set server's ticket category.",
	usage: ()=> [" [category ID] - Sets the ticket category for this server."],
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);

		var category = msg.guild.channels.find(c => (c.id == args[0].replace(/[<#>]/g,"") || c.name.toLowerCase() == args[0].toLowerCase()) && c.type == 4);
		if(!category) return msg.channel.createMessage("Category not found.");

		var scc = await bot.utils.updateConfig(bot, msg.guild.id, {category_id: category.id});

		if(scc) msg.channel.createMessage("Config set.");
		else msg.channel.createMessage("Something went wrong.");
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ["c","cat"]
}