module.exports = {
	help: ()=> "Set whether certain commands can only be used by mods.",
	usage: ()=> [" [command] [true/1 | false/0] - Sets whether the given command is mod-only."],
	desc: ()=> ["Commands that can be set to mod only are `add`, `remove`, `rename`, `description`, `close`, and `reopen`.\nMod-only commands can only be used by users with the `manageMessages` permission."],
	execute: async (bot, msg, args) => {
		if(!args[1]) return msg.channel.createMessage("Please provide a command and what to set its mod-only status to.\nExample: `tg!config modonly add 1` (set the `add` command to be mod-only)");

		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(!cfg) return msg.channel.createMessage("Please set up the rest of the config before using this command.");
		if(!["add", "remove", "rename", "description", "close", "reopen"].includes(args[0].toLowerCase())) return msg.channel.createMessage("That command can't be made mod-only.");
		if(!["true", "false", "0", "1"].includes(args[1].toLowerCase())) return msg.channel.createMessage("Invalid second argument.\nValid arguments:\n`1 or true` - Sets the command to be mod-only.\n`0 or false` - Sets the command to be usable by non-mods.")

		if(["true", "1"].includes(args[1].toLowerCase())) {
			if(cfg.mod_only?.includes(args[0].toLowerCase())) return msg.channel.createMessage("That command is already mod-only.");

			if(!cfg.mod_only) cfg.mod_only = [args[0].toLowerCase()];
			else cfg.mod_only.push(args[0].toLowerCase());
		} else {
			if(cfg.mod_only && !cfg.mod_only.includes(args[0].toLowerCase())) return msg.channel.createMessage("That command is already not mod-only.");
			
			cfg.mod_only = cfg.mod_only.filter(x => x!= args[0].toLowerCase());
		}

		var scc = await bot.utils.updateConfig(bot, msg.guild.id, {mod_only: cfg.mod_only});
		if(scc) msg.channel.createMessage("Config set.");
		else msg.channel.createMessage("Something went wrong.")
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ["md", "mod", "mods"]
}