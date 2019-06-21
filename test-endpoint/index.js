"use strict";

const
  port = 80,
  timeout = process.env.endpointTimeout || 5000,
  express = require('express'),
  app = express(),
  connectTimeout = require('connect-timeout'),
  uuidv4 = require('uuid/v4'),
  startDate = new Date().getTime()
  ;

const getSomeDoc = (msg) => {
  let now = new Date();
  return {
    msg: msg,
    guid: uuidv4(),
    now: now.toISOString(),
    uptime: `${Math.floor((now.getTime() - startDate) / 1000)} seconds`
  }
}

const respSomeDoc = (res, msg) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(getSomeDoc(msg)));
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
2-ой параметр - продолжительность "отказа" в секундах, 503 Service Unavailable
`/cycle/error/10/5` - 10 секунд работает, 5 - не работает
*/

app.get(/^\/cycle\/(timeout|error|blackhole)\/([0-9]+)\/([0-9]+)$/, (req, res) => {
  let failureCase = req.params[0];
  let expected200 = req.params[1] * 1000;
  let expected503 = req.params[2] * 1000;
  let cycleDuration = expected200 + expected503;

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
        req.clearTimeout();
        return;
      case "timeout":
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
