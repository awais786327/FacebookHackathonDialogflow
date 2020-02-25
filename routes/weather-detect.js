'use strict';

const dialogflow = require('dialogflow');

const utils = {
  check: check
};

function check(payload) {
  return new Promise((resolve, reject) => {
    const config = {
      keyFilename: 'cred/weatherassistantbot-service-account.json',
    };
    const sessionClient = new dialogflow.SessionsClient(config);
    const sessionId = payload.session;
    const projectId = 'weatherassistantexpress-mhdxsf';
    const sessionPath = sessionClient.sessionPath(projectId, sessionId);
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          // The query to send to the dialogflow agent
          text: payload.query,
          // The language used by the client e.g(en-US)
          languageCode: payload.languageCode,
        },
      },
    };
    return sessionClient.detectIntent(request)
      .then(res => {
        return resolve(res)
      })
      .catch(err => {
        return reject(err)
      });
  });
}

module.exports = utils;
