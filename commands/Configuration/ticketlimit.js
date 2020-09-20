module.exports = {
	help: ()=> "Set server's limit for how many tickets users can have open at the same time.",
	usage: ()=> [" <limit> - Sets the server's ticket limit. If no limit is given, sets it to the default (5)."],
	desc: ()=> [
		"Set the limit to -1 if you don't want a limit. This isn't recommended, as it means users can spam opening up tickets.",
		"Set the limit to 0 if you want to temporarily disable ticket opening. NOTE: This still affects moderators. If this is the limit, no one will be able to open tickets."
	].join("\n"),
	execute: async (bot, msg, args) => {
		var cfg = await bot.stores.configs.get(msg.guild.id);

		if(isNaN(parseInt(args[0]))) return "Please provide a valid number.";

		try {
			if(!cfg) await bot.stores.configs.create(msg.guild.id, {ticket_limit: parseInt(args[0])});
			else await bot.stores.configs.update(msg.guild.id, {ticket_limit: parseInt(args[0])});
		} catch(e) {
			return "Error:\n"+e;
		}

		return "Config set.";
	},
	permissions: ["MANAGE_GUILD"],
	guildOnly: true,
	alias: ["ticlimit", "ticlim", "ticketlim", "tl"]
}