FROM alpine:latest

ENV SQUID_CONFIG_FILE=/etc/squid/squid.conf

RUN apk update && \
    apk upgrade && \
    apk add squid

CMD ["sh", "-c", "/usr/sbin/squid -f ${SQUID_CONFIG_FILE} --foreground -z && exec /usr/sbin/squid -f ${SQUID_CONFIG_FILE} --foreground -YCd 1"]
