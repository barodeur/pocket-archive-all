var PocketClient = require('./lib/pocket_client').PocketClient;
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var crypto = require('crypto');
var _ = require('lodash');

var pocketConsumerKey = process.env.POCKET_CONSUMER_KEY;
var pocketClient = new PocketClient(pocketConsumerKey);

app.get('/', function(req, res) {
  res.redirect('/auth/pocket');
});

app.get('/auth/pocket', function(req, res, next) {
  crypto.randomBytes(32, function(err, buf) {
    var state = buf.toString('hex');
    pocketClient.authRequest({state: state}, function(err, code) {
      res.redirect('https://getpocket.com/auth/authorize?request_token='+ code +'&redirect_uri=' + process.env.HOST + '/auth/pocket/callback?state=' + state);
    });
  });
});

app.get('/auth/pocket/callback', function(req, res) {
  var state = req.query.state;

  pocketClient.authorize({state: state}, function(err, accessToken) {
    pocketClient.get({accessToken: accessToken}, function(err, items) {
      var itemIds = Object.keys(items);

      pocketClient.archiveAll({accessToken: accessToken, itemIds: itemIds}, function(err, results) {
        if(err) return res.send(err.message);

        var numberOfArchivedItems = _.compact(results).length;
        res.send(numberOfArchivedItems + ' items have been archived');
      })
    });
  });
});

var port = process.env.PORT || 3000;
app.listen(port);
console.log('listening on port %d', port);
