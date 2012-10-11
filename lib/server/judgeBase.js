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

        _sessions: [],

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
                }
            );
        },

        _socketConnected: function(socket) {
            var session =  {
                isReady:    false,
                socket:     socket,
                id:         socket.id,
                name:       'unnamed_' + socket.id,
                enteredAt:  Date.now()
            };
            this._sessions.push(session);
            socket._session = session;

            var that = this;
            socket.subs('message',    that.onMessage.bind(that));
            socket.subs('play',       that.onPlay.bind(that));
            socket.subs('setSession', that._onSetSession.bind(that));
            socket.subs('getSession', that._onGetSession.bind(that));

            this.onPlayerEnter(session);
        },

        _socketDisconnected: function(socket) {
            var session = socket._session;
            session.isReady = false;
            this.onPlayerExit(session);

            for (var i = 0, f = this._sessions.length; i < f; ++i) {
                if (this._sessions[i] === session) {
                    this._sessions.splice(i, 1);
                    break;
                }
            }

            // TODO save relevant session data
        },

        _onSetSession: function(o, socket) {
            //console.log('server received setSession', o);
            o = this._persistence.player.put(o);       // immediate!
            this._stage.send('sessionId', o._id, socket);
            //console.log('server sent sessionId', o._id);

            // load player data into session
            var session = socket._session;

            for (var k in o) {
                if (o.hasOwnProperty(k) && k !== '_id') {
                    session[k] = o[k];
                }
            }

            session.isReady = true;

            this.onPlayerReady(session);
        },

        _onGetSession: function(id, socket) {
            //console.log('server received getSession', id);
            var o = this._persistence.player.get(id);  // immediate!
            var pi = {session:o, cfg:this._stage._cfg};
            this._stage.send('sessionInfo', pi, socket);
            //console.log('server sent sessionInfo', pi);
        },

        _notifyNextTurn: function() {
            console.log('notifying player #' + this._state.nextToPlay);
            var sessions = this.getReadySessions();
            this._stage.send('yourTurn', {}, sessions[ this._state.nextToPlay ].socket);
        },

        getReadySessions: function() {
            return this._getSessions(true);
        },

        getWaitingSessions: function() {
            return this._getSessions(false);
        },

        _getSessions: function(areReady) {
            var s, res = [];

            for (var i = 0, f = this._sessions.length; i < f; ++i) {
                s = this._sessions[i];
                if      (areReady && s.isReady) {   res.push(s); }
                else if (!areReady && !s.isReady) { res.push(s); }
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

                        var sessionsArray = this.getReadySessions();

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
                this._state.numPlayers = this.getReadySessions().length;

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
