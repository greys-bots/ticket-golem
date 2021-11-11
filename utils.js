const fs = require('fs');

const recursivelyReadDirectory = (dir) => {
	var results = [];
	var files = fs.readdirSync(dir, {withFileTypes: true});
	for(file of files) {
		if(file.isDirectory()) {
			results = results.concat(recursivelyReadDirectory(dir+"/"+file.name));
		} else {
			results.push(dir+"/"+file.name);
		}
	}

	return results;
}
module.exports = {
	recursivelyReadDirectory,
	genCode: (table, num = 4) =>{
		var codestring="";
		var codenum=0;
		while (codenum<num){
			codestring=codestring+table[Math.floor(Math.random() * (table.length))];
			codenum=codenum+1;
		}
		return codestring;
	},
	genEmbeds: async (bot, arr, genFunc, info = {}, fieldnum, extras = {}) => {
		return new Promise(async res => {
			var embeds = [];
			var current = { embed: {
				title: typeof info.title == "function" ?
								info.title(arr[0], 0) : info.title,
						description: typeof info.description == "function" ?
								info.description(arr[0], 0) : info.description,
				color: typeof info.color == "function" ?
						info.color(arr[0], 0) : info.color,
				footer: info.footer,
				fields: []
			}};
			
			for(let i=0; i<arr.length; i++) {
				if(current.embed.fields.length < (fieldnum || 10)) {
					current.embed.fields.push(await genFunc(arr[i], bot));
				} else {
					embeds.push(current);
					current = { embed: {
						title: typeof info.title == "function" ?
								info.title(arr[i], i) : info.title,
						description: typeof info.description == "function" ?
								info.description(arr[i], i) : info.description,
						color: typeof info.color == "function" ?
								info.color(arr[i], i) : info.color,
						footer: info.footer,
						fields: [await genFunc(arr[i], bot)]
					}};
				}
			}
			embeds.push(current);
			if(extras.order && extras.order == 1) {
				if(extras.map) embeds = embeds.map(extras.map);
				if(extras.filter) embeds = embeds.filter(extras.filter);
			} else {
				if(extras.filter) embeds = embeds.filter(extras.filter);
				if(extras.map) embeds = embeds.map(extras.map);
			}
			if(embeds.length > 1) {
				for(let i = 0; i < embeds.length; i++)
					embeds[i].embed.title += (extras.addition != null ? eval("`"+extras.addition+"`") : ` (page ${i+1}/${embeds.length}, ${arr.length} total)`);
			}
			res(embeds);
		})
	},
	genTicketEmbed: (ticket) => {
		var users;
		if(ticket.users.length > 20) {
			users = ticket.users.slice(0, 21)
				.map(u => `<@${u.id}>`)
				.join("\n") +
				`\nand ${ticket.users.length - 20} more`;
		} else users = ticket.users.map(u => `<@${u.id}>`).join("\n");
		
		return {
			title: ticket.name ?? "Untitled Ticket",
			description: ticket.description ?? "(no description)",
			fields: [
				{
					name: "Ticket Opener",
					value: `<@${ticket.opener.id}>`
				},
				{
					name: "Ticket Users",
					value: users
				}
			],
			color: ticket.closed ? 0xaa5555 : 0x55aa55,
			footer: {
				text: `Ticket ID: ${ticket.hid}`
			},
			timestamp: ticket.timestamp
		}
	},
	paginateEmbeds: async function(bot, m, reaction) {
		var em;
		switch(reaction.emoji.name) {
			case "⬅️":
				if(this.index == 0) {
					this.index = this.data.length-1;
				} else {
					this.index -= 1;
				}

				em = this.data[this.index];
				break;
			case "➡️":
				if(this.index == this.data.length-1) {
					this.index = 0;
				} else {
					this.index += 1;
				}

				em = this.data[this.index];
				break;
			case "⏹️":
				await m.delete();
				delete bot.menus[m.id];
				return;
		}

		await m.edit({embeds: [em.embed ?? em]});
		await reaction.users.remove(this.user)
		bot.menus[m.id] = this;
	},
	async checkTicketPerms(ctx) {
		var {
			msg,
			ticket,
			user,
			cfg,
			action
		} = ctx;
		
		var member = await msg.guild.members.fetch(user);

		if(cfg?.mod_only?.includes(action) && !member.permissions.has("MANAGE_CHANNELS"))
			return false;
		if(member.id != ticket.opener.id && !member.permissions.has("MANAGE_CHANNELS"))
			return false;

		return true;
	},

	getConfirmation: async (bot, msg, user) => {
		return new Promise(res => {
			const ACCEPT = ['y', 'yes', '✅', 'confirm'];

			function msgListener(message) {
				if(message.channel.id != msg.channel.id ||
				   message.author.id != user.id) return;

				clearTimeout(timeout);
				bot.removeListener('messageCreate', msgListener);
				bot.removeListener('messageReactionAdd', reactListener);
				bot.removeListener('interactionCreate', intListener);

				if(ACCEPT.includes(message.content.toLowerCase()))
					return res({confirmed: true, message});
				else return res({confirmed: false, message, msg: 'Action cancelled.'});
			}

			function reactListener(react, ruser) {
				if(react.message.channel.id != msg.channel.id ||
				   ruser.id != user.id) return;

				clearTimeout(timeout);
				bot.removeListener('messageCreate', msgListener);
				bot.removeListener('messageReactionAdd', reactListener);
				bot.removeListener('interactionCreate', intListener);
				
				if(ACCEPT.includes(react.emoji.name))
					return res({confirmed: true, react});
				else return res({confirmed: false, react, msg: 'Action cancelled.'});
			}

			function intListener(interaction) {
				if(!interaction.isMessageComponent()) return;
				if(interaction.message.id != msg.id ||
				   interaction.user.id != user.id) return;

				clearTimeout(timeout);
				bot.removeListener('messageCreate', msgListener);
				bot.removeListener('messageReactionAdd', reactListener);
				bot.removeListener('interactionCreate', intListener);

				if(ACCEPT.includes(interaction.customId))
					return res({confirmed: true, interaction});
				else return res({confirmed: false, interaction, msg: 'Action cancelled.'});
			}

			const timeout = setTimeout(async () => {
				bot.removeListener('messageCreate', msgListener);
				bot.removeListener('messageReactionAdd', reactListener);
				bot.removeListener('interactionCreate', intListener);
				res({confirmed: false, msg: 'Action timed out.'})
			}, 30000);

			bot.on('messageCreate', msgListener);
			bot.on('messageReactionAdd', reactListener);
			bot.on('interactionCreate', intListener);
		})
	},
	handleChoices: async (bot, msg, user, choices) => {
		return new Promise(res => {

			function msgListener(message) {
				if(message.channel.id != msg.channel.id ||
				   message.author.id != user.id) return;

				clearTimeout(timeout);
				bot.removeListener('messageCreate', msgListener);
				bot.removeListener('messageReactionAdd', reactListener);
				bot.removeListener('interactionCreate', intListener);
				var choice = choices.find(c => c.accepted.includes(message.content.toLowerCase()));
				if(choice) return res({...choice, message});
				else return res({name: 'invalid', message});
			}

			function reactListener(react, ruser) {
				if(react.message.channel.id != msg.channel.id ||
				   ruser.id != user.id) return;

				clearTimeout(timeout);
				bot.removeListener('messageCreate', msgListener);
				bot.removeListener('messageReactionAdd', reactListener);
				bot.removeListener('interactionCreate', intListener);
				var choice = choices.find(c => c.accepted.includes(react.emoji.name));
				if(choice) return res({...choice, react});
				else return res({name: 'invalid', react});
			}

			function intListener(interaction) {
				if(!interaction.isMessageComponent()) return;
				if(interaction.message.id != msg.id ||
				   interaction.user.id != user.id) return;

				clearTimeout(timeout);
				bot.removeListener('messageCreate', msgListener);
				bot.removeListener('messageReactionAdd', reactListener);
				bot.removeListener('interactionCreate', intListener);
				var choice = choices.find(c => c.accepted.includes(interaction.customId));
				if(choice) return res({...choice, interaction});
				else return res({name: 'invalid', interaction});
			}

			const timeout = setTimeout(async () => {
				bot.removeListener('messageCreate', msgListener);
				bot.removeListener('messageReactionAdd', reactListener);
				bot.removeListener('interactionCreate', intListener);
				res({name: 'none', msg: 'Action timed out.'})
			}, 30000);

			bot.on('messageCreate', msgListener);
			bot.on('messageReactionAdd', reactListener);
			bot.on('interactionCreate', intListener);
		})
	},

	awaitSelection: async (ctx, choices, msg, options = {min_values: 1, max_values: 1, placeholder: '- - -'}) => {
		var components = [{
			type: 3,
			custom_id: 'copy_selector',
			options: choices,
			...options
		}]

		var reply;
		if(ctx.replied) {
			reply = await ctx.followUp({
				content: msg,
				components: [{
					type: 1,
					components
				}]
			});
		} else {
			reply = await ctx.reply({
				content: msg,
				components: [{
					type: 1,
					components
				}],
				fetchReply: true
			});
		}

		try {
			var resp = await reply.awaitMessageComponent({
				filter: (intr) => intr.user.id == ctx.user.id && intr.customId == 'copy_selector',
				time: 60000
			});
		} catch(e) { }
		if(!resp) return 'Nothing selected!';
		await resp.update({
			components: [{
				type: 1,
				components: components.map(c => ({
					...c,
					disabled: true,
					options: choices.map(ch => ({...ch, default: resp.values.includes(ch.value)}))
				}))
			}]
		});

		return resp.values;
	}
}
