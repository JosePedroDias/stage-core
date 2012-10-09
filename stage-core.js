/*jshint node:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, evil:true, smarttabs:true */
/*global */


(function() {
    
    'use strict';



    var http    = require('http'),
        fs      = require('fs'),
        express = require('express'),
        sio     = require('socket.io');



    // leaner JSON stringify
    var censor = function(key, value) {
        switch (typeof value) {
            case 'boolean': return (value ? 1 : 0);
            case 'number':  return Number(value.toFixed(2));
        }
        return value;
    };

    var json2 = function(o) { // TODO skip roundtrip, socket.io option exists?
        return JSON.parse( JSON.stringify(o, censor, 0) );
    };



    var stageCore = function(appName, cfg) {
        // store configuration
        if (!appName) { throw new TypeError('1st argument appName is a required string!'); }
        this._appName = appName;

        if (!cfg) { cfg = {}; }
        if (!('port'     in cfg)) { cfg.port     = 3000; }
        if (!('rootDir'  in cfg)) { cfg.rootDir  = __dirname; }
        if (!('stageDir' in cfg)) { cfg.stageDir = __dirname; }
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
            console.log(this._judge);


            
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
            this._io = sio.listen(server);
            var sockets = [];

            this._io.set('log level', 1);     // reduce logging

            this._io.sockets.on('connection', function(socket) {
                sockets.push(socket);
            });
            


            // go!
            server.listen(this._cfg.port);

            this._judge._prepare(this);
        },



        send: function(kind, o, socket) {
            socket.emit(kind, json2(o));
        },

        broadcast: function(kind, o) {
            this._io.sockets.emit(kind, json2(o));
        },

        subscribe: function(kind, cb) {
            this._io.sockets.on(kind, cb); // TODO only works on connection?!
        },

        randomInt: function(max, min) {
            if (typeof min === 'undefined') { min = 0; }
            return min + Math.floor( Math.random() * (max - min) );
        },

        randomElementOfArray: function(arr) {
            var i = this.randomInt( arr.length );
            return arr[i];
        }
    };



    module.exports = stageCore;

})();
