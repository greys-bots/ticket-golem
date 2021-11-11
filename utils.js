const { Collection } = require('discord.js');
const fs 			 = require('fs');

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

const loadCommands = (path) => {
	var modules = new Collection();
	var mod_aliases = new Collection();
	var commands = new Collection();
	var aliases = new Collection();

	var files = recursivelyReadDirectory(path);

	for(f of files) {
		var path_frags = f.replace(path, "").split(/(?:\\|\/)/);
		var mod = path_frags.length > 1 ? path_frags[path_frags.length - 2] : "Unsorted";
		var file = path_frags[path_frags.length - 1];
		if(!modules.get(mod.toLowerCase())) {
			var mod_info = require(file == "__mod.js" ? f : f.replace(file, "__mod.js"));
			modules.set(mod.toLowerCase(), {...mod_info, name: mod, commands: new Collection()})
			mod_aliases.set(mod.toLowerCase(), mod.toLowerCase());
			if(mod_info.alias) mod_info.alias.forEach(a => mod_aliases.set(a, mod.toLowerCase()));
		}
		if(file == "__mod.js") continue;

		mod = modules.get(mod.toLowerCase());
		if(!mod) {
			console.log("Whoopsies");
			continue;
		}

		var command = require(f);
		command.module = mod;
		command.name = file.slice(0, -3).toLowerCase();
		command = registerSubcommands(command, mod);
		commands.set(command.name, command);
		mod.commands.set(command.name, command);
		aliases.set(command.name, command.name);
		if(command.alias) command.alias.forEach(a => aliases.set(a, command.name));
	}

	return {modules, mod_aliases, commands, aliases};
}

const registerSubcommands = function(command, module, name) {	
	if(command.subcommands) {
		var subcommands = command.subcommands;
		command.subcommands = new Collection();
		Object.keys(subcommands).forEach(c => {
			var cmd = subcommands[c];
			cmd.name = `${command.name} ${c}`;
			cmd.parent = command;
			cmd.module = command.module;
			if(!command.sub_aliases) command.sub_aliases = new Collection();
			command.sub_aliases.set(c, c);
			if(cmd.alias) cmd.alias.forEach(a => command.sub_aliases.set(a, c));
			if(command.permissions && !cmd.permissions) cmd.permissions = command.permissions;
			if(command.guildOnly != undefined && cmd.guildOnly == undefined)
				cmd.guildOnly = command.guildOnly;
			command.subcommands.set(c, cmd);
		})
	}
	return command;
}

module.exports = {
	recursivelyReadDirectory,
	registerSubcommands,
	loadCommands,
	
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
				break;
		}

		await m.edit({embeds: [em.embed ?? em]});
		await reaction.users.remove(this.user)
		bot.menus[m.id] = this;
	},
	checkPermissions: async (bot, msg, cmd)=>{
		return new Promise((res)=> {
			if(cmd?.permissions) res(msg.member.permissions.has(cmd.permissions))
			else res(true);
		})
	},
	isDisabled: async (bot, srv, cmd, name) =>{
		return new Promise(async res=>{
			var cfg = await bot.stores.configs.get(srv);
			if(!cfg?.mod_only?.[0]) return res(false);
			let dlist = cfg.mod_only;
			name = name.split(" ");
			if(dlist && (dlist.includes(name[0]) || dlist.includes(name.join(" ")))) {
				res(true);
			} else {
				res(false);
			}
		})
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
