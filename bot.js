const Discord 	= require("discord.js");
const fs 		= require("fs");

require('dotenv').config();

const bot = new Discord.Client({partials: ['MESSAGE', 'USER', 'CHANNEL', 'GUILD_MEMBER', 'REACTION']});

bot.chars = process.env.CHARS;
bot.prefix = process.env.PREFIX;
bot.owner = process.env.OWNER;
bot.invlink = process.env.INVITE;

bot.fetch = require('node-fetch');

bot.status = 0;
bot.statuses = [
	() => `tg!h | in ${bot.guilds.cache.size} guilds.`,
	() => `tg!h | serving ${bot.users.cache.size} users.`
];

bot.updateStatus = async function(){
	var target = bot.statuses[bot.status % bot.statuses.length];
	if(typeof target == "function") bot.user.setActivity(await target());
	else bot.user.setActivity(target);
	bot.status++;
		
	setTimeout(()=> bot.updateStatus(), 5 * 60 * 1000)
}

async function setup() {
	bot.db = await require(__dirname + '/stores/__db')(bot);

	files = fs.readdirSync(__dirname + "/events");
	files.forEach(f => bot.on(f.slice(0,-3), (...args) => require(__dirname + "/events/"+f)(...args,bot)));

	bot.utils = require(__dirname + "/utils");

	var data = bot.utils.loadCommands(__dirname + "/commands");
	
	Object.keys(data).forEach(k => bot[k] = data[k]);
}

bot.writeLog = async (log) => {
	if(!fs.existsSync('./logs')) fs.mkdirSync('./logs');
	let now = new Date();
	let ndt = `${(now.getMonth() + 1).toString().length < 2 ? "0"+ (now.getMonth() + 1) : now.getMonth()+1}.${now.getDate().toString().length < 2 ? "0"+ now.getDate() : now.getDate()}.${now.getFullYear()}`;
	if(!fs.existsSync(`./logs/${ndt}.log`)){
		fs.writeFile(`./logs/${ndt}.log`,log+"\r\n",(err)=>{
			if(err) console.log(`Error while attempting to write log ${ndt}\n`+err.stack);
		});
	} else {
		fs.appendFile(`./logs/${ndt}.log`,log+"\r\n",(err)=>{
			if(err) console.log(`Error while attempting to apend to log ${ndt}\n`+err);
		});
	}
}

bot.parseCommand = async function(bot, msg, args) {
	if(!args[0]) return undefined;
	
	var command = bot.commands.get(bot.aliases.get(args[0].toLowerCase()));
	if(!command) return {command, nargs: args};

	args.shift();

	if(args[0] && command.subcommands && command.subcommands.get(command.sub_aliases.get(args[0].toLowerCase()))) {
		command = command.subcommands.get(command.sub_aliases.get(args[0].toLowerCase()));
		args.shift();
	}

	return {command, nargs: args};
}

bot.formatTime = (date) => {
	if(typeof date == "string") date = new Date(date);

	return `${(date.getMonth()+1) < 10 ? "0"+(date.getMonth()+1) : (date.getMonth()+1)}.${(date.getDate()) < 10 ? "0"+(date.getDate()) : (date.getDate())}.${date.getFullYear()} at ${date.getHours() < 10 ? "0"+date.getHours() : date.getHours()}:${date.getMinutes() < 10 ? "0"+date.getMinutes() : date.getMinutes()}`
}

bot.on("ready",()=>{
	console.log("Ready");
	bot.updateStatus();
})

setup();
bot.login(process.env.TOKEN)
.catch(e => console.log("Trouble connecting:\n"+e));
