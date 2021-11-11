module.exports = {
	data: {
		name: 'archives',
		description: "View and set the server's archives channel",
		options: [{
			name: 'channel',
			description: "The channel for the archives to go to",
			type: 7,
			channel_types: [0, 5, 10, 11, 12],
			required: false
		}]
	},
	usage: [
		"- View config",
		" [channel] - Set a new archives channel"
	],
	async execute(ctx) {
		var cfg = await ctx.client.stores.configs.get(ctx.guild.id);
		var channel = ctx.options.getChannel('channel');

		if(channel) {
			await ctx.client.stores.configs[cfg ? 'update' : 'create'](
				ctx.guild.id,
				{archives_id: channel.id}
			)
			return "Channel set."
		}
		
		return {embeds: [{
			title: "Archives channel",
			description: cfg?.archives_id ? `<#${cfg.archives_id}>` : "(not set)"
		}]}
	}
}