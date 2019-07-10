"use strict";

const
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

function getData(uri, send_cookie, clientMaxTime) {
  return new Promise((resolve, reject) => {

    let curlData = '';
    let curlParams = ['-skLi', '-w', curlFormatStr, '--max-time', clientMaxTime, uri];
    if(send_cookie === "on") {
      curlParams.push("--cookie");
      curlParams.push(`client_cookie=${Math.random().toString()}`);
    }
    const curl = spawn('curl', curlParams);

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

      let headersAndData = curlData[0].split(/\r\n/);

      curlData = {
        info: _.zipObject(curlFormat, curlData[1].replace(/,/g, '.').split('|||')),
        headers: {},
        body: ""
      }

      let isHeadSect = true;
      let isFirstBody = true;
      headersAndData.forEach(v => {
        if(isHeadSect && v === "") {
          isHeadSect = false;
          return;
        }
        if(isHeadSect) {
          let m = v.match(/^(.*?):\s*(.*?)$/)
          if(m) {
            curlData.headers[m[1]] = m[2];
          }
        } else {
          curlData.body += isFirstBody ? v : "\r\n" + v;
          isFirstBody = false;
        }
      });

      curlData.info = _.mapValues(curlData.info, (v, k) => {
        if(k == 'content_type') return v;
        return parseFloat(v);
      });

      resolve(curlData);
    });

  });


}

module.exports.getData = getData;
