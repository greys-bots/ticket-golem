module.exports = {
	help: ()=> "Set up the server's config.",
	usage: ()=> [" - Run the config menu."],
	execute: async (bot, msg, args) => {
		var cfg = await bot.stores.configs.get(msg.guild.id);
		if(!cfg) cfg = {new: true};

		var category = cfg.category_id ? msg.guild.channels.cache.find(c => c.id == cfg.category_id) : undefined;
		var archives = cfg.archives_id ? msg.guild.channels.cache.find(c => c.id == cfg.archives_id) : undefined;

		var resp;
		
		await msg.channel.send("Enter the category that tickets should be created in. This can be the category name or ID. You have 1 minute to do this\nNOTE: This category's permissions should only allow mods and I to see channels; I handle individual permissions for users."+(category ? "\nType `skip` to keep the current value." : ""));
		resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time:1000*60, max:1});
		if(!resp.first()) return "Action cancelled: timed out.";
		if(!(category && resp.first().content.toLowerCase() == "skip")) category = await msg.guild.channels.cache.find(c => [c.id,c.name.toLowerCase()].includes(resp.first().content) && c.type == 'category');
		if(!category) return "Action cancelled: category not found.";

		await msg.channel.send("Enter the channel that archived tickets should be sent to. This can be the channel name, #mention, or ID. You have 1 minute to do this\nNOTE: This is not required. Type `skip` to skip it, and archives will be sent to your DMs instead.");;
		resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time:1000*60, max:1});
		if(!resp.first()) return "Action cancelled: timed out.";
		if(resp.first().content.toLowerCase() != "skip") archives = await msg.guild.channels.cache.find(c => [c.id,c.name.toLowerCase()].includes(resp.first().content.replace(/[<#>]/g, "")) && c.type == 'text');
		if(!archives && resp.first().content.toLowerCase() != "skip") return "Action cancelled: channel not found.";

		try {
			if(cfg.new) await bot.stores.configs.create(msg.guild.id, {category_id: category.id, archives_id: archives ? archives.id : null});
			else await bot.stores.configs.update(msg.guild.id, {category_id: category.id, archives_id: archives ? archives.id : null});
		} catch(e) {
			return "Error:\n"+e;
		}

		return "Config set.";
	},
	permissions: ["MANAGE_GUILD"],
	guildOnly: true,
	alias: ["s","menu"]
}