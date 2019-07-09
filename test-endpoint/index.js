"use strict";

const
  port = process.env.port || 80,
  timeout = process.env.endpointTimeout || 5000,
  set_cookie = process.env.set_cookie || "on",
  set_no_cache_and_expired = process.env.set_no_cache_and_expired || "on",
  express = require('express'),
  app = express(),
  connectTimeout = require('connect-timeout'),
  uuidv4 = require('uuid/v4'),
  startDate = new Date().getTime()
  ;

let cnt = 0;

console.log(`Config:
    port: ${port}
    timeout: ${timeout}
    set_cookie: ${set_cookie}
    set_no_cache_and_expired: ${set_no_cache_and_expired}
`);

const getSomeDoc = (msg) => {
  let now = new Date();
  cnt++;
  return {
    n: cnt,
    msg: msg,
    guid: uuidv4(),
    now: now.toISOString(),
    uptime: `${Math.floor((now.getTime() - startDate) / 1000)} seconds`
  }
}

const respSomeDoc = (res, msg) => {
  let doc = getSomeDoc(msg);
  let now = new Date();
  console.log(`HTTP: ${res.statusCode} guid: ${doc.guid}`);
  res.setHeader('Content-Type', 'application/json');
  // Этот заголовок рекомендуется отдавать всем бекендам, чтобы выводить сообщение "данные просрочены на ..."
  res.setHeader('Last-Modified', now.toGMTString());

  // Куки
  if(set_cookie === "on") {
    res.cookie('test', Math.random().toString(), { maxAge: 900000, httpOnly: true });
  }

  // Заголовки кеширования
  if(set_no_cache_and_expired === "on") {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', 'Fri, 30 Oct 1998 14:19:41 GMT');
  }

  res.end(JSON.stringify(doc));
}

app.use(connectTimeout(timeout));

// Общая проверка работоспособности, всегда 200 ОК
app.get('/healthcheck', (req, res) => {
  respSomeDoc(res, "ok");
});

// Всегда определенный код
app.get(/\/always\/([0-9]{3})/, (req, res) => {
  let httpCode = req.params[0];
  res.status(httpCode);
  respSomeDoc(res, `${httpCode}`);
});

// Отказ по таймауту
app.get('/timeout', (req, res) => {});

// Медленное соединение
app.get(/^\/slow\/([0-9]+)$/, (req, res) => {
  let interval = req.params[0];
  setTimeout(() => {
    respSomeDoc(res, "ok");
  }, interval * 1000);
});

// 200/404 с вероятностью выпадения "200 OK", %
app.get(/^\/random\/([0-9]{1,2})$/, (req, res) => {
  let expected200 = req.params[0];
  let probability = Math.random() * 100;
  if(probability < expected200) {
    respSomeDoc(res, "ok");
  } else {
    res.status(404);
    respSomeDoc(res, "Something went wrong");
  }
});

/*
"циклический отказ" - наиболее вероятный вариант работы неустойчивых сервисов
промежуток "работает" сменяется промежутком "не работает"
1-ый параметр - продолжительность работы в секундах, 200 OK
2-ой параметр - продолжительность "отказа" в секундах, 500 Internal Server Error
`/cycle/error/10/5` - 10 секунд работает, 5 - не работает
*/

app.get(/^\/cycle\/(timeout|error|blackhole)\/([0-9]+)\/([0-9]+)$/, (req, res) => {
  let failureCase = req.params[0];
  let expected200 = req.params[1] * 1000;
  let expected500 = req.params[2] * 1000;
  let cycleDuration = expected200 + expected500;

  // смещение, в мс, от момента старта
  let offset = new Date().getTime() - startDate;
  let intervalOffset = offset % cycleDuration;
  let is200 = intervalOffset <= expected200;

  if(is200) {
    respSomeDoc(res, "ok");
  } else {
    switch(failureCase) {
      case "error":
        res.status(500);
        respSomeDoc(res, "Something went wrong");
        break;
      case "blackhole":
        console.log(`Endpoint: blackhole`);
        req.clearTimeout();
        return;
      case "timeout":
        console.log(`Endpoint: timeout`);
        // отваливаемся по таймауту
        break;
    }
  }
});

app.use((err, req, res, next) => {
  res.status(500);
  respSomeDoc(res, "Something went wrong");
});

app.listen(port);
