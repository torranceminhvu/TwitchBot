const RateLimiter = require('limiter').RateLimiter;

const Constants = {
  allowedUser: ['aquasniper1'],
  chatCommand: 'POGGERS',
  jokesCommand: '!badjokes',
  triviaCommand: '!trivia',
  pyramidBlockLimiter: new RateLimiter(1, 2000),
  jokesLimiter: new RateLimiter(1, 30000), // 30 seconds
  triviaLimiter: new RateLimiter(1, 20000), // 20 seconds
  firstLayer: '',
  secondLayer: '',
  triviaUserAnsweredCorrectList: [],
  triviaShouldCollectUserAnswers: false,
  triviaCorrectAnswerLetterChoice: ''
};

module.exports.Constants = Constants;