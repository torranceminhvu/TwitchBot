function removeElementFromArray(array, eleToRemove) {
  var index = array.indexOf(eleToRemove);
  if (index !== -1) {
    array.splice(index, 1);
  }
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function hasTokensRemaining(rateLimiter) {
  return Math.trunc(rateLimiter.getTokensRemaining()) ? true : false;
}

module.exports.removeElementFromArray = removeElementFromArray;
module.exports.sleep = sleep;
module.exports.hasTokensRemaining = hasTokensRemaining;