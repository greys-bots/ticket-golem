const affected = [
	"add",
	"remove",
	"rename",
	"description",
	"close",
	"open",
	"reopen"
];

module.exports = {
	data: {
		name: "modonly",
		description: "Set which commands can only be used by mods",
		options: [
			{
				name: 'command',
				description: "The command to affect",
				type: 3,
				required: false
			},
			{
				name: "value",
				description: "Whether the command is mod-only or not",
				type: 5,
				required: false
			}
		]
	},
	usage: [
		"- View current config",
		"[command] value:true - Make a command mod-only",
		"[command] value:false - Make a command usable by users"
	],
	extra: "This command doesn't affect commands that are already only usable by mods",
	async execute(ctx) {
		var cfg = await ctx.client.stores.configs.get(ctx.guild.id);
		
		var command = ctx.options.getString('command')?.toLowerCase().trim();
		var val = ctx.options.getBoolean('value');

		if(command) {
			if(val == null) return "Must provide a value.";

			if(!affected.includes(command))
				return "That command can't be made mod-only.";

			var mo = cfg?.mod_only ?? [];
			if(val) {
				if(mo.includes(command))
					return "That command is already mod-only.";
				mo.push(command);
			} else {
				mo = mo.filter(x => x != command);
			}

			await ctx.client.stores.configs[cfg ? "update" : "create"](
				ctx.guild.id,
				{mod_only: mo}
			)

			return "Config set.";
		}

		return {embeds: [{
			title: "Mod-only commands",
			description: cfg.mod_only.join("\n")
		}]}
	}
}