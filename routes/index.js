'use strict';

const axios = require('axios');
const express = require('express');
const router = express.Router();
const dialogflow = require('dialogflow');
const {WebhookClient} = require('dialogflow-fulfillment');

router.get('/', (req, res, next) => {
  res.send(`Server is up and running.`);
});

router.post('/webhook', (req, res, next) => {

  // console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  // console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  const agent = new WebhookClient({request: req, response: res});

  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }

  function fallback(agent) {
    agent.add(`I didn't understand`);
  }

  function findMyPhone(agent) {
    return axios.get('https://maker.ifttt.com/trigger/test/with/key/d4cxtJXjAKGJdNvr4Gpz2WiWfFIX-3AHUOtS10bGKPs')
      .then(function (response) {
        console.log(response);
        return agent.add(`On the way`);
      })
      .catch(function (error) {
        console.log(error);
        return agent.add(`I'm sorry, can you try again?`);
      });
  }

  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('Find My Phone', findMyPhone);
  agent.handleRequest(intentMap);

});

module.exports = router;
