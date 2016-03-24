# bigrest

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]

Node.js smart restful framework.

## Installation

```sh
$ npm install bigrest
```

## API

```js
var bigrest = require('bigrest')
```

### Directory tree

```sh
|--{basepath}
|   |--commons
|   |   |--test.js
|   |--methods
|   |   |--test.js
|   |--services
|   |   |--test-router.json
|   |   |--test.js
|--app.js
```

### Parameter: opts

The options for bigrest framework.

|*Key*|*Type*|*Default*|*Description*|
|---|---|---|---|
|debug|boolean|false|debug mode switch|
|https|boolean|false|use HTTPS protocol|
|compression|boolean|false|use compression|
|basepath|string|process.cwd()|the base path|
|services|array(string)|services|the handelers and routers path|
|rootwork|function|undefined|the '/' for all METHOD handler|
|visitor|function|undefiend|the pre processor the all handler|
|viewer|object(viewer)|undeifned|set html template engine|
|limits|object(limits)|undeifned|the limits for request parse|
|static|object or array (static)|undefiend|set static file engine|
|session|object(session)|undefined|set session engine|
|middlewares|array(function)|[]|the middlewares for express|

#### object(viewer)
|*Key*|*Type*|*Default*|*Description*|
|---|---|---|---|
|filepath|string|undefined|the template source file path|
|render|string or function|undefiend|the template engine|

```javascript
{
    render: swig.renderFile,
    filepath: path.join(__dirname, "server", "views")
}
```

#### object(limits)
|*Key*|*Type*|*Default*|*Description*|
|---|---|---|---|
|bodySize|number|2mb|the request body size|
|uploadDir|string|undefiend|the dir for file upload|
|uploadSize|number|50mb|the maximum size for file upload|

```javascript
{
    bodySize: 102400,
    uploadSize: 1024000
}
```

#### object(static)
|*Key*|*Type*|*Default*|*Description*|
|---|---|---|---|
|urlpath|string|undefined|the url path|
|filepath|string|undefined|the static file's file path|
|options|object|undefined|the static options|

> *options* means in the [express.static](http://expressjs.com/en/4x/api.html#express.static)

```javascript
{
    urlpath: '/static',
    filepath: path.join(__dirname, "static")
}

```

#### object(session)

> it wrapped the [express-session](https://github.com/expressjs/session)

|*Key*|*Type*|*Default*|*Description*|
|---|---|---|---|
|name|string|SESSIONID|the cookie name|
|resave|boolean|false|save session event if not modified|
|saveUninitialized|boolean|false|save session event it not initialized|
|store|function|undefined|the default session engine|

```javascript
{
    name: 'SESSIONID',
    resave: false,
    saveUninitialized: false,
    store: function(session) {
        return new (require('connect-redis')(session))({
            host: '127.0.0.1',
            port: 6379
        });
    }
}
```

### listen(port, opts)

Binds and listens for connections on the port.

## License

[MIT](LICENSE)

[npm-image]: https://img.shields.io/npm/v/bigrest.svg
[npm-url]: https://npmjs.org/package/bigrest
[downloads-image]: https://img.shields.io/npm/dm/bigrest.svg
[downloads-url]: https://npmjs.org/package/bigrest
