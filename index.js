const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

let data = require('./data.json');

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', message => {
    if (!message.content.startsWith('!') || message.author.bot) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'addoc' && message.member.permissions.has('Administrator')) {
        const [name] = args;
        if (!name) return message.reply("You must provide a name.");
        data.ocs[name] = {
            stats: { shooting: 50, passing: 50, dribbling: 50, speed: 50, defense: 50, offense: 50 },
            moves: [],
            flowState: false
        };
        fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
        message.reply(`OC ${name} added.`);
    }

    if (command === 'train' && message.member.permissions.has('Administrator')) {
        const [name, stat] = args;
        const oc = data.ocs[name];
        if (!oc) return message.reply("OC not found.");
        if (!oc.stats[stat]) return message.reply("Invalid stat.");
        let gain = 0;
        const current = oc.stats[stat];
        if (current >= 70) return message.reply("Stat is capped.");
        if (current < 65) gain = Math.floor(Math.random() * 4) + 1;
        else gain = Math.floor(Math.random() * 2) + 1;
        oc.stats[stat] += gain;
        fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
        message.reply(`${name} trained ${stat} and gained +${gain}. New stat: ${oc.stats[stat]}`);
    }

    if (command === 'matchpreview') {
        const names = args;
        const results = names.map(name => {
            const oc = data.ocs[name];
            if (!oc) return `${name}: Not Found`;
            return `${name} [S:${oc.stats.shooting}, P:${oc.stats.passing}, D:${oc.stats.dribbling}, Sp:${oc.stats.speed}, Def:${oc.stats.defense}, O:${oc.stats.offense}]`;
        });
        message.reply("📊 Match Preview:
" + results.join("
"));
    }

    if (command === 'flow') {
        const [name] = args;
        const oc = data.ocs[name];
        if (!oc) return message.reply("OC not found.");
        oc.flowState = !oc.flowState;
        fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
        message.reply(`${name}'s Flow State is now ${oc.flowState ? 'ACTIVE' : 'INACTIVE'}`);
    }
});

client.login(process.env.TOKEN);