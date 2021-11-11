module.exports = {
	data: {
		name: "invite",
		description: "Receive a server invite"
	},
	usage: [
		"- Gives an invite for the bot"	
	],
	async execute(ctx) {
		return `You can invite me with this:\n${process.env.INVITE}`;
	},
	ephemeral: true
}