const tmi = require('tmi.js');
const jokes = require('./jokes');
const trivias = require('./trivias');
const Constants = require('./const').Constants;
const util = require('./util');
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
    'stoner_minded',
    'ziggy'
  ]
};

// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on('chat', onChatHandler);
client.on('resub', onReSubHandler);
client.on('subscription', onSubHandler);
client.on("subgift", onSubGiftHandler);
client.on("submysterygift", onSubMysteryGiftHandler);
client.on("cheer", onCheerHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

// Called every time a message comes in
function onChatHandler(channel, userstate, msg, self) {
  if (self) { return; } // Ignore messages from the bot

  sendRandomJoke(channel, userstate.username, msg);
  startTrivia(channel, userstate.username, msg);
  collectUserAnswersToTrivia(userstate.username, msg);
  blockPyramid(channel, userstate.username, msg);
  //buildPyramid(channel, userstate.username, msg);
}

function onReSubHandler(channel, username, _months, msg, userstate, methods) {
  let months = (userstate && 'msg-param-cumulative-months' in userstate && userstate['msg-param-cumulative-months']) || 1; // ensure at least 1
  let botMessage = `Welcome back @${username} ziggyjHype ! Thank you for subscribing for (x${months}) month(s) ziggyjLove`;
  sendCustomMessage(channel, botMessage);
};

function onSubHandler(channel, username, method, msg, userstate) {
  let botMessage = `Thanks for subscribing @${username} ziggyjHype ! Welcome to the community ziggyjLove.`;
  sendCustomMessage(channel, botMessage);
};

function onSubGiftHandler(channel, username, _streakMonths, recipient, methods, userstate) {
  let botMessage = `Thank you @${username} for gifting @${recipient} a sub! ziggyjHype ziggyjLove`;
  sendCustomMessage(channel, botMessage);
}

function onSubMysteryGiftHandler(channel, username, numbOfSubs, methods, userstate) {
  let botMessage = `Thank you @${username} for gifting ${numbOfSubs} subs to the channel! ziggyjHype ziggyjLove`;
  sendCustomMessage(channel, botMessage);
}

function onCheerHandler(channel, userstate, message) {
  let botMessage = `Thanks for cheering ${userstate.bits} bit(s) and supporting the channel @${userstate.username}! ziggyjHype ziggyjLove`
  sendCustomMessage(channel, botMessage);
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler(addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}

startRandomJokeOnInterval('ziggy');

// Randomly spit out a joke at an interval
function startRandomJokeOnInterval(channel) {
  setInterval(function () {
    jokes.getRandomJoke()
      .then(function (response) {
        let botMessage = `Random Timed Joke: ${response.data} LUL`;
        sendCustomMessage(channel, botMessage);
      })
      .catch(function (error) {
        console.log('Error getting random joke\n.', error);
      });
  }, 900000); // 15 min interval
}

function sendRandomJoke(channel, username, msg) {
  let commandName = msg.trim();
  if (commandName === Constants.jokesCommand && util.hasTokensRemaining(Constants.jokesLimiter)) {
    Constants.jokesLimiter.tryRemoveTokens(1);
    jokes.getRandomJoke()
      .then(function (response) {
        let botMessage = `@${username} ${response.data} LUL`;
        sendCustomMessage(channel, botMessage);
      })
      .catch(function (error) {
        console.log('Error getting random joke\n.', error);
      });
  }
}

function blockPyramid(channel, username, msg) {
  let botMessage = `@${username} no`;
  if (shouldBlockPyramid(msg) && util.hasTokensRemaining(Constants.pyramidBlockLimiter)) {
    Constants.pyramidBlockLimiter.tryRemoveTokens(1);
    sendCustomMessage(channel, botMessage);
    return;
  }
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

async function buildPyramid(channel, username, msg) {
  let botMessages = [
    'Oiktmot',
    'Oiktmot Oiktmot',
    'Oiktmot Oiktmot Oiktmot',
    'Oiktmot Oiktmot',
    'Oiktmot'
  ];

  const commandName = msg.trim();

  // If the command is known, let's execute it
  if (commandName === Constants.chatCommand && Constants.allowedUser.includes(username)) {
    for (let botMessage of botMessages) {
      client.say(channel, `${botMessage}`);
      await util.sleep(200);
    };
    console.log(`* Executed ${commandName} command`);
  } else {
    console.log(`* Unknown command ${commandName}`);
  };
}

function sendCustomMessage(channel, botMessage) {
  client.say(channel, botMessage);
  console.log(botMessage);
}

function startTrivia(channel, username, msg) {
  let commandName = msg.trim();

  if (util.hasTokensRemaining(Constants.triviaLimiter) && commandName === Constants.triviaCommand && Constants.allowedUser.includes(username) && !Constants.triviaShouldCollectUserAnswers) {
    Constants.triviaLimiter.tryRemoveTokens(1);
    trivias.getRandomTrivia()
      .then(async function (triviaObject) {
        outputQuestionAndPossibleAnswers(channel, triviaObject);

        // release fullAnswer after x amount of time
        setTimeout(function () {
          releaseCorrectAnswerCallback(channel, triviaObject.fullAnswer);
        }, 15000);
      })
      .catch(function (error) {
        console.log('Error getting random trivia\n.', error);
      });
  }
}

async function outputQuestionAndPossibleAnswers(channel, triviaObject) {
  client.say(channel, triviaObject.question); // list question
  console.log(triviaObject);

  // set correct answer and start checking chat for their answers to the question
  Constants.triviaCorrectAnswerLetterChoice = triviaObject.answerLetterChoice;
  Constants.triviaShouldCollectUserAnswers = true;

  await util.sleep(250);

  // list possible answers
  for (let possible_answer of triviaObject.possible_answers) {
    client.say(channel, possible_answer);
    await util.sleep(250);
  }
}

function releaseCorrectAnswerCallback(channel, fullAnswer) {
  // stop collecting answers from chat
  Constants.triviaShouldCollectUserAnswers = false;
  Constants.triviaCorrectAnswerLetterChoice = '';

  let atLeastOneCorrectMessage = `Congrats - ${Constants.triviaUserAnsweredCorrectList.join(' ')} stonerPotato . ${fullAnswer}`;
  let noCorrectMessage = `Oof, nobody was correct stonerREE . ${Constants.triviaUserAnsweredCorrectList.join(' ')} ${fullAnswer}`;
  let correctAnswerMessage = Constants.triviaUserAnsweredCorrectList.length ? atLeastOneCorrectMessage : noCorrectMessage;

  // empties list for next question
  Constants.triviaUserAnsweredCorrectList.length = 0;

  sendCustomMessage(channel, correctAnswerMessage);
}

function collectUserAnswersToTrivia(username, msg) {
  if (Constants.triviaShouldCollectUserAnswers) {
    if (shouldAddUserAnsweredCorrectList(username, msg)) {
      Constants.triviaUserAnsweredCorrectList.push(`@${username}`);
    } else if (shouldRemoveUserAnsweredCorrectList(username, msg)) {
      util.removeElementFromArray(Constants.triviaUserAnsweredCorrectList, `@${username}`);
    }
  }
}

function shouldAddUserAnsweredCorrectList(username, msg) {
  return Constants.triviaCorrectAnswerLetterChoice === msg.toUpperCase() && !Constants.triviaUserAnsweredCorrectList.includes(`@${username}`);
}

function shouldRemoveUserAnsweredCorrectList(username, msg) {
  return Constants.triviaCorrectAnswerLetterChoice !== msg.toUpperCase() && Constants.triviaUserAnsweredCorrectList.includes(`@${username}`);
}