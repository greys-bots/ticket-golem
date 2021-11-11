module.exports = {
	help: ()=> "Set server's archives channel.",
	usage: ()=> [" [channel ID] - Sets the archives channel for this server."],
	execute: async (bot, msg, args) => {
		if(!args[0]) return "Please provide a channel ID.";
		
		var cfg = await bot.stores.configs.get(msg.guild.id);

		var archives = msg.guild.channels.cache.find(c => c.id == args[0].replace(/[<#>]/g,"") || c.name == args[0].toLowerCase());
		if(!archives) return "Channel not found.";

		try {
			if(!cfg) await bot.stores.configs.create(msg.guild.id, {archives_id: archives ? archives.id : null});
			else await bot.stores.configs.update(msg.guild.id, {archives_id: archives ? archives.id : null});
		} catch(e) {
			return "Error:\n"+e;
		}
		
		return "Config set."
	},
	permissions: ["MANAGE_GUILD"],
	guildOnly: true,
	alias: ["a","arch","archive","channel"]
}