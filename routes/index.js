'use strict';

const axios = require('axios');
const express = require('express');
const router = express.Router();
// const dialogflow = require('dialogflow');
// const localStorage = require('local-storage');
const {WebhookClient} = require('dialogflow-fulfillment');

const iftttKey = 'd4cxtJXjAKGJdNvr4Gpz2WiWfFIX-3AHUOtS10bGKPs';

router.get('/', (req, res, next) => {
  res.send(`Server is up and running.`);
});

router.post('/webhook', (req, res, next) => {

  // console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  // console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  const agent = new WebhookClient({request: req, response: res});

  function getUrl(type) {
    const iftttEvents = {
      findPhone: 'call_phone',
      createEvent: 'google_calendar'
    };
    return `https://maker.ifttt.com/trigger/${iftttEvents[type]}/with/key/${iftttKey}`;
  }

  function createEvent(agent) {
    const url = getUrl('createEvent');
    console.log(url);
    return axios.get(url)
      .then(function (response) {
        const { data } = response;
        console.log(`\n`);
        console.log(data);
        console.log(`\n`);
        agent.add(`Hold on, adding it to your calendar..`);
        return agent.add(`Done`);
      })
      .catch(function (error) {
        console.log(error);
        return agent.add(`I'm sorry, can you try again?`);
      });
  }

  function findPhone(agent) {
    const url = getUrl('findPhone');
    console.log(url);
    return axios.get(url)
      .then(function (response) {
        const { data } = response;
        console.log(`\n`);
        console.log(data);
        console.log(`\n`);
        return agent.add(`Hold on, let's give it a call`);
      })
      .catch(function (error) {
        console.log(error);
        return agent.add(`I'm sorry, can you try again?`);
      });
  }

  let intentMap = new Map();
  intentMap.set('Find Phone', findPhone);
  intentMap.set('Create Event', createEvent);
  agent.handleRequest(intentMap);

});

module.exports = router;
