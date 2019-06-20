"use strict";

const
  uri = 'http://localhost/cycle/timeout/10/5',
  interval = 100,
  {getData} = require('./lib/GetData'),
  colors = {
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    Bred: "\x1b[1;31m",
    Bgreen: "\x1b[1;32m",
    Byellow: "\x1b[1;33m",
    Bblue: "\x1b[1;34m",
    nc: "\x1b[0m"
  }
  ;

console.log(`URI: ${colors.Bblue}${uri}${colors.nc}`);

setInterval(() => {

  getData(uri).then(data => {
    let is20x = data.info.http_code >= 200 && data.info.http_code < 300;
    let is40x = data.info.http_code >= 400 && data.info.http_code < 500;
    let is50x = data.info.http_code >= 500 && data.info.http_code < 600;
    process.stdout.write(is20x ? `${colors.Bgreen}+${colors.nc}` : `${colors.Bred}-${colors.nc}`);
  }).catch(err => {
    console.log(err);
  });

}, interval);
