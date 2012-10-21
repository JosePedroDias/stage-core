/*jshint node:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, evil:true, smarttabs:true */
/*global */


(function() {
    
    'use strict';



    var http    = require('http'),
        fs      = require('fs'),
        express = require('express'),
        eio     = require('engine.io');



    var debugSockets = false;



    // leaner JSON stringify
    var censor = function(key, value) {
        switch (typeof value) {
            case 'boolean': return (value ? 1 : 0);
            case 'number':  return Number(value.toFixed(2));
        }
        return value;
    };

    var jsonEnc = function(kind, o) {
        return JSON.stringify([kind, o], censor, 0);
    };



    var stageCore = function(cfg) {
        // store configuration
        if (!cfg) { cfg = {}; }
        if (!('port'     in cfg)) { cfg.port     = 3000; }
        if (!('rootDir'  in cfg)) { cfg.rootDir  = __dirname; }
        if (!('stageDir' in cfg)) { cfg.stageDir = __dirname; } // TODO require.resolve('stage-core') - file name
        this._cfg = cfg;

        this._init();
    };
       



    stageCore.prototype = {

        _init: function() {
            console.log('starting app ' + this._appName + '...');



            // mixin judge methods
            this._judge = require(this._cfg.stageDir + '/lib/server/judgeBase');
            this._judge = new this._judge();
            var j = require(this._cfg.rootDir + '/server/judge');
            for (var k in j) {
                if (j.hasOwnProperty(k)) {
                    this._judge[k] = j[k];
                }
            }
            //console.log(this._judge);


            
            // express config
            var app = express();

            var server = http.createServer(app);

            var that = this;
            app.configure(function() {
                app.use( express.logger({format:':method :url'}) );
                app.use( express['static'](that._cfg.rootDir  + '/client') );
                app.use( express['static'](that._cfg.stageDir + '/lib/client') );
            });

            console.log('\nHTTP server is serving directories in port ' + this._cfg.port + ':');
            console.log(' * ' + this._cfg.rootDir  + '/client');
            console.log(' * ' + this._cfg.stageDir + '/lib/client');



            // express routes
            app.get('/*',function(req,res,next){
                res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
                res.header('Access-Control-Allow-Origin', '*');
                next(); // http://expressjs.com/guide.html#passing-route control
            });
            
            app.get('/', function(req, res) {
                res.redirect('/index.html');
            });
            


            // socket.io setup
            this._io = eio.attach(server);
            this._sockets = [];
            this._socketsHash = {};
            this._socketSubs = {};  // TODO

            this._io.on('connection', function(socket) {
                var sId = socket.id;

                if (debugSockets) { console.log('SOCKET %s CONNECTED', socket.id); }

                that._sockets.push(socket);
                that._socketsHash[sId] = socket;

                socket._subsHash = {};
                socket.subs = function(kind, cb) {
                    var bucket = this._subsHash[kind];
                    if (!bucket) {
                        this._subsHash[kind] = [cb];
                    }
                    else {
                        bucket.push(cb);
                    }
                };

                socket.on('message', function(data) {
                    if (debugSockets) { console.log('RECEIVED FROM SOCKET %s MESSAGE: %s', this.id, data); }
                    data = JSON.parse(data);
                    var kind = data[0];
                    var o    = data[1];
                    
                    var unattended = true;
                    var i, f, bucket = this._subsHash[kind];
                    if (bucket) {
                        for (i = 0, f = bucket.length; i < f; ++i) {
                            bucket[i](o, this); //TODO
                            unattended = false;
                        }
                    }

                    bucket = that._socketSubs[kind];
                    if (bucket) {
                        for (i = 0, f = bucket.length; i < f; ++i) {
                            bucket[i](o, this); //TODO
                            unattended = false;
                        }
                    }

                    if (unattended) {
                        if (debugSockets) { console.log('WARNING: MESSAGE UNATTENDED.'); }
                    }
                });

                socket.on('close', function() {
                    if (debugSockets) { console.log('SOCKET %s CLOSED', this._id); }
                    for (var i = 0, f = that._sockets.length; i < f; ++i) {
                        if (this === that._sockets[i]) {
                            that._sockets.splice(i, 1);
                            break;
                        }
                    }

                    delete that._socketsHash[sId];

                    that._judge._socketDisconnected(socket);
                });

                that._judge._socketConnected(socket);
            });
            


            // go!
            server.listen(this._cfg.port);

            this._judge._prepare(this);
        },



        send: function(kind, o, socketOrSession) {
            var socket = socketOrSession._socket ? socketOrSession._socket : socketOrSession;
            var data = jsonEnc(kind, o);
            if (debugSockets) { console.log('SENDING VIA %s MESSAGE: %s', socket.id, data); }
            socket.send(data);
        },

        broadcast: function(kind, o) {
            var data = jsonEnc(kind, o);
            var i, f = this._sockets.length;
            if (debugSockets) { console.log('BROADCASTING TO %d SOCKETS MESSAGE: %s', f, data); }
            for (i = 0; i < f; ++i) {
                if ('send' in this._sockets[i]) {   // TODO
                    this._sockets[i].send(data);
                }
            }
        },

        subscribe: function(kind, cb) {
            var bucket = this._socketSubs[kind];
            if (!bucket) {
                this._socketSubs[kind] = [cb];
            }
            else {
                bucket.push(cb);
            }
            if (debugSockets) { console.log('SUBSCRIBED MESSAGES OF KIND %s', kind); }
        }
        
    };



    module.exports = stageCore;

})();
