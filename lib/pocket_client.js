var request = require('co-request');
var _ = require('lodash');

function PocketClient(consumerKey) {
  this.consumerKey = consumerKey;
  this.states = {};
};

PocketClient.prototype._request = function *(options) {
  _.extend(options, {
    uri: 'https://getpocket.com/v3' + options.path + '.php',
    headers: {
      'X-Accept': 'application/json'
    }
  });
  delete options.path;

  return yield request(options);
};

PocketClient.prototype.authRequest = function *(options) {
  if(!options.state) throw new Error('state required');
  var state = options.state;

  var response = yield this._request({
    path: '/oauth/request',
    method: 'POST',
    json: {
      'consumer_key': this.consumerKey,
      'redirect_uri': 'http://localhost:3000/auth/pocket/callback',
      'state': state
    }
  });

  var code = response.body.code;
  this.states[state] = code;

  return code;
};

PocketClient.prototype.authorize = function *(options) {
  if(!options.state) throw new Error('state required to authorize user');
  var state = options.state;

  var code = this.states[state];

  return (yield this._request({
    path: '/oauth/authorize',
    method: 'POST',
    json: {
      'consumer_key': this.consumerKey,
      'code': code
    }
  })).body.access_token;
};

PocketClient.prototype.get = function *(options) {
  if(!options.accessToken) throw new Error('Access token is required');
  var accessToken = options.accessToken;

  return (yield this._request({
    path: '/get',
    json: {
      'consumer_key': this.consumerKey,
      'access_token': accessToken,
      'state': 'unread'
    }
  })).body.list
};

PocketClient.prototype.archiveAll = function *(options) {
  if(!options.accessToken) throw new Error('Access token is required');
  if(!options.itemIds) throw new Error('A list of item ids is required');
  var accessToken = options.accessToken;
  var itemIds = options.itemIds;

  return (yield this._request({
    path: '/send',
    json: {
      'consumer_key': this.consumerKey,
      'access_token': accessToken,
      'actions': itemIds.map(function(id) {
        return { action: 'archive', item_id: id };
      })
    }
  })).body.action_results;
};

module.exports.PocketClient = PocketClient;
