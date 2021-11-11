module.exports = {
	data: {
		name: 'ticketlimit',
		description: "Limit the number of tickets per user that can be opened at once",
		options: [{
			name: 'number',
			description: "The number to set the config to",
			type: 4,
			min_value: -1,
			required: false
		}]
	},
	usage: [
		'- View current config',
		' [number] - Set the config'
	],
	extra: "Set to -1 to have no limit on open tickets. Default is 5",
	async execute(ctx) {
		var cfg = await ctx.client.stores.configs.get(ctx.guild.id);
		var num = ctx.options.getInteger('number');

		if(num != null) {
			await ctx.client.stores.configs[cfg ? 'update' : 'create'](
				ctx.guild.id,
				{ticket_limit: num}
			)
			return "Value set."
		}

		return {embeds: [{
			title: "Ticket limit",
			description: `${cfg?.ticket_limit ?? 10}`
		}]}
	}
}