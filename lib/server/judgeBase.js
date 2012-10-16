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
    var vm     = require('vm');



    var pad0 = function(n) {
        if (n < 9) { return '0' + n; }
        return n;
    };



    var judge = function() {};

    judge.prototype = {

        _state:    {},

        _sessions: [],

        _numReadyPlayers: 0,

        _numWaitingPlayers: 0,

        _persistence: {},



        /****************
         * PRIVATE API  *
         ****************/

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

            this.init(false);
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

            socket.subs('message',    this._onMessage.bind(this));
            socket.subs('play',       this._onPlay.bind(this));
            socket.subs('setSession', this._onSetSession.bind(this));
            socket.subs('getSession', this._onGetSession.bind(this));

            this.onPlayerEnter(session);

            this._broadcastRoster();
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

            this._broadcastRoster();

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

            if ('code' in o) {
                session.isBot = true;
                session.context = {
                    per:      {},
                    stt:      {},
                    act:      '',
                    log:      function(session, msg, c) {
                        console.log('LOG ' + session.name + ':' + msg);
                        this._stage.send('message', 'LOG: ' + msg, session.socket);
                    }.bind(this, session)
                };

                try {
                    session.script = vm.createScript(o.code, 'bot#' + session.id);
                } catch (ex) {
                    ex = 'CODE ERR: ' + ex.toString();
                    this._stage.send('message', ex, session.socket);
                    delete session.isBot;
                    console.log(ex);
                }
            }

            this.onPlayerReady(session);
            this._broadcastRoster();
        },

        _onGetSession: function(id, socket) {
            //console.log('server received getSession', id);
            var o = this._persistence.player.get(id);  // immediate!

            if (!o) {
                o = this.generateDefaultSession();
            }

            var pi = {session:o, cfg:this._stage._cfg};
            this._stage.send('sessionInfo', pi, socket);
            //console.log('server sent sessionInfo', pi);
        },

        _notifyNextTurn: function() {
            console.log('#frame ' + this._state.frameNr + ' notifying player #' + this._state.nextToPlay);
            var sessions = this.getReadyPlayers();
            this._stage.send('yourTurn', {}, sessions[ this._state.nextToPlay ]);
        },

        _getSessions: function(areReady) {
            var s, res = [];

            for (var i = 0, f = this._sessions.length; i < f; ++i) {
                s = this._sessions[i];
                if      (areReady && s.isReady) {   res.push(s); }
                else if (!areReady && !s.isReady) { res.push(s); }
            }

            if (this.sortFn) {
                res.sort(this.sortFn);
            }

            return res;
        },

        _onPlay: function(o, socket) {
            var session = socket._session;

            if (this._state.turnBased) {
                // validate it is your turn
                var sessions = this.getReadyPlayers();
                if (session !== sessions[ this._state.nextToPlay ]) {
                    console.log('ignoring play out of turn!');
                    return;
                }
            }
            
            this.onPlay(o, session);

            if (this._state.turnBased) {
                ++this._state.nextToPlay;
                if (this._state.nextToPlay >= this._state.numPlayers) {
                    this._state.nextToPlay = 0;
                    ++this._state.frameNr;
                }

                this._notifyNextTurn();  // TODO KEEP A CONDITION HERE?
            }
        },

        _onMessage: function(o, socket) {
            var session = socket._session;
            
            this.onMessage(o, session);
        },



        _broadcastRoster: function() {
            var ready   = this.getReadyPlayers();
            var waiting = this.getWaitingPlayers();

            var i, f, o;
            for (i = 0, f = ready.length; i < f; ++i) {
                ready[i] = this.rosterView(ready[i]);
            }
            for (i = 0, f = waiting.length; i < f; ++i) {
                waiting[i] = this.rosterView(waiting[i]);
            }

            o = {
                ready:      ready,
                waiting:    waiting
            };

            this._stage.broadcast('roster', o);
        },

        updatePerceptions: function(perceptions, session, state) {
        },


        /*********************************************
         * PUBLIC API - DON'T OVERRIDE THE FOLLOWING *
         *********************************************/

        rosterView: function(o) {
            return {
                name:   o.name,
                id:     o.id
            };
        },



        generateDefaultSession: function() {
            return {
                name: 'unnamed'
            };
        },

        getReadyPlayers: function() {
            return this._getSessions(true);
        },

        getNumReadyPlayers: function() {
            return this._getSessions(true).length;
        },

        getWaitingPlayers: function() {
            return this._getSessions(false);
        },

        getNumWaitingPlayers: function() {
            return this._getSessions(false).length;
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

            this.init(true);

            if (this._state.realTime) {
                console.log('start real-time');

                // set up game loop to run n fps
                this._timer = setInterval(
                    function() {
                        this.prePlayerUpdates();

                        var sessionsArray = this.getReadyPlayers();

                        var updateBotsFrame = this._state.frameNr % this._stage._cfg.botsRunEveryNFrames === 0;
                        var botsFrameNr = this._state.frameNr / this._stage._cfg.botsRunEveryNFrames;

                        for (var i = 0, f = sessionsArray.length, s; i < f; ++i) {
                            s = sessionsArray[i];

                            if (updateBotsFrame && s.isBot) {
                                s.context.per.frameNr = botsFrameNr;
                                this.updatePerceptions(s.context.per, s, this._state);

                                try {
                                    s.script.runInNewContext(s.context);
                                } catch (ex) {
                                    ex = 'CODE ERR: ' + ex.toString();
                                    this._stage.send('message', ex, s.socket);
                                    delete s.isBot;
                                    delete s.script;
                                    console.log(ex);
                                }

                                if (s.context.act) {
                                    //console.log([botsFrameNr, s.name, s.context.act]);
                                    this.onPlay(s.context.act, s);
                                    s.context.act = '';
                                }
                            }

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
                this._state.numPlayers = this.getReadyPlayers().length;

                this._notifyNextTurn();  // begin notifying players round-robin
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
            //console.log('frame #' + this._state.frameNr);
            //console.log('prePlayerUpdates');
        },

        onPlayerUpdate: function(session) {
            //console.log('onPlayerUpdate - ' + session.name);
        },

        postPlayerUpdates: function() {
            //console.log('postPlayerUpdates');
        },



        onPlayerEnter: function(session) {
            //console.log(['player ', session.name, ' entered'].join(''));
        },

        onPlayerExit: function(session) {
            //console.log(['player ', session.name, ' left'].join(''));
        },

        onPlayerReady: function(session) {
            //console.log(['player', session.name, ' ready.'].join(''));
        },



        onPlay: function(o, session) {
            //console.log([session.name, ' play: ', JSON.stringify(o)].join(''));
        },

        onMessage: function(o, session) {
            this._stage.broadcast('message', session.name + ': ' + o);
            //console.log([session.name, ' message: ', JSON.stringify(o)].join(''));
        }
    };




    module.exports = judge;

})();
