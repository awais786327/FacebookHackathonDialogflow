'use strict';

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
  return new Promise((resolve, reject) => {
    return drive.files.create({
      requestBody: {
        name: 'computerAction.txt',
        mimeType: 'text/plain'
      },
      media: {
        mimeType: 'text/plain',
        body: content
      }
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
