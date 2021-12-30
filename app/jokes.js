const axios = require('axios');

function getRandomJoke() {
  let headers = {
    'Accept': 'text/plain',
    'User-Agent': 'aquasniper1_twitch_bot'
  };
  return axios.get('https://icanhazdadjoke.com/', { headers: headers });
}

module.exports.getRandomJoke = getRandomJoke;