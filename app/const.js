const RateLimiter = require('limiter').RateLimiter;

const Constants = {
  allowedUser: ['aquasniper1'],
  pyramidBlockList: ['hikayami', 'aquasniper1', 'silverdragon504', 'voidgenom'],
  chatCommand: 'POGGERS',
  jokesCommand: '!badjokes',
  botDelayInMS: 200,
  limiter: new RateLimiter(1, 2000),
  pyramidBlockLimiter: new RateLimiter(3, 3500),
  killAMemeLimiter: new RateLimiter(1, 60000),
  jokesLimiter: new RateLimiter(1, 30000),
  sacList: [],
  firstLayer: '',
  secondLayer: ''
};

module.exports.Constants = Constants;