'use strict';

// const dialogflow = require('dialogflow');
// const localStorage = require('local-storage');

const axios = require('axios');
const moment = require('moment');
const express = require('express');
const settings = require('../settings');
const router = express.Router();
const {WebhookClient} = require('dialogflow-fulfillment');

const BitlyClient = require('bitly').BitlyClient;
const bitly = new BitlyClient(settings.bitlyAccessToken);

const iftttEvents = {
  findPhone: 'call_phone',
  createEvent: 'google_calendar',
  reminder: 'reminder',
  urlShortener: 'url_shortener',
  postOnSlack: 'slack_message',
};

const googleDrive = require('./google-drive');
const languageDetect = require('./language-detect');
const weatherDetect = require('./weather-detect');
const coronaVirus = require('./corona-virus');

router.get('/', (req, res, next) => {
  res.render('index');
  // res.send(`Server is up and running.`);
});

router.post('/webhook', (req, res, next) => {

  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  const agent = new WebhookClient({request: req, response: res});

  const {locale} = agent;

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
        agent.add(`Hold on, let's give it a call\n\nRinging..`);
        return agent.add(`Do you want to try others ?`);
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

  function guessLanguageMessage(str) {
    const messages = [
      `well i could be wrong`,
      `ummm if i am not wrong`,
      `well i might be wrong`,
    ];
    return (messages[Math.floor(Math.random() * messages.length)] + '\n' + str);
  }

  function getRandomMessage(messages) {
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
        agent.add(`This is not a valid URL`);
        return agent.add(`URL must start with https:// followed by URL\ne.g: https://www.google.com`);
      });
  }

  function computerHacks(agent) {
    const type = agent.parameters.type;
    return googleDrive.createFile(type)
      .then(function (response) {
        // const { data } = response;
        // console.log(`\n`);
        // console.log(data);
        // console.log(`\n`);
        agent.add(`Got it, turning your system ${type}..\n\nDone`);
        return agent.add(`Do you want to try others ?`);
      })
      .catch(function (error) {
        console.log(error);
        return agent.add(`I'm sorry, can you try again?`);
      });
  }

  function slackAnnouncement(agent) {
    const message = agent.parameters.message;
    const url = getUrl('postOnSlack') + '?value1=' + message;
    return axios.get(url)
      .then(function (response) {
        const { data } = response;
        console.log(`\n`);
        console.log(url);
        console.log(`\n`);
        console.log(data);
        console.log(`\n`);
        agent.add(`Sending..`);
        return agent.add(`Done`);
      })
      .catch(function (error) {
        console.log(error);
        return agent.add(`I'm sorry, can you try again?`);
      });
  }

  function guessLanguage(agent) {
    const query = agent.parameters.query.split(',');
    console.log('guess language query > ', query);
    return languageDetect.guess(query)
      .then(res => {
        console.log(`\n`);
        console.log(res);
        console.log(`\n`);
        if (res && res.length) {
          const prediction = `i think it's `  + res.toString().replace(/,/g, ', ');
          agent.add(`${guessLanguageMessage(prediction)}`);
        } else {
          agent.add(`Oops very hard you know 😂 let's play one more time`);
        }
        return agent.add('Do you want to play again ?');
      })
      .catch(err => {
        console.log('err ', err);
        return agent.add(`I'm sorry, can you try again?`);
      });
  }

  function guessLanguagePlayAgain(agent) {
    agent.context.set({
      'name': 'GuessLanguage-followup',
      'lifespan': 1,
    });
    return agent.add('Write comma separated sentences in different languages and see if i am able to guess properly');
  }

  function computerHacksPlayAgain(agent) {
    agent.context.set({
      'name': 'awaiting_option_type',
      'lifespan': 1,
    });
    const messages = ['Tell me which one ?', 'Alright, which one ?', 'Ok which one ?', 'Which one ?'];
    agent.add(getRandomMessage(messages));
    return agent.add(
      'lock\n' +
      'sleep\n' +
      'screen off\n' +
      'mute\n' +
      'unmute\n' +
      'logout\n' +
      'restart\n' +
      'shutdown'
    );
  }

  function searchGithubUser(agent) {
    const user = agent.parameters.user;
    const url = settings.githubBaseUrl + user;
    return axios.get(url)
      .then(function (response) {
        const { name, created_at } = response.data;
        const date = moment(new Date(created_at)).format("DD MMM YYYY");
        console.log(`\n`);
        console.log(url);
        console.log(`\n`);
        console.log(response.data);
        console.log(`\n`);
        agent.add(`${name} joined Github on ${date}.`);
        return agent.add(`Would you like to know more ?`);
      })
      .catch(function (error) {
        console.log(error);
        return agent.add(`I'm sorry, can you try again?`);
      });
  }

  function searchGithubUserDetails(agent) {
    const userContext = agent.context.get('searchgithub-user-followup').parameters;
    const user = userContext.user;
    const url = settings.githubBaseUrl + user;
    return axios.get(url)
      .then(function (response) {
        const {
          name, bio, location, company, public_repos, public_gists, followers, html_url
        } = response.data;
        const profession = `${name} is a ${bio}\n`;
        const living = `currently living in ${location}\n`;
        const work = `works at ${company}\n`;
        const repos = `has ${public_repos} public repo's and ${public_gists} public gist's\n`;
        const publicFigure = `with ${followers} fan following public figures\n`;
        const about = '\n' + profession + living + (company ? work : '') + repos + publicFigure + '\n';
        const details = about + '\n'+ `You can learn more about this person here\n`;
        const profile = details + '\n' + html_url;
        console.log('profile ' , profile);
        return agent.add(profile);
      })
      .catch(function (error) {
        console.log(error);
        return agent.add(`I'm sorry, can you try again?`);
      });
  }

  function findByIpAddress(agent) {
    const ip = agent.parameters.ip.toString();
    const ipConfig = settings.ipInfo;
    const url = ipConfig.url + '/' + ip + '?token=' + ipConfig.accessToken;
    return axios.get(url)
      .then(function (response) {
        const { city, region, country, loc } = response.data;
        const result = `${city}, ${region}, ${country}`;
        console.log(`\n`);
        console.log(`IP : `, ip);
        console.log(`\n`);
        console.log(result);
        console.log(`\n`);
        // const maps = `https://www.google.com/maps/@${loc}`;
        const maps = `https://maps.google.com/maps?q=loc:${loc}&z=11`;
        agent.add(`There you go\n\n${result}\n\n${maps}`);
        return agent.add('Do you want to trace another IP Address details ?');
      })
      .catch(function (error) {
        console.log(error);
        return agent.add(`I could't trace the IP address at the moment please try a little bit later`);
      });
  }

  function findByIpAddressYes(agent) {
    agent.context.set({
      'name': 'FindbyIPAddress-followup',
      'lifespan': 1,
    });
    return agent.add('Ok then tell me the IP Address please');
  }

  function coronaVirusUpdates(agent) {
    return coronaVirus
      .getLatestUpdates()
      .then(csvRow => {
        const size = 3;
        const first3Data = csvRow.slice(0, size).map(el => el);
        console.log(`\n`);
        console.log(first3Data);
        console.log(`\n`);
        const time = moment(first3Data[0]['Last Update']).fromNow();
        let takeCareMessages = [
          `Please take care of yourself and the people around\n\n`,
          `CDC expects 'community spread' of coronavirus, as top official warns\n\n`,
          `Coronavirus has been identified as the cause of a disease so take the usual precautions to help prevent the spread of this respiratory virus\n\n`,
        ];
        let updates = `here's the latest updates\n\n`;
        updates += getRandomMessage(takeCareMessages);
        first3Data.map(obj => {
          let detail = `${obj['Province/State']} . ${obj['Country/Region']}\n`;
          detail += `Confirmed : ${obj['Confirmed']}\nDeaths : ${obj['Deaths']}\nRecovered : ${obj['Recovered']}\n\n`;
          updates += detail
        });
        updates += `about ${time}.`;
        agent.add(updates);
        return agent.add(`Would you like to see more details's ?`);
      })
      .catch(error => {
        console.log(error);
        agent.add(`See the latest updates here`);
        return agent.add(`https://systems.jhu.edu/research/public-health/ncov/`);
      });
  }

  function coronaVirusUpdatesYes(agent) {
    return coronaVirus
      .getLatestUpdates()
      .then(csvRow => {
        const links = coronaVirus.getLatestUpdatesUrl();
        console.log(`\n`);
        console.log(links);
        agent.add(`There you go\n`);
        return agent.add(`See more result's here\n\n${links[0].url}\n\nLearn more here\n\n${links[1].url}`);
      })
      .catch(error => {
        console.log(error);
        agent.add(`See the latest updates here`);
        return agent.add(`https://systems.jhu.edu/research/public-health/ncov/`);
      });
  }

  function checkWeather(agent) {
    let {session, query} = agent;
    let payload = {
      query: query,
      session: session.toString().split('/').pop(),
      languageCode: locale
    };
    return weatherDetect.check(payload)
      .then(res => {
        const {queryText, fulfillmentText} = res[0].queryResult;
        const reply = {
          query: queryText,
          response: fulfillmentText,
        };
        console.log(`Reply: `, reply);
        // agent.context.set({
        //   'name': 'CheckWeather-followup',
        //   'lifespan': 1,
        // });
        return agent.add(reply.response);
      })
      .catch(err => {
        console.log(`error: `, err);
        return agent.end(`looks like its clear ☁`);
      });
  }

  let intentMap = new Map();
  intentMap.set('Search Github - user', searchGithubUser);
  intentMap.set('Search Github - user - details - yes', searchGithubUserDetails);
  intentMap.set('Find Phone', findPhone);
  intentMap.set('Create Event - write', createEvent);
  intentMap.set('Reminder', reminder);
  intentMap.set('Url Shortener', urlShortener);
  intentMap.set('Computer Hacks - options', computerHacks);
  intentMap.set('Computer Hacks - Play Again - yes', computerHacksPlayAgain);
  intentMap.set('Slack Announcement - write', slackAnnouncement);
  intentMap.set('Guess Language - write', guessLanguage);
  intentMap.set('Guess Language - Play Again - yes', guessLanguagePlayAgain);
  intentMap.set('Find by IP Address', findByIpAddress);
  intentMap.set('Find by IP Address - yes', findByIpAddressYes);
  intentMap.set('Check Weather', checkWeather);
  intentMap.set('Check Weather - city or country', checkWeather);
  intentMap.set('Corona Virus Updates', coronaVirusUpdates);
  intentMap.set('Corona Virus Updates - yes', coronaVirusUpdatesYes);
  agent.handleRequest(intentMap);

});

module.exports = router;
