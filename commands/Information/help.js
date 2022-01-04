module.exports = {
	help: ()=> "Displays help embed.",
	usage: ()=> [
		" - Displays help for all commands.",
		" [command] - Displays help for specfic command.",
		" [command] [subcommand] - Displays help for a command's subcommand."
	],
	execute: async (bot, msg, args) => {
		if(!args[0]) {
			var modules = bot.modules.map(m => m);
			modules.forEach(m => m.commands = m.commands.map(c => c));

			var embeds = [];
			for(var i = 0; i < modules.length; i++) {
				var tmp_embeds = await bot.utils.genEmbeds(bot, modules[i].commands, c => {
					return {name:  `**${bot.prefix + c.name}**`, value: c.help()}
				}, {
					title: `**${modules[i].name}**`,
					description: modules[i].description,
					color: parseInt(modules[i].color, 16) || parseInt("555555", 16),
					footer: {
							icon_url: bot.user.avatarURL(),
							text: "Call me TG. I handle support tickets."
						}
				}, 10, {addition: ""})
				
				embeds = embeds.concat(tmp_embeds);
			}

			for(let i=0; i<embeds.length; i++) {
				if(embeds.length > 1) embeds[i].embed.title += ` (page ${i+1}/${embeds.length}, ${bot.commands.size} commands total)`;
			}

			return embeds;
		}

		let {command} = await bot.handlers.command.parse(args.join(" "));
		if(command) {
			var embed = {embed: {
				title: `Help | ${command.name.toLowerCase()}`,
				description: command.help(),
				fields: [
					{name: "**Usage**", value: `${command.usage().map(c => `**${bot.prefix + command.name}**${c}`).join("\n")}`},
					{name: "**Aliases**", value: `${command.alias ? command.alias.join(", ") : "(none)"}`},
					{name: "**Subcommands**", value: `${command.subcommands ?
							command.subcommands.map(sc => `**${bot.prefix}${sc.name}** - ${sc.help()}`).join("\n") : 
							"(none)"}`}
				],
				color: parseInt(command.module.color, 16) || parseInt("555555", 16),
				footer: {
					icon_url: bot.user.avatarURL(),
					text: "Arguments like [this] are required, arguments like <this> are optional."
				}
			}};
			if(command.desc) embed.embed.fields.push({name: "**Extra Info**", value: command.desc()});
			if(command.permissions) embed.embed.fields.push({name: "**Permissions**", value: command.permissions.join(", ")});

			return embed;
		} else {
			let module = bot.modules.get(args[0].toLowerCase());
			if(!module) return "Command/module not found";
			module.commands = module.commands.map(c => c);

			var embeds = await bot.utils.genEmbeds(bot, module.commands, c => {
				return {name: `**${bot.prefix + c.name}**`, value: c.help()}
			}, {
				title: `**${module.name}**`,
				description: module.description,
				color: parseInt(module.color, 16) || parseInt("555555", 16),
				footer: {
						icon_url: bot.user.avatarURL(),
						text: "Call me TG. I handle support tickets."
					}
			}, 10, {addition: ""});

			for(let i=0; i<embeds.length; i++) {
				if(embeds.length > 1) embeds[i].embed.title += ` (page ${i+1}/${embeds.length}, ${Object.keys(bot.commands).length} commands total)`;
			}

			return embeds;
		}
	},
	alias: ["h", "halp", "?"]
}
