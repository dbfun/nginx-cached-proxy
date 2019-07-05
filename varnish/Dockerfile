FROM alpine:latest

RUN apk update && \
    apk upgrade && \
    apk add varnish

ENV VARNISH_PORT=80 \
    VARNISH_CONFIG_FILE=/etc/varnish/default.vcl \
    VARNISH_STORAGE="malloc,128m" \
    VARNISH_OPTS=

ADD start.sh /start.sh
CMD "/start.sh"
