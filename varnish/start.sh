#!/bin/sh

if [[ "$logs" != "on" ]]; then
  VARNISH_OPTS="-F ${VARNISH_OPTS}"
fi

set -x

varnishd -a "0.0.0.0:${VARNISH_PORT}" \
        -f "${VARNISH_CONFIG_FILE}" \
        -s "${VARNISH_STORAGE}" \
        $VARNISH_OPTS
set +x

if [[ "$logs" == "on" ]]; then
  sleep 1
  varnishlog
fi
