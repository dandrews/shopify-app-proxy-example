(function() {
  var app, crypto, express, fs, inspect, process, querystring, secrets;

  process = require('process');

  express = require('express');

  inspect = require('util').inspect;

  crypto = require('crypto');

  fs = require('fs');

  querystring = require('querystring');

  secrets = JSON.parse(fs.readFileSync('../secrets.json', 'utf-8'));

  app = express();

  app.get('/', function(req, res) {
    return res.status(200).send('this is the home page');
  });

  app.use('/proxy', function(req, res, next) {
    var hash, input, query, query_string, signature, _ref, _ref1, _ref2;
    query_string = (_ref = (_ref1 = req.url.match(/\?(.*)/)) != null ? _ref1[1] : void 0) != null ? _ref : '';
    query = querystring.parse(query_string);
    signature = (_ref2 = query.signature) != null ? _ref2 : '';
    delete query.signature;
    input = Object.keys(query).sort().map(function(key) {
      var value;
      value = query[key];
      if (!Array.isArray(value)) {
        value = [value];
      }
      return key + "=" + (value.join(','));
    }).join('');
    hash = crypto.createHmac('sha256', secrets.shopify_shared_secret).update(input).digest('hex');
    if (signature !== hash) {
      res.status(403).send("Signature verification for shopify proxy request failed");
    } else {
      next();
    }
    return null;
  });

  app.get('/proxy', function(req, res) {
    return res.set('Content-Type', 'application/liquid').sendFile("proxy.liquid", {
      root: '.'
    });
  });

  require('http').createServer(app).listen(process.env.PORT, process.env.IP);

}).call(this);
