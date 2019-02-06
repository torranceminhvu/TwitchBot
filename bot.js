const tmi = require('tmi.js');
require('dotenv').config();

// Define configuration options
const opts = {
  identity: {
    username: 'aquasniper1',
    password: process.env.PASSWORD
  },
  channels: [
    'aquasniper1',
    //'tsm_theoddone'
  ]
};

const allowedUser = [
  'aquasniper1'
];

const chatCommand = 'POGGERS';
const botDelayInMS = 500;

// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on('chat', onChatHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();
// Called every time a message comes in
async function onChatHandler(channel, userstate, msg, self) {
  if (self) { return; } // Ignore messages from the bot

  // Remove whitespace from chat message
  const commandName = msg.trim();

  // If the command is known, let's execute it
  if (commandName === chatCommand && allowedUser.includes(userstate.username)) {
    const botMessages = buildPyramid();

    for (let botMessage of botMessages) {
      client.say(channel, `${botMessage}`);
      await sleep(botDelayInMS);
    };

    console.log(`* Executed ${commandName} command`);
  } else {
    console.log(`* Unknown command ${commandName}`);
  }
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler(addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}

function buildPyramid() {
  const messages = [
    'oddonePat oddonePat oddonePat oddonePat',
    'oddonePat oddoneG oddoneBakana oddonePat',
    'oddonePat oddoneLewd oddoneLOL oddonePat',
    'oddonePat oddonePat oddonePat oddonePat'
  ];

  return messages;
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}