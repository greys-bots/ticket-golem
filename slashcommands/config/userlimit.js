module.exports = {
	data: {
		name: 'userlimit',
		description: "Limit the number of users that can be added to tickets via commands",
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
	extra: "Set to -1 to have no limit on users. Default is 10",
	async execute(ctx) {
		var cfg = await ctx.client.stores.configs.get(ctx.guild.id);
		var num = ctx.options.getInteger('number');

		if(num != null) {
			await ctx.client.stores.configs[cfg ? 'update' : 'create'](
				ctx.guild.id,
				{user_limit: num}
			)
			return "Value set."
		}

		return {embeds: [{
			title: "User limit",
			description: `${cfg?.user_limit ?? 10}`
		}]}
	}
}