const tmi = require('tmi.js');
const RateLimiter = require('limiter').RateLimiter;
require('dotenv').config();

// Define configuration options
const opts = {
  identity: {
    username: process.env.USER_NAME,
    password: process.env.PASSWORD
  },
  channels: [
    'aquasniper1',
    'tsm_theoddone'
  ]
};

const CONST = {
  allowedUser: 'aquasniper1',
  chatCommand: 'POGGERS',
  botDelayInMS: 500,
  limiter: new RateLimiter(1, 2000),
  sacList: []
};

// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on('chat', onChatHandler);
client.on("resub", onReSubHandler);
client.on("subscription", onSubHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();
// Called every time a message comes in
function onChatHandler(channel, userstate, msg, self) {
  if (self) { return; } // Ignore messages from the bot

  if (!CONST.sacList.includes(userstate.username)) {
    CONST.sacList.push(userstate.username);
    console.log(CONST.sacList.length);
  }
  killAMeme(channel, userstate.username, msg);
  //buildPyramid(channel, userstate, msg);
}

function onReSubHandler(channel, username, _months, message, userstate, methods) {
  let months = (userstate && 'msg-param-cumulative-months' in userstate && userstate['msg-param-cumulative-months']) || 1; // ensure at least 1
  welcome(channel, username, months);
};

function onSubHandler(channel, username, method, message, userstate) {
  welcome(channel, username, 1);
};

// Called every time the bot connects to Twitch chat
function onConnectedHandler(addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}

async function buildPyramid(channel, userstate, msg) {
  let botMessages = [
    'oddonePat oddonePat oddonePat oddonePat',
    'oddonePat oddoneG oddoneBakana oddonePat',
    'oddonePat oddoneLewd oddoneLOL oddonePat',
    'oddonePat oddonePat oddonePat oddonePat'
  ];

  const commandName = msg.trim();

  // If the command is known, let's execute it
  if (commandName === CONST.chatCommand && CONST.allowedUser.includes(userstate.username)) {
    for (let botMessage of botMessages) {
      client.say(channel, `${botMessage}`);
      await sleep(CONST.botDelayInMS);
    };
    console.log(`* Executed ${commandName} command`);
  } else {
    console.log(`* Unknown command ${commandName}`);
  };
}

function killAMeme(channel, username, message) {
  if (message.includes('staff') && message.includes('meme') && Math.trunc(CONST.limiter.getTokensRemaining())) {
    CONST.limiter.removeTokens(1, function (err, remainingRequests) {
      let botMessage = `@${username} a meme dies for every staff you rat out monkaGun pepeGun \\(@${CONST.sacList[Math.floor(Math.random()*CONST.sacList.length)]})/ :gun: oddoneVillain`;
      client.say(channel, botMessage);
      console.log(botMessage);
    });
  }
}

function welcome(channel, username, months) {
  let botMessage = `oddoneWel back ${username}! Here are (x${months}) oddonePat AYAYA AYAYA`;
  client.say(channel, botMessage);
  console.log(botMessage);
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}