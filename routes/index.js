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
      createEvent: 'google_calendar',
      reminder: 'reminder'
    };
    return `https://maker.ifttt.com/trigger/${iftttEvents[type]}/with/key/${iftttKey}`;
  }

  function createEvent(agent) {
    const description = agent.parameters.description;
    const url = getUrl('createEvent') + '?value1=' + description;
    return axios.get(url)
      .then(function (response) {
        const { data } = response;
        console.log(`\n`);
        console.log(url);
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
    return axios.get(url)
      .then(function (response) {
        const { data } = response;
        console.log(`\n`);
        console.log(url);
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

  function getReminderMessage() {
    const messages = [
      `No problem i'll remind`,
      `Don't worry i'll give a reminder`,
      `Alright i'll do it`,
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  function reminder(agent) {
    const time = agent.parameters.time;

    const actualTime = new Date(time).getTime();
    const now = new Date().getTime();

    if (actualTime < now) {
      return agent.add(`You can't make a reminder in the past. Please try again!`);
    }

    const reminderTime = new Date(actualTime - now);

    const url = getUrl('reminder');
    return axios.get(url)
      .then(function (response) {
        const { data } = response;
        setTimeout(() => {
          console.log('TIMEOUT :: ', reminderTime.getMilliseconds());
          console.log('TIMEOUT :: ', reminderTime.getSeconds());
          console.log('TIMEOUT :: ', reminderTime.getMinutes());
          console.log('TIMEOUT :: ', reminderTime.getHours());
        });
        console.log(`\n`);
        console.log(url);
        console.log(`\n`);
        console.log(data);
        console.log(`\n`);
        return agent.add(getReminderMessage());
      })
      .catch(function (error) {
        console.log(error);
        return agent.add(`I'm sorry, can you try again?`);
      });
  }

  let intentMap = new Map();
  intentMap.set('Find Phone', findPhone);
  intentMap.set('Create Event', createEvent);
  intentMap.set('Reminder', reminder);
  agent.handleRequest(intentMap);

});

module.exports = router;
