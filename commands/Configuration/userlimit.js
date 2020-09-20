module.exports = {
	help: ()=> "Set server's limit for how many people can be added to a ticket via the `add` command.",
	usage: ()=> [" <limit> - Sets the server's user limit. If no limit is given, sets it to the default (10)."],
	desc: ()=> [
		"Set the limit to -1 if you don't want a limit. This isn't recommended, as it means the ticket opener can spam adding anyone they want to the ticket.",
		"Set the limit to 0 if you don't want any users to be added via this command. NOTE: This still affects moderators. They'll have to manually give users permission to view the ticket."
	].join("\n"),
	execute: async (bot, msg, args) => {
		var cfg = await bot.stores.configs.get(msg.guild.id);

		if(isNaN(parseInt(args[0]))) return "Please provide a valid number.";

		try {
			if(!cfg) await bot.stores.configs.create(msg.guild.id, {user_limit: parseInt(args[0])});
			else await bot.stores.configs.update(msg.guild.id, {user_limit: parseInt(args[0])});
		} catch(e) {
			return "Error:\n"+e;
		}

		return "Config set.";
	},
	permissions: ["MANAGE_GUILD"],
	guildOnly: true,
	alias: ["usrlimit", "usrlim", "userlim", "ul"]
}