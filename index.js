const fs = require('fs');
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const path = './data.json';

// Load or create data.json if it doesn't exist
let data = { ocs: {} };
if (fs.existsSync(path)) {
  data = JSON.parse(fs.readFileSync(path, 'utf8'));
} else {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

const prefix = '!';

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return; // ignore bot messages
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const command = args.shift().toLowerCase();

  if (command === 'addmove') {
    // Admin check
    if (!message.member.permissions.has('Administrator')) {
      return message.reply("You don't have permission to use this command.");
    }

    const [name, move] = args;
    if (!name || !move) return message.reply('Usage: !addmove <ocName> <moveName>');

    const oc = data.ocs[name];
    if (!oc) return message.reply(`OC "${name}" not found.`);

    if (!oc.moves) oc.moves = [];
    if (oc.moves.includes(move)) {
      return message.reply(`"${move}" is already a move of ${name}.`);
    }

    oc.moves.push(move);
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
    message.reply(`Move "${move}" added to ${name}.`);
  }

  else if (command === 'editstat') {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply("You don't have permission to use this command.");
    }

    const [name, stat, value] = args;
    if (!name || !stat || !value) {
      return message.reply('Usage: !editstat <ocName> <stat> <newValue>');
    }

    const oc = data.ocs[name];
    if (!oc) return message.reply(`OC "${name}" not found.`);
    if (!oc.stats || !oc.stats.hasOwnProperty(stat)) {
      return message.reply(`Invalid stat "${stat}".`);
    }

    const newValue = parseInt(value, 10);
    if (isNaN(newValue) || newValue < 0 || newValue > 100) {
      return message.reply('Stat must be a number between 0 and 100.');
    }

    oc.stats[stat] = newValue;
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
    message.reply(`${name}'s ${stat} is now ${newValue}.`);
  }

  // You can add other commands here...

});

client.login('YOUR_BOT_TOKEN_HERE');
