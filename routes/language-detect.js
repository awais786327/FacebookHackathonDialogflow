'use strict';

const LanguageDetect = require('languagedetect');
const lang = new LanguageDetect();

const utils = {
  guess: guess
};

function guess(query) {
  if (typeof query === 'string') {
    return new Promise((resolve, reject) => {
      const probability = lang.detect(query);
      const result = language(probability);
      if (!result) {
        return reject(null);
      }
      return resolve(result);
    });
  }
  if (typeof query === "object") {
    let promises = [];
    for (let k = 0; k < query.length; k++) {
      const promise = new Promise((resolve, reject) => {
        const probability = lang.detect(query[k]);
        const result = language(probability);
        if (!result) {
          return reject(null);
        }
        return resolve(result);
      });
      promises.push(promise);
    }
    return Promise.all(promises)
  }
}

function language(arr) {
  if (!arr || !(arr && arr.length)) {
    return [];
  }

  let assumption = arr[0][1];
  for (let i = 1, len = arr.length; i < len; i++) {
    let current = arr[i][1];
    assumption = (current > assumption) ? current : assumption;
  }

  let prediction = null;
  for (let j = 0; j < arr.length; j++) {
    let current = arr[j];
    if (current[1] === assumption) {
      prediction = current[0];
      break;
    }
  }

  return prediction;
}

module.exports = utils;
