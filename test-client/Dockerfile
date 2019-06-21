FROM node:current-alpine

RUN apk add curl

RUN mkdir /app
ADD ./package.json /app

RUN cd /app && npm install

ADD ./index.js /app
ADD ./lib /app/lib

WORKDIR /app
CMD [ "npm", "run", "app" ]
