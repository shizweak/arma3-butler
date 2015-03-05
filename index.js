var fs = require('fs');

var Observify = require('observify');
var BattleNode = require('battle-node');

function serverModel(config) {

  config.port = config.port || 2302;

  var rcon = new BattleNode(config);

  var model = Observify({
    ip: config.ip,
    port: config.port,
    password: config.password,
    players: [],
    connected: true,
    connecting: true,
    tried: -1,
  });

  rcon.on('login', login);
  rcon.on('message', message);
  rcon.on('disconnect', reconnect);

  model.connected(connected);


  function connect() {
    if(model.connected())
      return;

    model.connecting.set(true);
    rcon.login();
  }

  function login(err, success) {
    model.connecting.set(false);

    if (err || !success)
      return model.connected.set(false);

    return model.connected.set(true);
  }

  function connected(state) {
    if(!state) return;

    getPlayers();
    startScheduler();
  }

  function reconnect() {
    model.connected.set(false);
    rcon.login();
  }

  return model;
}
