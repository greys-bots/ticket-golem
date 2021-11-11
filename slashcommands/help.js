module.exports = {
	data: {
		name: 'help',
		description: "View command help",
		options: [
			{
				name: 'module',
				description: "View help for a specific group of commands",
				type: 3,
				required: false
			},
			{
				name: 'command',
				description: "View help for a specific command in a module",
				type: 3,
				required: false
			},
			{
				name: 'subcommand',
				description: "View help for a command's subcommand",
				type: 3,
				required: false
			}
		]
	},
	usage: [
		"[module] - Get help for a module",
		"[module] [command] - Get help for a command in a module",
		"[module] [command] [subcommand] - Get help for a command's subcommand"	
	],
	extra: "Examples:\n"+
		   "`/help module:ticket` - Shows ticket module help",
	async execute(ctx) {
		var mod = ctx.options.getString('module')?.toLowerCase().trim();
		var cmd = ctx.options.getString('command')?.toLowerCase().trim();
		var scmd = ctx.options.getString('subcommand')?.toLowerCase().trim();

		var embeds = [];
		var cmds;
		if(!mod && !cmd && !scmd) {
			var mods = ctx.client.slashCommands.map(m => m).filter(m => m.options);
			var ug = ctx.client.slashCommands.map(m => m).filter(m => !m.options && ![2, 3].includes(m.data.type));
			var ctm = ctx.client.slashCommands.map(m => m).filter(m => [2, 3].includes(m.data.type));

			for(var m of mods) {
				var e = {
					title: (m.data.name).toUpperCase(),
					description: m.data.description
				}

				cmds = m.options.map(o => o);
				var tmp = await ctx.client.utils.genEmbeds(ctx.client, cmds, (c) => {
					return {name: c.data.name, value: c.data.description}
				}, e, 10, {addition: ""})
				embeds = embeds.concat(tmp.map(e => e.embed))
			}

			if(ug?.[0]) {
				var e = {
					title: "UNGROUPED",
					description: "Miscellaneous commands",
					fields: []
				}

				for(var c of ug) e.fields.push({name: c.name ?? c.data.name, value: c.description ?? c.data.description});
				embeds.push(e)
			}

			if(ctm?.[0]) {
				var e = {
					title: "CONTEXT MENU",
					description: "Commands that appear on right clicking",
					fields: []
				}

				for(var c of ctm) e.fields.push({name: c.name ?? c.data.name, value: c.description ?? c.data.description});
				embeds.push(e)
			}
		} else {
			var name = "";
			var cm;
			if(mod) {
				cm = ctx.client.slashCommands.get(mod);
				if(!cm) return "Module not found!";
				cmds = cm.options.map(o => o);
				name += (cm.name ?? cm.data.name) + " ";
			} else {
				cmds = ctx.client.slashCommands.map(c => c);
			}

			if(cmd) {
				cm = cmds.find(c => (c.name ?? c.data.name) == cmd);
				if(!cm) return "Command not found!";
				cmds = cm.options?.map(o => o);
				name += `${cm.name ?? cm.data.name} `;

				if(scmd) {
					cm = cmds?.find(c => (c.name ?? c.data.name) == scmd);
					if(!cm) return "Subcommand not found!";
					name += `${cm.name ?? cm.data.name}`;
				}
			}

			embeds.push({
				title: name,
				description: cm.description ?? cm.data.description,
				fields: []
			})

			if(cm.usage) {
				if([2,3].includes(cm.data.type)) {
					embeds[embeds.length - 1].fields.push({
						name: "Usage",
						value: cm.usage.join("\n")
					})
				} else {
					embeds[embeds.length - 1].fields.push({
						name: "Usage",
						value: cm.usage.map(u => `/${name.trim()}  ${u}`).join("\n")
					})
				}
			}

			if(cm.options) embeds[embeds.length - 1].fields.push({
				name: "Subcommands",
				value: cm.options.map(o => `**/${name.trim()} ${o.data.name}** - \`${o.data.description}\``).join("\n")
			});
			if(cm.extra) embeds[embeds.length - 1].fields.push({
				name: "Extra",
				value: cm.extra
			});
		}

		if(embeds.length > 1)
			for(var i = 0; i < embeds.length; i++)
				embeds[i].title += ` (${i+1}/${embeds.length})`
		return embeds;
	},
	ephemeral: true
}