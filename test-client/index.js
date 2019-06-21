"use strict";

const
  uri = process.env.endpointUri || 'http://localhost/cycle/timeout/6/4',
  interval = process.env.clientReqInterval || 100,
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


    let proxyCodeColor;

    switch(true) {
      case data.info.http_code >= 200 && data.info.http_code < 300:
        proxyCodeColor = `${colors.Bgreen}20x${colors.nc}`;
        break;
      case data.info.http_code >= 400 && data.info.http_code < 500:
        proxyCodeColor = `${colors.Byellow}40x${colors.nc}`;
        break;
      case data.info.http_code >= 500 && data.info.http_code < 600:
        proxyCodeColor = `${colors.Bred}50x${colors.nc}`;
        break;
      default:
        proxyCodeColor = `${colors.Bblue}???${colors.nc}`;
    }

    let XCacheStatus = data.headers['X-Cache-Status'] || '-';
    let XUpstreamStatus = data.headers['X-Upstream-Status'] || '-';
    let XTime = data.headers['X-Time'] || '-';

    console.log(
      `Proxy: ${proxyCodeColor} Server: ${colors.yellow}${XCacheStatus} ${XUpstreamStatus} ${XTime}${colors.nc} ${data.body}`
    );

  }).catch(err => {
    console.log(err);
  });

}, interval);
