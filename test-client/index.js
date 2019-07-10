"use strict";

const
  endpoint_uri = process.env.endpoint_uri || 'http://localhost/cycle/timeout/6/4',
  client_max_time = process.env.client_max_time || 30,
  client_req_interval = process.env.client_req_interval || 100,
  resp_check_type = process.env.resp_check_type || 'parallel',
  http_proxy = process.env.http_proxy || "-",
  show_headers = process.env.show_headers || "off",
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
    endpoint_uri: ${colors.Bblue}${endpoint_uri}${colors.nc}
    client_max_time: ${client_max_time}
    client_req_interval: ${client_req_interval}
    resp_check_type: ${resp_check_type}
    http_proxy: ${http_proxy}
`);

function checkResp(uri) {
  return getData(uri, client_max_time).then(data => {
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
    let isLikeSquid = typeof data.headers['X-Cache'] !== "undefined" && typeof data.headers['X-Cache-Lookup'] !== "undefined";
    let unknownProxy = http_proxy !== "-";

    if(show_headers === "on") {
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
      case isLikeSquid:
        let XCache = data.headers['X-Cache'] || '-';
        let XCacheLookup = data.headers['X-Cache-Lookup'] || '-';
        report = `Proxy: ${httpCodeColor} ${Time}s n:${cnt} Server: ${LastModified} ${colors.yellow}${XCache} ${XCacheLookup}${colors.nc}\t${data.body}`
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



switch(resp_check_type) {
  case 'serial':
    const serial = async () => {
      await checkResp(endpoint_uri);
      setTimeout(serial, client_req_interval);
    }

    serial();
    break;
  default:
  case 'parallel':
    setInterval(() => { checkResp(endpoint_uri); }, client_req_interval);
}
