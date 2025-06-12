const fs = require('fs');
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

let data = require('./data.json');

function saveData() {
    fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
}

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
        if (data.ocs[name]) return message.reply("OC already exists.");
        data.ocs[name] = {
            stats: { shooting: 50, passing: 50, dribbling: 50, speed: 50, defense: 50, offense: 50 },
            moves: [],
            flowState: false,
            trainingHistory: [],
            weeklyPoints: 0
        };
        saveData();
        message.reply(`OC ${name} added.`);
    }

    if (command === 'train' && message.member.permissions.has('Administrator')) {
        const [name, stat] = args;
        const oc = data.ocs[name];
        if (!oc) return message.reply("OC not found.");
        if (!oc.stats[stat]) return message.reply("Invalid stat.");
        if (oc.weeklyPoints >= 10) return message.reply(`${name} has reached the weekly training limit (10 points).`);
        if (oc.trainingHistory[oc.trainingHistory.length - 1] === stat) return message.reply("Cannot train the same stat twice in a row.");

        const gain = Math.floor(Math.random() * 2) + 1;
        const current = oc.stats[stat];
        if (current >= 70) return message.reply("Stat is capped at 70.");
        oc.stats[stat] = Math.min(70, current + gain);
        oc.trainingHistory.push(stat);
        oc.weeklyPoints += gain;
        saveData();
        message.reply(`${name} trained ${stat} and gained +${gain}. New stat: ${oc.stats[stat]}. Weekly points: ${oc.weeklyPoints}/10`);
    }

    if (command === 'resetweek' && message.member.permissions.has('Administrator')) {
        for (const name in data.ocs) {
            data.ocs[name].weeklyPoints = 0;
            data.ocs[name].trainingHistory = [];
        }
        saveData();
        message.reply("✅ Weekly training limits and histories reset.");
    }

    if (command === 'flow') {
        const [name] = args;
        const oc = data.ocs[name];
        if (!oc) return message.reply("OC not found.");
        oc.flowState = !oc.flowState;
        saveData();
        message.reply(`${name}'s Flow State is now ${oc.flowState ? 'ACTIVE' : 'INACTIVE'}`);
    }

    if (command === 'matchpreview') {
        const names = args;
        const results = names.map(name => {
            const oc = data.ocs[name];
            if (!oc) return `${name}: Not Found`;
            return `${name} [S:${oc.stats.shooting}, P:${oc.stats.passing}, D:${oc.stats.dribbling}, Sp:${oc.stats.speed}, Def:${oc.stats.defense}, O:${oc.stats.offense}]`;
        });
        message.reply("📊 Match Preview:\n" + results.join("\n"));
    }

    if (command === 'listocs') {
        const ocNames = Object.keys(data.ocs);
        if (ocNames.length === 0) return message.reply("No OCs found.");
        message.reply("📁 OC List:\n" + ocNames.map(name => `- ${name}`).join("\n"));
    }

    if (command === 'ocinfo') {
        const [name] = args;
        const oc = data.ocs[name];
        if (!oc) return message.reply("OC not found.");
        message.reply(`📋 OC: ${name}
Stats: Shooting: ${oc.stats.shooting}, Passing: ${oc.stats.passing}, Dribbling: ${oc.stats.dribbling}, Speed: ${oc.stats.speed}, Defense: ${oc.stats.defense}, Offense: ${oc.stats.offense}
Moves: ${oc.moves.length > 0 ? oc.moves.join(", ") : "None"}
Flow State: ${oc.flowState ? "ACTIVE" : "INACTIVE"}
Weekly Points: ${oc.weeklyPoints}/10`);
    }
});

client.login(process.env.TOKEN);
