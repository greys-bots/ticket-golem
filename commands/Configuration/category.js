module.exports = {
	help: ()=> "Set server's ticket category.",
	usage: ()=> [" [category ID] - Sets the ticket category for this server."],
	execute: async (bot, msg, args) => {
		var cfg = await bot.stores.configs.get(msg.guild.id);

		var category = msg.guild.channels.cache.find(c => c.id == args[0].replace(/[<#>]/g,"") || c.name == args[0].toLowerCase());
		if(!category) return "Channel not found.";

		try {
			if(!cfg) await bot.stores.configs.create(msg.guild.id, {category_id: category.id});
			else await bot.stores.configs.update(msg.guild.id, {category_id: category.id});
		} catch(e) {
			return "Error:\n"+e;
		}
		
		return "Config set."
	},
	permissions: ["MANAGE_GUILD"],
	guildOnly: true,
	alias: ["c","cat"]
}