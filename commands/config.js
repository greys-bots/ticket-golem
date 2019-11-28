module.exports = {
	help: ()=> "Configure ticket system settings",
	usage: ()=> [" - Show the current config",
				 " setup - Run the config menu"],
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(!cfg) cfg = {category_id: "", archives_id: ""};

		var category = cfg.category_id != "" ? msg.guild.channels.find(c => c.id == cfg.category_id) : undefined;
		var archives = cfg.archives_id != "" ? msg.guild.channels.find(c => c.id == cfg.archives_id) : undefined;

		if(!args[0] || args[0] != "setup") return msg.channel.createMessage({embed: {
			title: "Ticket Config",
			fields: [
				{name: "Category ID", value: (category ? category.name.toLowerCase() : "*(not set)*")},
				{name: "Archive channel ID", value: (archives ? archives.name.toLowerCase() : "*(not set)*")}
			]
		}});

		var resp;
		
		await msg.channel.createMessage("Enter the category that tickets should be created in. This can be the category name or ID. You have 1 minute to do this\nNOTE: This category's permissions should only allow mods and I to see channels; I handle individual permissions for users!"+(category ? "\nType `skip` to keep the current value" : ""));
		resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time:1000*60,maxMatches:1});
		if(!resp[0]) return msg.channel.createMessage("Action cancelled: timed out");
		if(!(category && resp[0].content.toLowerCase() == "skip")) category = await msg.guild.channels.find(c => (c.id == resp[0].content || c.name.toLowerCase() == resp[0].content.toLowerCase()) && c.type == 4);
		if(!category) return msg.channel.createMessage("Action cancelled: category not found");

		await msg.channel.createMessage("Enter the channel that archived tickets should be sent to. This can be the channel name, #mention, or ID. You have 1 minute to do this\nNOTE: This is not required. Type `skip` to skip it, and archives will be sent to your DMs instead");;
		resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time:1000*60,maxMatches:1});
		if(!resp[0]) return msg.channel.createMessage("Action cancelled: timed out");
		if(resp[0].content.toLowerCase() != "skip") archives = await msg.guild.channels.find(c => (c.id == resp[0].content || c.name.toLowerCase() == resp[0].content.replace(/<#>/g,"").toLowerCase()) && c.type == 0);
		if(!archives && resp[0].content.toLowerCase() != "skip") return msg.channel.createMessage("Action cancelled: category not found");

		var scc;
		if(cfg.category_id == "") {
			scc = await bot.utils.createConfig(bot, msg.guild.id, category.id, archives ? archives.id : null);
		} else {
			scc = await bot.utils.updateConfig(bot, msg.guild.id, ["category_id", category.id, "archives_id", archives ? archives.id : null]);
		}

		if(scc) msg.channel.createMessage("Config set!");
		else msg.channel.createMessage("Something went wrong");
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ['conf','cfg','c']
}