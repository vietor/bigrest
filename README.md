# bigrest

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]

Smart web and restful framework for NodeJS. current core is [**express**](http://expressjs.com).

## Installation

```sh
$ npm install bigrest
```

## Usage

```js
var bigrest = require('bigrest')
```

## API

### listen(port, opts)

Binds and listens for connections on the port.

``` javascript
var path = require('path');
var bigrest = require('../index');

var http = bigrest.listen(18080, {
    basepath: __dirname,
    statics: [{
        urlpath: '/files',
        filepath: path.join(__dirname, 'files')
    }],
    compression: {
        threshold: 16 * 1024
    }
});

```

> XArray(string) was a Array(string) or a Array splited by ",".  
> XArray(*object*) was a Array(*object*) or a Object(*object*) ",".

### Parameter: opts

The options for bigrest framework.

|*Key*|*Type*|*Default*|*Description*|
|---|---|---|---|
|debug|boolean|false|debug mode switch|
|etag|boolean|false|switch on **ETAG** generation|
|https|Object|undefined|options for HTTPS protocol|
|compression|boolean or Object|false|switch or options for compression|
|basepath|string|process.cwd()|the base path|
|services|XArray(string)|services|the **handlers and routers** path|
|rootwork|function|undefined|the all METHOD handler for '/'|
|r404work|function|undefined|the all METHOD handler while response 404|
|visitor|function|undefiend|the pre processor the all handler|
|viewer|Object(viewer)|undeifned|set html template engine|
|limits|Object(limits)|undeifned|the limits for request parse|
|statics|XArray(static)|undefiend|set static file engine|
|middlewares|Array(function)|[]|the middlewares for express|

> https documents [https.createServer](https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener)  
> compression as **options** documents [compression](https://github.com/expressjs/compression#compressionoptions)

#### Object(viewer)
|*Key*|*Type*|*Default*|*Description*|
|---|---|---|---|
|filepath|string|undefined|the template source file path|
|render|string or function|undefiend|the template engine|
|cache|boolean|opposite with opts.debug|system cache switch|

```javascript
{
    render: swig.renderFile,
    filepath: path.join(__dirname, "server", "views")
}
```

#### Object(limits)
|*Key*|*Type*|*Default*|*Description*|
|---|---|---|---|
|bodySize|number|4mb|the request body size|
|uploadSize|number|50mb|the maximum size for file upload|

```javascript
{
    bodySize: 102400,
    uploadSize: 1024000
}
```

#### Object(static)
|*Key*|*Type*|*Default*|*Description*|
|---|---|---|---|
|urlpath|string|undefined|the url path|
|filepath|string|undefined|the static file's file path|
|options|Object|undefined|the static options|

> *options* means in the [express.static](http://expressjs.com/en/4x/api.html#express.static)

```javascript
{
    urlpath: '/static',
    filepath: path.join(__dirname, "static")
}
```

## Directory

```sh
|--{basepath}
|   |--commons
|   |   |--test.js
|   |--methods
|   |   |--test.js
|   |--services
|   |   |--test-router.json
|   |   |--test.js
|--server.js
```

### Global variables

|*Name*|*Path*|*Export Variables*|*Export methods*|
|---|---|---|---|
|brcx|commons/|*UpperCase named, number & string*|all|
|brmx|method/|*UpperCase named, number & string*|lowercase named|

### Router And Processor

> services/test-router.json

``` json
{
    "processors": [
        {
            "url": "/benchmark",
            "method": "GET",
            "processor": "benchmark_empty",
            "parameters": []
        }
    ]
}
```

> services/test.js

``` javascript
exports.benchmark_empty = function(req, res) {
    brmx.benchmark(function() {
        res.send('OK');
    });
};
```

> methods/test.js

``` javascript
exports.benchmark = function(callback) {
    callback(null);
};
```

#### Router File Format

it has three style, Object(container), Array(group), Object(group).

##### Object(container)
|*Key*|*Type*|*Default*|*Description*|
|---|---|---|---|
|parameters|Array(Parameger)|[]|the common parameters|
|interceptor|XArray(string)|[]|the common interceptor names|
|failure|stirng|undefined|the default failure processor name|
|groups|Array(group)|**required**|the router group|

##### Object(group)
|*Key*|*Type*|*Default*|*Description*|
|---|---|---|---|
|parameters|Array(Parameger)|[]|the common parameters|
|interceptor|XArray(string)|[]|the interceptor names|
|failure|stirng|undefined|the failure processor name|
|processors|Array(processor)|**required**|the router parameters|

##### Object(processor)
|*Key*|*Type*|*Default*|*Description*|
|---|---|---|---|
|method|XArray(string)|**required**|METHOD|
|url|XArray(string)|**required**|URL|
|parameters|Array(parameger)|[]|the common parameters|
|failure|stirng|undefined|the failure processor name|
|processor|string|**required**|the processor name|
|workdata|Object|undefined|attach to **req**|
|workparam|Object|undefined|attach to **req**|

##### Object(parameter)

This is a model definition in [field-inspector](https://github.com/vietor/node-field-inspector#newinstancemodel), click it for more detail.

### req.files Information

It's array of file, And each file contains the following information:

|*Key*|*Description*|
|---|---|
|`name` | Field name specified in the form |
|`type` | Mime type of the file |
|`size` | Size of the file in bytes |
|`path` | The full path to the temp uploaded file |
|`originalFilename` | Name of the file on the user's computer |

## Examples

[demo](https://github.com/vietor/bigrest/tree/master/demo)  

## License

[MIT](LICENSE)

[npm-image]: https://img.shields.io/npm/v/bigrest.svg
[npm-url]: https://npmjs.org/package/bigrest
[downloads-image]: https://img.shields.io/npm/dm/bigrest.svg
[downloads-url]: https://npmjs.org/package/bigrest
