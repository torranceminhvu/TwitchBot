const RateLimiter = require('limiter').RateLimiter;

const Constants = {
  allowedUser: ['aquasniper1'],
  pyramidBlockList: ['hikayami', 'aquasniper1', 'silverdragon504'],
  chatCommand: 'POGGERS',
  jokesCommand: '!jokes',
  botDelayInMS: 200,
  limiter: new RateLimiter(1, 2000),
  pyramidBlockLimiter: new RateLimiter(3, 3500),
  killAMemeLimiter: new RateLimiter(1, 10000),
  jokesLimiter: new RateLimiter(1, 5000),
  sacList: [],
  firstLayer: '',
  secondLayer: ''
};

module.exports.Constants = Constants;