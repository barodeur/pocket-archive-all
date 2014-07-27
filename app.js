var PocketClient = require('./lib/pocket_client').PocketClient;
var koa = require('koa');
var router = require('koa-router');
var app = koa();
var koaBody = require('koa-body')();
var crypto = require('crypto');
var _ = require('lodash');
var thunkify = require('thunkify-wrap');

app.use(router(app));
app.use(koaBody);

var pocketConsumerKey = process.env.POCKET_CONSUMER_KEY;
var pocketClient = new PocketClient(pocketConsumerKey);

app.get('/', function *(next) {
  this.redirect('/auth/pocket');
});

app.get('/auth/pocket', function *(next) {
  var buf = yield thunkify(crypto.randomBytes)(32);
  var state = buf.toString('hex');
  var code = yield pocketClient.authRequest({state: state});
  this.redirect('https://getpocket.com/auth/authorize?request_token='+ code +'&redirect_uri=' + process.env.HOST + '/auth/pocket/callback?state=' + state);
});

app.get('/auth/pocket/callback', function *(next) {
  var state = this.query.state;
  var accessToken = yield pocketClient.authorize({state: state});
  console.log(accessToken);
  var items = yield pocketClient.get({accessToken: accessToken});
  var itemIds = Object.keys(items);
  var results = yield pocketClient.archiveAll({accessToken: accessToken, itemIds: itemIds});
  var numberOfArchivedItems = _.compact(results).length;
  this.body = numberOfArchivedItems + ' items have been archived';
});

var port = process.env.PORT || 3000;
app.listen(port);
console.log('listening on port %d', port);
