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
    'tsm_theoddone'
  ]
};

// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on('chat', onChatHandler);
client.on('resub', onReSubHandler);
client.on('subscription', onSubHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

// Called every time a message comes in
function onChatHandler(channel, userstate, msg, self) {
  if (self) { return; } // Ignore messages from the bot

  tryUpdateSacList(userstate.username);

  sendRandomJoke(channel, userstate.username, msg);
  startTrivia(channel, msg);
  collectUserAnswersToTrivia(userstate.username, msg);
  blockPyramid(channel, userstate.username, msg);
  killAMeme(channel, userstate.username, msg.toLowerCase());
  //buildPyramid(channel, userstate.username, msg);
}

function onReSubHandler(channel, username, _months, msg, userstate, methods) {
  let months = (userstate && 'msg-param-cumulative-months' in userstate && userstate['msg-param-cumulative-months']) || 1; // ensure at least 1
  welcome(channel, username, months);
};

function onSubHandler(channel, username, method, msg, userstate) {
  welcome(channel, username, 1);
};

// Called every time the bot connects to Twitch chat
function onConnectedHandler(addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}

startRandomJokeOnInterval('tsm_theoddone');
clearSacListOnInterval();

// Randomly spit out a joke at an interval
function startRandomJokeOnInterval(channel) {
  setInterval(function () {
    jokes.getRandomJoke()
      .then(function (response) {
        let botMessage = `Random Timed Joke: ${response.data} LUL`;
        client.say(channel, botMessage);
        console.log(botMessage);
      })
      .catch(function (error) {
        console.log('Error getting random joke\n.', error);
      });
  }, 600000); // 10 min interval
}

function sendRandomJoke(channel, username, msg) {
  let commandName = msg.trim();
  if (commandName === Constants.jokesCommand && util.hasTokensRemaining(Constants.jokesLimiter)) {
    Constants.jokesLimiter.tryRemoveTokens(1);
    jokes.getRandomJoke()
      .then(function (response) {
        let botMessage = `@${username} ${response.data} LUL`;
        client.say(channel, botMessage);
        console.log(botMessage);
      })
      .catch(function (error) {
        console.log('Error getting random joke\n.', error);
      });
  }
}

function blockPyramid(channel, username, msg) {
  let botMessage = `@${username} a chatter is sacced for every pyramid you fail monkaGun pepeGun @${Constants.sacList[Math.floor(Math.random()*Constants.sacList.length)]} :gun: oddoneVillain`;
  if (shouldBlockPyramid(msg) && util.hasTokensRemaining(Constants.limiter)) {
    Constants.limiter.tryRemoveTokens(1);
    client.say(channel, botMessage);
    console.log(`${username}'s pyramid was blocked`);
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

function killAMeme(channel, username, msg) {
  if (msg.includes('staff') /*&& msg.includes('meme')*/ && util.hasTokensRemaining(Constants.killAMemeLimiter)) {
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

function startTrivia(channel, msg) {
  //TODO: do a check to make sure that this cant run until the answer to the previous one has been released
  let commandName = msg.trim();

  if (util.hasTokensRemaining(Constants.triviaLimiter) && commandName === Constants.triviaCommand && !Constants.triviaShouldCollectUserAnswers) {
    Constants.triviaLimiter.tryRemoveTokens(1);
    trivias.getRandomTrivia()
      .then(async function (triviaObject) {
        outputQuestionAndPossibleAnswers(channel, triviaObject);

        // release fullAnswer after x amount of time
        setTimeout(function () {
          releaseCorrectAnswerCallback(channel, triviaObject.fullAnswer);
        }, 10000);
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

  let atLeastOneCorrectMessage = `Congrats - ${Constants.triviaUserAnsweredCorrectList.join(' ')} AYAYA. ${fullAnswer}`;
  let noCorrectMessage = `Oof, nobody was correct oddoneClown . ${Constants.triviaUserAnsweredCorrectList.join(' ')} ${fullAnswer}`;
  let correctAnswerMessage = Constants.triviaUserAnsweredCorrectList.length ? atLeastOneCorrectMessage : noCorrectMessage;

  // empties list for next question
  Constants.triviaUserAnsweredCorrectList.length = 0;

  client.say(channel, correctAnswerMessage);
  console.log(correctAnswerMessage);
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