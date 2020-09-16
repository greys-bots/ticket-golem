module.exports = {
	help: ()=> "Set server's limit for how many people can be added to a ticket via the `add` command.",
	usage: ()=> [" <limit> - Sets the server's user limit. If no limit is given, sets it to the default (10)."],
	desc: ()=> ["This does not affect those manually given permission to view the ticket.\n",
				"Set the limit to -1 if you don't want a limit. This isn't recommended, as it means the ticket opener can spam adding anyone they want to the ticket.",
				"Set the limit to 0 if you don't want any users to be added via this command. NOTE: This still affects moderators. They'll have to manually give users permission to view the ticket."],
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(!cfg) return msg.channel.createMessage("Please set up the rest of the config before using this command.");
		
		var scc = await bot.utils.updateConfig(bot, msg.guild.id, {user_limit: args[0]});
		if(scc) msg.channel.createMessage("Config set.");
		else msg.channel.createMessage("Something went wrong.");
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ["usrlimit", "usrlim", "userlim", "ul"]
}