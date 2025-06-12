const fs = require('fs');
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

let data = require('./data.json');

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Initialize training tracker if not present
if (!data.training) data.training = {};
if (!data.weekCounter) data.weekCounter = 0;

client.on('messageCreate', message => {
  if (!message.content.startsWith('!') || message.author.bot) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Add OC
  if (command === 'addoc' && message.member.permissions.has('Administrator')) {
    const [name] = args;
    if (!name) return message.reply("You must provide a name.");
    data.ocs[name] = {
      stats: { shooting: 50, passing: 50, dribbling: 50, speed: 50, defense: 50, offense: 50 },
      moves: [],
      flowState: false,
      trainingPoints: 10
    };
    data.training[name] = { lastStat: null };
    fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
    message.reply(`✅ OC ${name} added.`);
  }

  // Train OC
  if (command === 'train' && message.member.permissions.has('Administrator')) {
    const [name, stat] = args;
    const oc = data.ocs[name];
    if (!oc) return message.reply("❌ OC not found.");
    if (!oc.stats[stat]) return message.reply("❌ Invalid stat.");

    const current = oc.stats[stat];
    if (current >= 70) return message.reply("⚠️ Stat is capped at 70.");
    if (data.training[name]?.lastStat === stat) return message.reply("⚠️ You can't train the same stat back-to-back.");
    if (oc.trainingPoints <= 0) return message.reply("⏳ This OC has no training points left this week.");

    const gain = Math.floor(Math.random() * 2) + 1; // 1 or 2
    oc.stats[stat] += gain;
    if (oc.stats[stat] > 70) oc.stats[stat] = 70;

    data.training[name].lastStat = stat;
    oc.trainingPoints -= gain;

    fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
    message.reply(`✅ ${name} trained ${stat}. +${gain} points. New stat: ${oc.stats[stat]} | Remaining points: ${oc.trainingPoints}`);
  }

  // Reset weekly training
  if (command === 'resetweek' && message.member.permissions.has('Administrator')) {
    for (let name in data.ocs) {
      data.ocs[name].trainingPoints = 10;
      data.training[name].lastStat = null;
    }
    data.weekCounter += 1;
    fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
    message.reply("🔄 Weekly training points reset for all OCs.");
  }

  // Toggle Flow State
  if (command === 'flow') {
    const [name] = args;
    const oc = data.ocs[name];
    if (!oc) return message.reply("❌ OC not found.");
    oc.flowState = !oc.flowState;
    fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
    message.reply(`${name}'s Flow State is now ${oc.flowState ? '🌀 ACTIVE' : '🔕 INACTIVE'}`);
  }

  // List all OCs
  if (command === 'listocs') {
    const names = Object.keys(data.ocs);
    if (names.length === 0) return message.reply("⚠️ No OCs found.");
    message.reply(`📜 OCs: ${names.join(', ')}`);
  }

  // Show OC Info
  if (command === 'ocinfo') {
    const [name] = args;
    const oc = data.ocs[name];
    if (!oc) return message.reply("❌ OC not found.");
    message.reply(
      `📄 Info for ${name}:\n` +
      `Stats: Shooting ${oc.stats.shooting}, Passing ${oc.stats.passing}, Dribbling ${oc.stats.dribbling}, Speed ${oc.stats.speed}, Defense ${oc.stats.defense}, Offense ${oc.stats.offense}\n` +
      `Moves: ${oc.moves.join(', ') || 'None'}\n` +
      `Flow State: ${oc.flowState ? '🌀 ACTIVE' : '🔕 INACTIVE'}\n` +
      `Training Points: ${oc.trainingPoints}`
    );
  }

  // Show OC Stats (formerly matchpreview)
  if (command === 'ocstats') {
    const names = args;
    const results = names.map(name => {
      const oc = data.ocs[name];
      if (!oc) return `${name}: ❌ Not Found`;
      return `${name} [S:${oc.stats.shooting}, P:${oc.stats.passing}, D:${oc.stats.dribbling}, Sp:${oc.stats.speed}, Def:${oc.stats.defense}, O:${oc.stats.offense}]`;
    });
    message.reply(`📊 OC Stats:\n` + results.join("\n"));
  }

  // Show all commands
  if (command === 'commands') {
    message.reply(
      "**📘 Command List:**\n" +
      "`!addoc [name]` - Add a new OC\n" +
      "`!train [name] [stat]` - Train an OC (gain 1–2 points, cap 70, no back-to-back)\n" +
      "`!resetweek` - Reset weekly training points for all OCs\n" +
      "`!flow [name]` - Toggle Flow State\n" +
      "`!listocs` - List all OC names\n" +
      "`!ocinfo [name]` - Full info for an OC\n" +
      "`!ocstats [name1] [name2] ...` - View stat summary for one or more OCs\n" +
      "`!commands` - Show this command list"
    );
  }
});

client.login(process.env.TOKEN);
