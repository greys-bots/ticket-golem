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
			ephemeral: true
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
				title: "I'm the Ticket Golem",
				description: "I assist with creating private support tickets in servers. Here are some of my features:",
				fields: [
					{
						name: 'Simple, easy commands',
						value: "Quickly and easily add users to tickets, update a ticket's name and description, and archive or delete tickets"
					},
					{
						name: 'Dedicated archives channel',
						value: "Send all archives to a dedicated channel, making them easy to search and read through"
					},
					{
						name: 'Custom starter messages',
						value: "Create a custom message to be sent whenever a ticket is created"
					},
					{
						name: 'Ticket creation limits',
						value: "Limit the number of tickets that users can open in a server, preventing ticket spam"
					},
					{
						name: 'Individual form customization',
						value: [
							'Every form can have the following customized:',
							'- A name and description',
							'- An acceptance message',
							'- Roles added to users once accepted',
							'- What channel responses go to',
							'- A custom color!'
						].join('\n')
					},
					{
						name: "Need help? Join the support server:",
						value: "[https://discord.gg/EvDmXGt](https://discord.gg/EvDmXGt)",
						inline: true
					},
					{
						name: "Support my creators:",
						value: 
							"[Patreon](https://patreon.com/greysdawn) | " +
							"[Ko-fi](https://ko-fi.com/greysdawn)",
						inline: true
					}
				],
				color: 0x8A8A8A,
				footer: {
					icon_url: this.#bot.user.avatarURL(),
					text: "Use the buttons below to flip pages."
				}
			}]

			var mods = this.#bot.slashCommands.map(m => m).filter(m => m.subcommands.size);
			var ug = this.#bot.slashCommands.map(m => m).filter(m => !m.subcommands.size);
			for(var m of mods) {
				var e = {
					title: m.name.toUpperCase(),
					description: m.description
				}

				cmds = m.subcommands.map(o => o);
				var tmp = await this.#bot.utils.genEmbeds(this.#bot, cmds, (c) => {
					return {name: `/${m.name} ${c.name}`, value: c.description}
				}, e, 10, {addition: ""})
				embeds = embeds.concat(tmp.map(e => e.embed))
			}

			if(ug?.[0]) {
				var e = {
					title: "UNGROUPED",
					description: "Miscellaneous commands",
					fields: []
				}

				for(var c of ug) e.fields.push({name: '/' + c.name, value: c.description});
				embeds.push(e)
			}
		} else {
			var name = cn;
			var [mod, cmd, scmd] = cn.split(" ");
			var cm;
			if(mod) {
				cm = this.#bot.slashCommands.get(mod);
				if(!cm) return "Module not found.";
				cmds = cm.subcommands.map(o => o);
			} else {
				cmds = this.#bot.slashCommands.map(c => c);
			}

			if(cmd) {
				cm = cmds.find(c => (c.name ?? c.name) == cmd);
				if(!cm) return "Command not found.";
				cmds = cm.subcommands?.map(o => o);

				if(scmd) {
					cm = cmds?.find(c => (c.name ?? c.name) == scmd);
					if(!cm) return "Subcommand not found.";
				}
			}

			if(cm.subcommands?.size) {
				embeds = await this.#bot.utils.genEmbeds(this.#bot, cm.subcommands.map(c => c), (c) => {
					return {name: `**/${name.trim()} ${c.name}**`, value: c.description}
				}, {
					title: name.toUpperCase(),
					description: cm.description,
					color: 0x8A8A8A
				}, 10, {addition: ""})
				embeds = embeds.map(e => e.embed);
			} else {
				embeds = [{
					title: name,
					description: cm.description,
					fields: [],
					color: 0x8A8A8A
				}]

				if(cm.usage?.length) embeds[embeds.length - 1].fields.push({
					name: "Usage",
					value: cm.usage.map(u => `/${name.trim()} ${u}`).join("\n")
				})

				if(cm.extra?.length) embeds[embeds.length - 1].fields.push({
					name: "Extra",
					value: cm.extra
				});
			}	
		}

		if(embeds.length > 1)
			for(var i = 0; i < embeds.length; i++)
				embeds[i].title += ` (${i+1}/${embeds.length})`;
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