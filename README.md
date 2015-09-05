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
|basepath|string|process.cwd()|the base path|
|services|[string]|services|the handelers and routers path|
|rootwork|function|undefined|the '/' for all METHOD handler|
|visitor|function|undefiend|the pre processor the all handler|
|viewer|object(viewer)|undeifned|set html template engine|
|static|object(static)|undefiend|set static file engine|
|session|object(session)|undefined|set session engine|

#### object(viewer)
|*Key*|*Type*|*Description*|
|---|---|---|---|
|filepath|string|the template source file path|
|render|string or function|the template engine|

```javascript
{
    render: swig.renderFile,
    filepath: path.join(__dirname, "server", "views")
}
```

#### object(static)
|*Key*|*Type*|*Description*|
|---|---|---|---|
|urlpath|string|the url path|
|filepath|string|the static file's file path|

```javascript
{
    urlpath: '/static',
    filepath: path.join(__dirname, "static")
}

```

#### object(session)
|*Key*|*Type*|*Description*|
|---|---|---|---|
|name|string|the cookie name|
|secret|string|the cookie secret key|
|resave|boolean|save session event if not modified|
|saveUninitialized|boolean|save session event it not initialized|
|store|function|the default session handler|

```javascript
{
    name: 'SESSIONID',
    secret: 'vxforum',
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
