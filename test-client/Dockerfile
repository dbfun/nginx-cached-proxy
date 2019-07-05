FROM node:current-alpine

ADD . /app
WORKDIR /app

RUN apk add curl && \
    npm install

CMD [ "npm", "run", "app" ]
