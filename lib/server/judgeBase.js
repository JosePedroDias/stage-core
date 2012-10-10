/*jshint node:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, smarttabs:true, boss:true */
/*global console:false, require:false, srvUtils:false */


// TODO: detect engine exiting and:
// close game, notifying players
// save state of game


(function() {
    
    'use strict';



    var dumbdb = require('dumbdb');
    //var dumbdb = require('/home/jdias/nodestuff/dumbdb/dumbdb');
    var async  = require('async');



    var pad0 = function(n) {
        if (n < 9) { return '0' + n; }
        return n;
    };



    var judge = function() {

    };

    judge.prototype = {

        _state:    {},

        _sessions: {},

        _persistence: {},



        _prepare: function(stage) {
            this._stage = stage;

            dumbdb = dumbdb({
                rootDir: stage._cfg.rootDir + '/persistence',
                verbose: true
            });

            var that = this;

            async.parallel(
                [
                    function(cb) {
                        dumbdb.open('player', true, cb);
                    },
                    function(cb) {
                        dumbdb.open('state', true, cb);
                    }
                ],
                function(err, results) {
                    if (err) { throw err; }

                    that._persistence.player = results[0];
                    that._persistence.state  = results[1];



                    var handleMessage = function(o) {
                        that.onMessage(o, this);
                    };

                    var handlePlay = function(o) {
                        that.onPlay(o, this);
                    };

                    var handleGetSession = function(id) {
                        //console.log('server received getSession', id);
                        var o = that._persistence.player.get(id);  // immediate!
                        var pi = {session:o, cfg:that._stage._cfg};
                        that._stage.send('sessionInfo', pi, this.socket);
                        //console.log('server sent sessionInfo', pi);
                    };

                    var handleSetSession = function(o) {
                        //console.log('server received setSession', o);
                        o = that._persistence.player.put(o);       // immediate!
                        that._stage.send('sessionId', o._id, this.socket);
                        //console.log('server sent sessionId', o._id);

                        // load player data into session
                        for (var k in o) {
                            if (o.hasOwnProperty(k) && k !== '_id') {
                                this[k] = o[k];
                            }
                        }

                        this.isReady = true;
                        that.onPlayerReady(this);
                    };


                    // connection stuff
                    that._stage.subscribe('connection', function(socket) {
                        var session =  {
                            isReady:    false,
                            socket:     socket,
                            id:         socket.id,
                            name:       'unnamed_' + socket.id,
                            enteredAt:  Date.now()
                        };
                        that._sessions[socket.id] = session;

                        socket.on('message',    handleMessage.bind(session));
                        socket.on('play',       handlePlay.bind(session));
                        socket.on('setSession', handleSetSession.bind(session));
                        socket.on('getSession', handleGetSession.bind(session));

                        socket.on('disconnect', function() {
                            var session = that._sessions[this.id];
                            session.isReady = false;
                            that.onPlayerExit(session);
                            delete that._sessions[this.id];

                            // TODO save relevant session data
                            
                        }.bind(socket));

                        that.onPlayerEnter(session);
                    });
                }
            );
        },

        _notifyNextTurn: function() {
            console.log('notifying player #' + this._state.nextToPlay);
            var sessions = this.getSessions();
            this._stage.send('yourTurn', {}, sessions[ this._state.nextToPlay ].socket);
        },

        getNumberOfSessions: function() {
            return this.getSessions().length;
        },

        getSessions: function() {
            var res = [];
            var sessions = this._sessions;
            var s;
            for (var k in sessions) {
                if (!sessions.hasOwnProperty(k)) { continue; }
                s = sessions[k];
                if (!s.isReady) { continue; }
                res.push(s);
            }

            /*if (this.sortFn) {
                res.sort(this.sortFn);
            }*/

            return res;
        },

        getTime: function() {
            var d = new Date();
            return [
                      d.getHours(),
                pad0( d.getMinutes() ),
                pad0( d.getSeconds() )
            ].join(':');
        },



        isRunning: function() {
            return !!this._timer || this._state.nextToPlay;
        },

        start: function() {
            console.log('start called.');
            this._state.frameNr = 0;

            this._state.realTime  = (typeof this._stage._cfg.fps === 'number');
            this._state.turnBased = !this._state.realTime;

            this.init();

            if (this._state.realTime) {
                console.log('start realTime');
                this._timer = setInterval(
                    function() {
                        this.prePlayerUpdates();

                        var sessionsArray = this.getSessions();

                        for (var i = 0, f = sessionsArray.length, s; i < f; ++i) {
                            s = sessionsArray[i];
                            this.onPlayerUpdate(s);
                        }

                        this.postPlayerUpdates();

                        ++this._state.frameNr;
                    }.bind(this),
                    1000 / this._stage._cfg.fps
                );
            }
            else {
                console.log('start turn-based');
                this._state.nextToPlay = 0;
                this._state.numPlayers = this.getNumberOfSessions();

                this._notifyNextTurn();
            }

        },
                
        stop: function() {
            console.log('game stopped.');

            if (this._state.realTime) {
                clearInterval(this._timer);
                delete this._timer;
            }
            else {
                delete this._state.nextToPlay;
            }
        },



        /*******************************************
         * THE REMAINING METHODS CAN BE OVERRIDDEN *
         *******************************************/

        sortFn: undefined,


        init: function() {
            //console.log('init called.');
        },



        prePlayerUpdates: function() {
            //console.log('prePlayerUpdates');
        },

        onPlayerUpdate: function(session) {
            //console.log('onPlayerUpdate - ' + session.name);
        },

        postPlayerUpdates: function() {
            //console.log('postPlayerUpdates');
        },



        onPlayerEnter: function(session) {
            //console.log(['-> player ', session.name, ' entered'].join(''));
        },

        onPlayerExit: function(session) {
            //console.log(['-> player ', session.name, ' left'].join(''));
        },

        onPlayerReady: function(session) {
            //console.log([session.name, ' session set. Player ready!'].join(''));
        },



        onPlay: function(o, session) {
            //console.log([session.name, ' keys: ', JSON.stringify(o)].join(''));
        },

        onMessage: function(o, session) {
            //console.log([session.name, ' message: ', JSON.stringify(o)].join(''));
        }

    };




    module.exports = judge;

})();
