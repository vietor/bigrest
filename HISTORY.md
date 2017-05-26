1.5.7
========

* Fix __bigrest_params usage since 1.5.5

1.5.6
========

* Fix req.param() implementation
* deps: express@~4.15.3
* deps: body-parser@~1.17.2

1.5.5
========

* Refactory code for parameter validator
* Performance the req.param() implementation

1.5.4
========

* Fix intercepter result check

1.5.3
========

* Fix opts.statics usage

1.5.2
========

* Ignore error on remove the upload temp file.
* Add more compatible for newest NodeJS.
* deps: express@~4.15.2
* deps: body-parser@~1.17.1

1.5.1
========

* Remove session support, use opts.middlewares for support it.
* Add more check for interceptor
* deps: lodash@~4.17.4
* deps: express@~4.14.1
* deps: body-parser@~1.16.1

1.5.0
========

* Add options.cookieSession support
* Remove options.session.store 'function' support
* Rename options.session.storeNeedReady to storeStatusCheck

1.4.10
========

  * Add 'r404work' for options.

1.4.9
========

  * Refactory code for **error handle**

1.4.8
========

  * Add more check for **error handle**
  * deps: lodash@~4.17.2

1.4.7
========

  * Modify some options attribute support
  * deps: lodash@~4.16.4

1.4.6
========

  * Add length[min,max], range_min, range_max for parameter check
  * Add lodash usage
  * Refactory parameter test
  * deps: express-session@~1.14.1

1.4.5
========

  * deps: body-parser@~1.15.2
  * deps: express@~4.14.0
  * deps: express-session@~1.14.0

1.4.4
========

  * Add etag switch for options
  * Add compression options support
  * deps: compression@~1.6.2
  * deps: cookie-parser@~1.4.3

1.4.3
========

  * Refactory some code
  * Add more HTTP code support
  * deps: body-parser@~1.15.1

1.4.2
========

  * Add session initialize check

1.4.0
========

  * New base release

1.3.12
========

  * Add attribute cache for viewer
  * Add document for routet file

1.3.11
========

  * Add compression support

1.3.10
========

  * Add size limit in opts.limits
  * deps: express@~4.13.4
  * deps: body-parser@~1.15.0

1.3.9
========

  * Add array support with opts.static

1.3.8
========

  * Add more attribute (failure, match) for router

1.3.7
========

  * Add HTTP-400 as default failure for services
  * deps: cookie-parser@~1.4.1
  * deps: express-session@~1.13.0

1.3.6
========

  * Split template files
  * Remove multiple error middlewares for express

1.3.5
========

  * Fix crash when error catch in express

1.3.4
========

  * Hotfix for 1.3.3

1.3.3
========

  * Performance and clean code
  * deps: body-parser@~1.14.2

1.3.2
========

  * Upgrade upstream
  * Throw exception when simulator

1.3.1
========

  * Clean option
    - Remove nocache
    - Remove commons, methods
  * Dump error stack just when debug enabled

1.3.0
========

  * First public version, base from 1.2.8
