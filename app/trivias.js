const axios = require('axios');
const Entities = require('html-entities').XmlEntities;

const entities = new Entities();

function getRandomTrivia() {
  let url = 'https://opentdb.com/api.php?amount=1';
  return axios.get(url)
    .then(function (response) {
      return buildTriviaObject(response.data.results[0]);
    });
}

function buildTriviaObject(data) {
  let possible_answers = data.type == 'boolean' ? ['True', 'False'] : shuffleArray([...data.incorrect_answers, data.correct_answer]);
  return {
    question: `Question: ${decode(data.question)}`,
    possible_answers: formatPossibleAnswers(possible_answers),
    answer: formatAnswer(data.correct_answer, possible_answers)
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function formatPossibleAnswers(array) {
  let charCode = 65; // Starts at char code A
  return array.map(function (ele) {
    return `${String.fromCharCode(charCode++)}. ${decode(ele)}`;
  });
}

function formatAnswer(answer, choices) {
  let charCode = 65; // Starts at char code A;
  for (let val of choices) {
    if (val.includes(answer)) {
      return `Answer - ${decode(answer)} (${String.fromCharCode(charCode)})`;
    }
    charCode++;
  }
}

function decode(str) {
  return entities.decode(str);
}

module.exports.getRandomTrivia = getRandomTrivia;