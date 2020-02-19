'use strict';

// const dialogflow = require('dialogflow');
// const localStorage = require('local-storage');

const axios = require('axios');
const moment = require('moment');
const express = require('express');
const settings = require('settings');
const router = express.Router();
const {WebhookClient} = require('dialogflow-fulfillment');

const BitlyClient = require('bitly').BitlyClient;
const bitly = new BitlyClient(settings.bitlyAccessToken);

const iftttEvents = {
  findPhone: 'call_phone',
  createEvent: 'google_calendar',
  reminder: 'reminder',
  urlShortener: 'url_shortener',
};

const utils = require('./google-drive');

router.get('/', (req, res, next) => {
  res.send(`Server is up and running.`);
});

router.post('/webhook', (req, res, next) => {

  // console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  // console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  const agent = new WebhookClient({request: req, response: res});

  function getUrl(type) {
    return `https://maker.ifttt.com/trigger/${iftttEvents[type]}/with/key/${settings.iftttKey}`;
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
      `No problem i'll remind 🔔`,
      `Don't worry i'll give a reminder 🔔`,
      `Alright i'll do it 🔔`,
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  function reminder(agent) {
    const format = "DD/MM/YYYY HH:mm:ss";
    const then = moment(new Date(agent.parameters.time), format);
    const now = moment(new Date(), format);
    const ms = then.diff(now);
    const reminderTime = moment.duration(ms).valueOf();
    const isAfter = moment(then).isAfter(now);

    if (!isAfter) {
      return agent.add(`You can't make a reminder in the past. Please try again!`);
    }

    agent.add(getReminderMessage());

    // trigger reminder after internal of time
    return setTimeout(() => {
      const url = getUrl('reminder');
      return axios.get(url)
        .then(function (response) {
          const { data } = response;
          console.log(`\n`);
          console.log(url);
          console.log(`\n`);
          console.log(data);
          console.log(`\n`);
        })
        .catch(function (error) {
          console.log(error);
          return agent.add(`I'm sorry, can you try again?`);
        });
    }, reminderTime);
  }

  function urlShortener(agent) {
    const longUrl = agent.parameters.url;
    return bitly
      .shorten(longUrl)
      .then(function(result) {
        console.log(`\n`);
        console.log('result ', result);
        console.log(`\n`);
        agent.add(`there you go`);
        return agent.add(result.url);
      })
      .catch(function(error) {
        console.log(error);
        return agent.add(`I'm sorry, can you try again?`);
      });
  }

  function computerHacks(agent) {
    const type = agent.parameters.type;
    return utils.createFile(type)
      .then(function (response) {
        const { data } = response;
        console.log(`\n`);
        console.log(response);
        console.log(`\n`);
        agent.add(`Got it, turning your system ${type}..`);
        return agent.add(`Done`);
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
  intentMap.set('Url Shortener', urlShortener);
  intentMap.set('Computer Hacks', computerHacks);
  agent.handleRequest(intentMap);

});

module.exports = router;
