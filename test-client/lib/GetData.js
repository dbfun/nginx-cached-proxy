"use strict";

const
  connectTimeout = 10,
  maxTime = 30,
  maxFilesize = 3 * 1024 * 1024,
  { spawn } = require('child_process'),
  curlFormat = [
    'content_type',
    'http_code',
    'num_redirects',
    'time_redirect',
    'size_download',
    'time_namelookup',
    'time_connect',
    'time_appconnect',
    'time_pretransfer',
    'time_starttransfer',
    'time_total'
  ],
  curlFormatStr = '::curlResponseInfo::' + curlFormat.reduce((accumulator, currentValue) => { return accumulator + '%{' + currentValue +'}|||'; }, '').slice(0, -1),
  _ = require('lodash')
  ;

function getData(uri) {
  return new Promise((resolve, reject) => {

    let curlData = '';
    const curl = spawn('curl', ['-skL', '-w', curlFormatStr,
      '--connect-timeout', connectTimeout, '--max-time', maxTime, '--max-filesize', maxFilesize, uri]);

    curl.stdout.on('data', (data) => {
      curlData += data;
      if(curlData.length > maxFilesize) {
        reject({error: "Документ слишком большой"});
        curl.kill();
      }
    });

    curl.on('close', (code) => {
      if(code !== 0) {
        reject({error: "Не удалось получить содержимое документа"});
        return;
      }

      curlData = curlData.split('::curlResponseInfo::');

      curlData = {
        resp: curlData[0],
        info: _.zipObject(curlFormat, curlData[1].replace(/,/g, '.').split('|||'))
      }

      curlData.info = _.mapValues(curlData.info, (v, k) => {
        if(k == 'content_type') return v;
        return parseFloat(v);
      });

      resolve(curlData);
    });

  });


}

module.exports.getData = getData;
