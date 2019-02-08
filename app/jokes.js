const axios = require('axios');

function getRandomJoke() {
  let headers = {
    'Accept': 'text/plain'
  };
  return axios.get('https://icanhazdadjoke.com/', { headers: headers });
}

module.exports.getRandomJoke = getRandomJoke;