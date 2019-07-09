"use strict";

const
  endpointUri = process.env.endpointUri || 'http://localhost/cycle/timeout/6/4',
  clientMaxTime = process.env.clientMaxTime || 30,
  clientReqInterval = process.env.clientReqInterval || 100,
  respCheckType = process.env.respCheckType || 'parallel',
  http_proxy = process.env.http_proxy || "-",
  showHeaders = process.env.showHeaders || "off",
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

let cnt = 0;

console.log(`Config:
    endpointUri: ${colors.Bblue}${endpointUri}${colors.nc}
    clientMaxTime: ${clientMaxTime}
    clientReqInterval: ${clientReqInterval}
    respCheckType: ${respCheckType}
    http_proxy: ${http_proxy}
`);

function checkResp(uri) {
  return getData(uri, clientMaxTime).then(data => {
    cnt++;

    let httpCodeColor;

    switch(true) {
      case data.info.http_code >= 200 && data.info.http_code < 300:
        httpCodeColor = `${colors.Bgreen}20x${colors.nc}`;
        break;
      case data.info.http_code >= 400 && data.info.http_code < 500:
        httpCodeColor = `${colors.Byellow}40x${colors.nc}`;
        break;
      case data.info.http_code >= 500 && data.info.http_code < 600:
        httpCodeColor = `${colors.Bred}50x${colors.nc}`;
        break;
      default:
        httpCodeColor = `${colors.Bblue}???${colors.nc}`;
    }

    // заголовки: последняя модификация
    let LastModified = data.headers['Last-Modified'] || '-';
    // возраст (у Nginx нет)
    let Age = data.headers['Age'] || '-';

    // время из тела запроса
    let Time = parseFloat(data.info.time_total).toFixed(1);

    // прокси?
    let isLikeNginx = typeof data.headers['X-Cache-Status'] !== "undefined";
    let isLikeVarnish = typeof data.headers['X-Varnish'] !== "undefined";
    let unknownProxy = http_proxy !== "-";

    if(showHeaders === "on") {
      console.log(data.headers);
    }

    let report;
    switch(true) {
      case isLikeNginx:
        let XCacheStatus = data.headers['X-Cache-Status'] || '-';
        let XUpstreamStatus = data.headers['X-Upstream-Status'] || '-';
        report = `Proxy: ${httpCodeColor} ${Time}s n:${cnt} Server: ${LastModified} ${colors.yellow}${XCacheStatus} ${XUpstreamStatus}${colors.nc}\t${data.body}`
        break;
      case isLikeVarnish:
        let XVarnish = data.headers['XVarnish'] || '-';
        report = `Proxy: ${httpCodeColor} ${Time}s n:${cnt} Server: ${LastModified} ${colors.yellow}${Age}${colors.nc}\t${data.body}`
        break;
      case unknownProxy:
        report = `Unknown proxy Server: ${httpCodeColor} ${Time}s n:${cnt}\t${data.body}`;
        break;
      // no proxy
      default:
        report = `No proxy Server: ${httpCodeColor} ${Time}s n:${cnt}\t${data.body}`;
    }

    console.log(report);

  }).catch(err => {
    console.log(err);
  });
}



switch(respCheckType) {
  case 'serial':
    const serial = async () => {
      await checkResp(endpointUri);
      setTimeout(serial, clientReqInterval);
    }

    serial();
    break;
  default:
  case 'parallel':
    setInterval(() => { checkResp(endpointUri); }, clientReqInterval);
}
