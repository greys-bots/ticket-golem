module.exports = {
	data: {
		name: 'category',
		description: "View and set the server's ticket category",
		options: [{
			name: 'category',
			description: "The category for tickets to be made in",
			type: 7,
			channel_types: [4],
			required: false
		}]
	},
	usage: [
		"- View config",
		" [category] - Set a new ticket category"
	],
	async execute(ctx) {
		var cfg = await ctx.client.stores.configs.get(ctx.guild.id);
		var category = ctx.options.getChannel('category');

		if(category) {
			await ctx.client.stores.configs[cfg ? 'update' : 'create'](
				ctx.guild.id,
				{category_id: category.id}
			)
			return "Category set."
		}
		
		return {embeds: [{
			title: "Ticket category",
			description: cfg?.category_id ? `<#${cfg.category_id}>` : "(not set)"
		}]}
	}
}