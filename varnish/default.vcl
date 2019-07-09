vcl 4.0;

/*
syntax: https://varnish-cache.org/docs/6.2/users-guide/vcl-syntax.html
objects: https://varnish-cache.org/docs/6.2/users-guide/vcl-variables.html
states: http://varnish-cache.org/docs/6.2/reference/states.html
return(): https://varnish-cache.org/docs/5.2/users-guide/vcl-built-in-subs.html#vcl-recv
grace mode and keep: https://varnish-cache.org/docs/6.2/users-guide/vcl-grace.html
выбор хранилища: https://varnish-cache.org/docs/6.2/users-guide/storage-backends.html

как установить максимальный возраст в заголовках http: https://stackoverrun.com/ru/q/3456836
How to cache things longer on Varnish than on the client: https://varnish-cache.org/trac/wiki/VCLExampleLongerCaching

Просмотр параметров:
docker exec -it nginx-cached-proxy_proxy-varnish_1 sh -c "varnishadm 'param.show'"

Статистика:
docker exec -it nginx-cached-proxy_proxy-varnish_1 sh -c "varnishstat"

examle configs:
- https://habr.com/ru/post/278189/

*/

backend default {
  .host = "test-endpoint";
  .port = "80";

  /*
    // Проверка работоспособности. Промониторить можно так: "varnishlog -g raw -i Backend_health"
    .probe = {
      .url = "/healthcheck";
      .timeout = 1 s;
      .window = 8;
      .threshold = 3;
      .initial = 3;
    }
  */

}

# Получение запроса от клиента
sub vcl_recv {
  /*
  if (req.http.host ~ "nocache.test-endpoint") {
      set req.backend = nocache;
  }
  */

  # POST-запросы пропускать на бек
  if (req.method == "POST") {
    return (pass);
  }

  unset req.http.Cookie;
}

sub vcl_backend_response {
  # удаляем куки, если они случайно были выставлены
  unset beresp.http.set-cookie;
  unset beresp.http.cookie;

  # удаляем заголовки кеширования
  unset beresp.http.Cache-Control;
  unset beresp.http.Pragma;
  unset beresp.http.Expires;

  # Не кэшировать результат ответа на POST-запрос и ошибки
  if (bereq.method == "POST" || beresp.status != 200) {
    set beresp.uncacheable = true;
    set beresp.ttl = 120s;
    return (deliver);
  }

  if (beresp.status == 500) {
    return (retry);
  }

  # сохраняем в кеше
  set beresp.ttl = 1s;

  set beresp.grace = 10s; # stale objects
  set beresp.keep = 5m;

  return (deliver);
}

# sub vcl_backend_error {
#   return (retry);
# }
