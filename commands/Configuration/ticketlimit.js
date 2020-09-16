module.exports = {
	help: ()=> "Set server's limit for how many tickets users can have open at the same time.",
	usage: ()=> [" <limit> - Sets the server's ticket limit. If no limit is given, sets it to the default (5)."],
	desc: ()=> ["Set the limit to -1 if you don't want a limit. This isn't recommended, as it means users can spam opening up tickets.",
				"Set the limit to 0 if you want to temporarily disable ticket opening. NOTE: This still affects moderators. If this is the limit, no one will be able to open tickets."].join("\n"),
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(!cfg) return msg.channel.createMessage("Please set up the rest of the config before using this command.");

		var scc = await bot.utils.updateConfig(bot, msg.guild.id, {ticket_limit: args[0]});
		if(scc) msg.channel.createMessage("Config set.");
		else msg.channel.createMessage("Something went wrong.");
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ["ticlimit", "ticlim", "ticketlim", "tl"]
}