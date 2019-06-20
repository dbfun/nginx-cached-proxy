FROM node:current-alpine

RUN mkdir /app
ADD ./package.json /app
ADD ./index.js /app
ADD ./lib /app/lib

RUN cd /app && npm install && apk add curl

WORKDIR /app
CMD [ "npm", "run", "app" ]
