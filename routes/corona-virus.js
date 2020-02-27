'use strict';

const axios = require('axios');
const moment = require('moment');
const csv = require('csvtojson');

moment.updateLocale('en', {
  relativeTime: {
    future: "in %s",
    past:   "%s ago",
    s:  "seconds",
    m:  "1 minute",
    mm: "%d minutes",
    h:  "1 hour",
    hh: "%d hours",
    d:  "1 day",
    dd: "%d days",
    M:  "1 month",
    MM: "%d months",
    y:  "1 year",
    yy: "%d years"
  }
});

const baseUrl = `https://raw.githubusercontent.com/CSSEGISandData/COVID-19`;
const branch = `master`;
const directory = `csse_covid_19_data`;
const dailyReports = `csse_covid_19_daily_reports`;
const yesterday = moment().subtract(1, 'days').format('MM-DD-YYYY');
const file = `${yesterday}.csv`;

const url = `${baseUrl}/${branch}/${directory}/${dailyReports}/${file}`;

const utils = {
  getLatestUpdates: getLatestUpdates,
  getLatestUpdatesUrl: getLatestUpdatesUrl
};

function getLatestUpdatesUrl() {
  return url;
}

function getLatestUpdates() {
  return axios.get(url)
    .then(function (response) {
      const { data } = response;
      return csv()
        .fromString(data)
    })
    .catch(function (error) {
      console.log(error);
    });
}

module.exports = utils;
