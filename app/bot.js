const tmi = require('tmi.js');
const jokes = require('./jokes');
const Constants = require('./const').Constants;
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

  tryUpdateSacList(userstate.username);

  sendRandomJoke(channel, userstate, msg);
  //blockPyramid(channel, userstate, msg);
  //killAMeme(channel, userstate.username, msg.toLowerCase());
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

// Randomly spit out a joke at an interval
setInterval(function () {
  jokes.getRandomJoke()
    .then(function (response) {
      let botMessage = `Random Timed Joke: ${response.data} LUL`;
      client.say('tsm_theoddone', botMessage);
      console.log(botMessage);
    })
    .catch(function (error) {
      console.log('Error getting random joke\n.', error);
    });
}, 600000); // 10 min interval

clearSacListOnInterval();

function sendRandomJoke(channel, userstate, msg) {
  let commandName = msg.trim();
  if (commandName === Constants.jokesCommand && hasTokensRemaining(Constants.jokesLimiter)) {
    Constants.jokesLimiter.tryRemoveTokens(1);
    jokes.getRandomJoke()
      .then(function (response) {
        let botMessage = `@${userstate.username} ${response.data} LUL`;
        client.say(channel, botMessage);
        console.log(botMessage);
      })
      .catch(function (error) {
        console.log('Error getting random joke\n.', error);
      });
  }
}

function blockPyramid(channel, userstate, msg) {
  let botMessage = `@${userstate.username} a chatter is sacced for every pyramid you fail monkaGun pepeGun @${Constants.sacList[Math.floor(Math.random()*Constants.sacList.length)]} :gun: oddoneVillain`;
  if (shouldBlockPyramid(msg) && /*Constants.pyramidBlockList.includes(userstate.username) &&*/ hasTokensRemaining(Constants.limiter)) {
    Constants.limiter.tryRemoveTokens(1);
    client.say(channel, botMessage);
    console.log(`${userstate.username}'s pyramid was blocked`);
    //Constants.pyramidBlockLimiter = new RateLimiter(3, 2000);
    return;
  }

  // backup blocker that will essentially just rate limit the user message rate
  // if (Constants.pyramidBlockList.includes(userstate.username) && !Constants.pyramidBlockLimiter.tryRemoveTokens(1)) {
  //   client.say(channel, botMessage);
  //   Constants.pyramidBlockLimiter = new RateLimiter(3, 2000);
  // }
}

function setFirstLayer(msg) {
  Constants.firstLayer = msg;
  Constants.secondLayer = '';
}

function setSecondLayer(msg) {
  Constants.secondLayer = msg;
}

function shouldBlockPyramid(msg) {
  let firstEmoteToCheck = msg.split(' ')[0];
  let numOfEmoteOccurences = msg.split(firstEmoteToCheck).length - 1;

  if (numOfEmoteOccurences === 1) {
    setFirstLayer(firstEmoteToCheck);
  } else if (numOfEmoteOccurences === 2) {
    setSecondLayer(firstEmoteToCheck);
  } else if (numOfEmoteOccurences === 3) {
    if (Constants.secondLayer === firstEmoteToCheck && Constants.firstLayer === firstEmoteToCheck) {
      setFirstLayer('');
      return true;
    }
    setFirstLayer('');
  } else {
    setFirstLayer('');
  }

  return false;
}

async function buildPyramid(channel, userstate, msg) {
  let botMessages = [
    'Oiktmot',
    'Oiktmot Oiktmot',
    'Oiktmot Oiktmot Oiktmot',
    'Oiktmot Oiktmot',
    'Oiktmot'
  ];

  const commandName = msg.trim();

  // If the command is known, let's execute it
  if (commandName === Constants.chatCommand && Constants.allowedUser.includes(userstate.username)) {
    for (let botMessage of botMessages) {
      client.say(channel, `${botMessage}`);
      await sleep(Constants.botDelayInMS);
    };
    console.log(`* Executed ${commandName} command`);
  } else {
    console.log(`* Unknown command ${commandName}`);
  };
}

function killAMeme(channel, username, message) {
  if (message.includes('staff') /*&& message.includes('meme')*/ && hasTokensRemaining(Constants.killAMemeLimiter)) {
    Constants.killAMemeLimiter.tryRemoveTokens(1);
    let botMessage = `@${username} a meme dies for every staff you rat out monkaGun pepeGun \\(@${Constants.sacList[Math.floor(Math.random()*Constants.sacList.length)]})/ :gun: oddoneVillain`;
    client.say(channel, botMessage);
    console.log(botMessage);
  }
}

function welcome(channel, username, months) {
  let botMessage = `oddoneWel back @${username} ! Here are (x${months}) oddonePat oddonePat AYAYA AYAYA`;
  client.say(channel, botMessage);
  console.log(botMessage);
}

function tryUpdateSacList(username) {
  if (!Constants.sacList.includes(username)) {
    Constants.sacList.push(username);
  }
}

function clearSacListOnInterval() {
  setInterval(function () {
    Constants.sacList.length = 0;
  }, 600000); // 10 min interval
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function hasTokensRemaining(rateLimiter) {
  return Math.trunc(rateLimiter.getTokensRemaining()) ? true : false;
}