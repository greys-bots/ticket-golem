const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'help',
			description: "View command help",
			options: [
				{
					name: 'command',
					description: "View help for a specific command in a module",
					type: 3,
					required: false,
					autocomplete: true
				}
			],
			usage: [
				"[command] - Get help for a command or group of commands"	
			],
			extra: "Examples:\n"+
				   "`/help command:form` - Shows form module help",
			ephemeral: true,
			v2: true
		})

		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var cn = ctx.options.getString('command')?.toLowerCase().trim();

		var embeds = [];
		var cmds;
		if(!cn) {
			embeds = [{
				components: [{
					type: 17,
					accent_color: 0x8A8A8A,
					components: [
						{
							type: 10,
							content: `-# Command Help`
						},
						{
							type: 14,
							spacing: 2
						},
						{
							type: 10,
							content:
								"# I'm the Ticket Golem\n" +
								"I assist with creating private support tickets in servers. Here are some of my features:\n" +
								"## Simple, easy commands\n" +
								"Quickly and easily add users to tickets, update a ticket's name and description, and archive or delete tickets\n" +
								"## Dedicated archives channel\n" +
								'Send all archives to a dedicated channel, making them easy to search and read through' +
								"## Custom starter messages\n" +
								"Create a custom message to be sent whenever a ticket is created\n" +
								"## Ticket creation limits\n" +
								'Limit the number of tickets that users can open in a server, preventing ticket spam'
						},
						{
							type: 14,
							spacing: 2
						},
						{
							type: 1,
							components: [
								{
									type: 2,
									style: 5,
									label: 'Support Server',
									url: 'https://discord.gg/EvDmXGt'
								},
								{
									type: 2,
									style: 5,
									label: 'Patreon',
									url: 'https://patreon.com/greysdawn'
								},
								{
									type: 2,
									style: 5,
									label: 'Ko-Fi',
									url: 'https://ko-fi.com/greysdawn'
								},
							],
						}
					]	
				}]
			}];
			
			var mods = this.#bot.slashCommands.map(m => m).filter(m => m.subcommands.size);
			var ug = this.#bot.slashCommands.map(m => m).filter(m => !m.subcommands.size);
			for(let m of mods) {
				let e = {
					components: [{
						type: 17,
						accent_color: 0x8A8A8A,
						components: [{
							type: 10,
							content: `# ${m.name.toUpperCase()}\n${m.description}`
						}]
					}]
				}

				cmds = m.subcommands.map(o => o);
				cmds.forEach(c => {
					e.components[0].components.push({
						type: 10,
						content: `### /${m.name} ${c.name}\n${c.description}`
					})
				})
				embeds.push(e);
			}

			if(ug?.[0]) {
				var e = {
					components: [{
						type: 17,
						accent_color: 0x8A8A8A,
						components: [{
							type: 10,
							content: `# UNGROUPED\nMiscellaneous commands`
						}]
					}]
				}

				for(var c of ug) e.components[0].components.push({
					type: 10,
					content: `### /${c.name}\n${c.description}`
				});
				embeds.push(e)
			}
		} else {
			var name = cn;
			var [mod, cmd, scmd] = cn.split(" ");
			var cm;
			if(mod) {
				cm = this.#bot.slashCommands.get(mod);
				if(!cm) return "Module not found!";
				cmds = cm.subcommands.map(o => o);
			} else {
				cmds = this.#bot.slashCommands.map(c => c);
			}

			if(cmd) {
				cm = cmds.find(c => (c.name ?? c.name) == cmd);
				if(!cm) return "Command not found!";
				cmds = cm.subcommands?.map(o => o);

				if(scmd) {
					cm = cmds?.find(c => (c.name ?? c.name) == scmd);
					if(!cm) return "Subcommand not found!";
				}
			}

			if(cm.subcommands?.size) {
				let e = {
					components: [{
						type: 17,
						accent_color: 0x8A8A8A,
						components: [{
							type: 10,
							content: `# ${name.toUpperCase()}\n${cm.description}`
						}]
					}]
				}

				cm.subcommands.map(o => o).forEach(c => {
					e.components[0].components.push({
						type: 10,
						content: `### /${name.trim()} ${c.name}\n${c.description}`
					})
				})

				embeds = [e];
			} else {
				let e = {
					components: [{
						type: 17,
						accent_color: 0x8A8A8A,
						components: [{
							type: 10,
							content: `# /${name}\n${cm.description}`
						}]
					}]
				}

				if(cm.usage?.length) e.components[0].components.push({
					type: 10,
					content: `### Usage\n` + cm.usage.map(u => `/${name.trim()} ${u}`).join("\n")
				})

				if(cm.extra?.length) e.components[0].components.push({
					type: 10,
					content: `### Extra\n` + cm.extra
				})

				if(cm.permissions?.length) e.components[0].components.push({
					type: 10,
					content: `### Permissions\n` + cm.permissions.join(", ")
				})

				embeds = [e];
			}	
		}

		return embeds;
	}

	async auto(ctx) {
		var names = this.#bot.slashNames;
		var foc = ctx.options.getFocused();
		var res;
		if(!foc) res = names.map(n => ({ name: n, value: n }));
		else {
			foc = foc.toLowerCase()

			res = names.filter(n =>
				n.includes(foc)
			).map(n => ({
				name: n,
				value: n
			}))
		}

		return res.slice(0, 25);
	}
}

module.exports = (bot, stores) => new Command(bot, stores);