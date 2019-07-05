/*
syntax: https://varnish-cache.org/docs/6.2/users-guide/vcl-syntax.html
objects: https://varnish-cache.org/docs/6.2/users-guide/vcl-variables.html
states: http://varnish-cache.org/docs/6.2/reference/states.html
grace mode and keep: https://varnish-cache.org/docs/6.2/users-guide/vcl-grace.html

examle configs:
- https://habr.com/ru/post/278189/
*/

vcl 4.0;


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
      set req.backend = foo;
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

  # сохраняем в кеше
  set beresp.ttl = 1d;

  // @see https://stackoverrun.com/ru/q/3456836

  // @see https://www.getpagespeed.com/server-setup/varnish/cache-things-longer-varnish-client
  # set beresp.http.cache-control = "max-age=900";
}
