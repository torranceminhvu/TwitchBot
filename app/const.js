const RateLimiter = require('limiter').RateLimiter;

const Constants = {
  allowedUser: ['aquasniper1'],
  chatCommand: 'POGGERS',
  jokesCommand: '!badjokes',
  triviaCommand: '!trivia',
  limiter: new RateLimiter(1, 2000),
  killAMemeLimiter: new RateLimiter(1, 60000),
  jokesLimiter: new RateLimiter(1, 30000),
  triviaLimiter: new RateLimiter(1, 30000),
  sacList: [],
  firstLayer: '',
  secondLayer: '',
  triviaUserAnsweredCorrectList: [],
  triviaShouldCollectUserAnswers: false,
  triviaCorrectAnswerLetterChoice: ''
};

module.exports.Constants = Constants;