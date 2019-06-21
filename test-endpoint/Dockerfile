FROM node:current-alpine

RUN mkdir /app
ADD ./package.json /app

RUN cd /app && npm install

ADD ./index.js /app

WORKDIR /app
CMD [ "npm", "run", "app" ]
