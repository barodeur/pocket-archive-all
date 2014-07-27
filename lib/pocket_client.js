var request = require('request');
var _ = require('lodash');

function PocketClient(consumerKey) {
  this.consumerKey = consumerKey;
  this.states = {};
};

PocketClient.prototype._request = function(options, cb) {
  _.extend(options, {
    uri: 'http://getpocket.com/v3' + options.path + '.php',
    headers: {
      'X-Accept': 'application/json'
    }
  });
  delete options.path;

  return request(options, cb);
};

PocketClient.prototype.authRequest = function(options, cb) {
  if(!options.state) return cb(new Error('state required'));
  var state = options.state;

  var self = this;

  return this._request(
    {
      path: '/oauth/request',
      method: 'POST',
      json: {
        'consumer_key': this.consumerKey,
        'redirect_uri': 'http://localhost:12000/auth/pocket/callback',
        'state': state
      }
    }, function(err, response, body) {
      if(err) return cb(err);

      var code = body.code;
      self.states[state] = code;

      cb(null, code);
    }
  );
};

PocketClient.prototype.authorize = function(options, cb) {
  if(!options.state) return cb(new Error('state required to authorize user'));
  var state = options.state;

  var code = this.states[state];

  return this._request(
    {
      path: '/oauth/authorize',
      method: 'POST',
      json: {
        'consumer_key': this.consumerKey,
        'code': code
      }
    }, function(err, response, body) {
      if(err) return cb(err);

      var accessToken = body.access_token;

      return cb(null, accessToken);
    }
  );
};

PocketClient.prototype.get = function(options, cb) {
  if(!options.accessToken) return cb(new Error('Access token is required'));
  var accessToken = options.accessToken;

  return this._request(
    {
      path: '/get',
      json: {
        'consumer_key': this.consumerKey,
        'access_token': accessToken,
        'state': 'unread'
      }
    }, function(err, response, body) {
      if(err) return cb(err);

      return cb(null, body.list);
    }
  );
};

PocketClient.prototype.archiveAll = function(options, cb) {
  if(!options.accessToken) return cb(new Error('Access token is required'));
  if(!options.itemIds) return cb(new Error('A list of item ids is required'));
  var accessToken = options.accessToken;
  var itemIds = options.itemIds;

  return this._request(
    {
      path: '/send',
      json: {
        'consumer_key': this.consumerKey,
        'access_token': accessToken,
        'actions': itemIds.map(function(id) {
          return { action: 'archive', item_id: id };
        })
      }
    }, function(err, response, body) {
      if(err) return cb(err);

      return cb(null, body.action_results);
    }
  );
};



module.exports.PocketClient = PocketClient;
