FROM node:current-alpine

RUN mkdir /app
ADD ./package.json /app
ADD ./index.js /app

RUN cd /app && npm install

WORKDIR /app
CMD [ "npm", "run", "app" ]
