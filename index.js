var fs = require('fs');

var Observify = require('observify');
var BattleNode = require('battle-node');

var schedule = [{
  cron: "* 10 * * * *",
  say: "Join the forums @ www.shizweak.es to keep up to date!"
},{
  cron: "* 11 * * * *",
  say: "Please do not use voice on global or side channels."
},{
  cron: "* 12 * * * *",
  say: "Server restarts at 4PM daily"
},{
  cron: "* 30 15 * * *",
  say: "SERVER WILL RESTART IN 30 MINUTES"
},{
  cron: "* 45 15 * * *",
  say: "SERVER WILL RESTART IN 15 MINUTES"
},{
  cron: "* 50 15 * * *",
  say: "SERVER WILL RESTART IN 10 MINUTES"
},{
  cron: "* 55 15 * * *",
  say: "SERVER WILL RESTART IN 5 MINUTES"
},{
  cron: "* 59 15 * * *",
  say: "SERVER WILL RESTART IN 1 MINUTES"
}, {
  cron: "* * 16 * * *",
  restart: true
}];

function serverModel(config) {

  var playerInterval = false;
  var scheduleInterval = false;
  var port = config.port || 2302;
  var jobs = [];

  var rcon = new BattleNode({
    ip: config.ip,
    port: port,
    rconPassword: config.password
  });

  var model = Observify({
    ip: config.ip,
    port: port,
    password: config.password,
    players: [],
    connected: false,
    connecting: false,
    version: ''
  });

  rcon.on('login', onLogin);
  rcon.on('message', onMessage);
  rcon.on('disconnect', onDisconnected);

  model.connected(onConnect);

  model.players(function(p) {
    console.log('p', p);
  });

  connect();

  function connect() {
    if(model.connected())
      return;

    model.connecting.set(true);
    rcon.login();
  }

  function onLogin(err, success) {
    model.connecting.set(false);

    if (err || !success)
      return model.connected.set(false);

    return model.connected.set(true);
  }

  function onConnect(state) {
    if(!state) return;

    getVersion();
    getPlayers();
    startSchedule();
  }

  function onMessage(message) {

  }

  function say(message) {
    rcon.sendCommand('say -1 [Jeeves] ' + message);
  }

  function getPlayers() {
    rcon.sendCommand('players', onPlayers);
  }

  function onPlayers(players) {
    players = parsePlayers(players);
    model.players.transaction(function(raw) {
      players.forEach(function(player) {
        raw.push(player);
      });
    });
  }

  function parsePlayers(players) {
    var lines = players.split("\n").slice(3, -1);
    return lines.map(function(player) {
      return Observify({
        id: parseInt(player.substr(0, 4), 10),
        ip: player.substr(4,22).trim(),
        ping: parseInt(player.substr(26, 5), 10),
        guid: player.substr(31, 32).trim(),
        alias: player.substr(68).trim()
      });
    });
  }

  function getVersion() {
    rcon.sendCommand('version', function(version) {
      model.version.set(version);
    });
  }

  function onDisconnected() {
    model.connected.set(false);
    rcon.login();
  }

  function startSchedule() {
    schedule.forEach(createCronJob);
  },

  function createCronJob(job) {
    var job = new CronJob(job.cron, function() {
      if(job.say)
        return say(job.say);

      if(job.restart)
        return restart();
    });
    jobs.push(job);
  }

  function stopJobs() {

  }

  return model;
}