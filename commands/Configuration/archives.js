module.exports = {
	help: ()=> "Set server's archives channel.",
	usage: ()=> [" [channel ID] - Sets the archives channel for this server."],
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);

		var archives = msg.guild.channels.find(c => c.id == args[0].replace(/[<#>]/g,"") || c.name == args[0].toLowerCase());
		if(!archives) return msg.channel.createMessage("Channel not found.");

		var scc = await bot.utils.updateConfig(bot, msg.guild.id, {archives_id: archives.id});

		if(scc) msg.channel.createMessage("Config set.");
		else msg.channel.createMessage("Something went wrong.");
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ["a","arch","archive","channel"]
}