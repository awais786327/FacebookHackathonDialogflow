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
  const file = `../system/${content}.txt`;
  console.log('file >> ', file);
  return new Promise((resolve, reject) => {
    const resource = {
      name: 'computerAction.txt',
      parents: ['1pjU2S5amKQfFrvJa6Iq-ecNPoBTsMGMB']
    };
    const media = {
      mimeType: 'text/plain',
      body: fs.createReadStream(file)
    };
    return drive.files.create({
      resource: resource,
      media: media,
      fields: 'id'
    }, function (err, res) {
      console.log('err >> ', err);
      if (err) {
        return reject(err);
      }
      return resolve(res);
    });
  });
}

module.exports = utils;
