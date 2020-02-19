'use strict';

const fs = require('fs');
const { google } = require('googleapis');
const credentials = require('../cred/facebookhackathon-service-account');
const scopes = [
  'https://www.googleapis.com/auth/drive'
];
const auth = new google.auth.JWT(
  credentials.client_email, null,
  credentials.private_key, scopes
);
const drive = google.drive({ version: "v3", auth });

const utils = {
  createFile: createFile
};

function createFile(content) {
  const file = require(`../system/${content}.txt`);
  return new Promise((resolve, reject) => {
    const fileMetaData = {
      name: 'computerAction.txt',
      // parents: ['']
    };
    const media = {
      mimeType: 'text/plain',
      body: fs.createReadStream(file)
    };
    return drive.files.create({
      resource: fileMetaData,
      media: media,
      fields: 'id'
    }, function (err, res) {
      console.log('err, res', err, !!res);
      if (err) {
        return reject(err);
      }
      return resolve(res);
    });
  });
}

module.exports = utils;
