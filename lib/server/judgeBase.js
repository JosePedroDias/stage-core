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



                    var handleMsg = function(o) {
                        that._judge.onMessage(o, this);
                    };

                    var handleKeys = function(o) {
                        that._judge.onKeys(o, this);
                    };

                    var handleMouse = function(o) {
                        that._judge.onMouse(o, this);
                    };

                    var handleGetProfile = function(id) {
                        //console.log('server received getProfile', id);
                        var o = that._persistence.player.get(id);  // immediate!
                        var pi = {profile:o, cfg:that._stage._cfg};
                        that._stage.send('profileInfo', pi, this.socket);
                        //console.log('server sent profileInfo', pi);
                    };

                    var handleSetProfile = function(o) {
                        //console.log('server received setProfile', o);
                        o = that._persistence.player.put(o);       // immediate!
                        that._stage.send('profileId', o._id, this.socket);
                        //console.log('server sent profileId', o._id);

                        // load profile into session
                        for (var k in o) {
                            if (o.hasOwnProperty(k) && k !== '_id') {
                                this[k] = o[k];
                            }
                        }

                        that.onPlayerReady(this);
                    };


                    // connection stuff
                    that._stage.subscribe('connection', function(socket) {
                        var session =  {
                            socket:     socket,
                            id:         socket.id,
                            name:       'unnamed_' + socket.id,
                            enteredAt:  Date.now()
                        };
                        that._sessions[socket.id] = session;

                        socket.on('msg',        handleMsg.bind(session));
                        socket.on('keys',       handleKeys.bind(session));
                        socket.on('mouse',      handleMouse.bind(session));
                        socket.on('setProfile', handleSetProfile.bind(session));
                        socket.on('getProfile', handleGetProfile.bind(session));

                        socket.on('disconnect', function() {
                            var session = that._sessions[this.id];
                            that.onPlayerExit(session);
                            delete that._sessions[this.id];

                            // TODO save relevant session data
                            
                        }.bind(socket));

                        that.onPlayerEnter(session);
                    });

                    that.init();
                }
            );
        },

        getNumberOfSessions: function() {
            return Object.keys(this._sessions).length;
        },

        getSessions: function() {
            var res = [];
            for (var k in this._sessions) {
                if (!this._sessions.hasOwnProperty(k)) {  continue;   }
                res.push( this._sessions[k] );
            }

            /*if (this.sortFn) {
                res.sort(this.sortFn);
            }*/

            return res;
        },



        isRunning: function() {
            return !!this._timer;
        },

        start: function() {
            console.log('start called.');
            this._state.frameNr = 0;

            if (typeof this._cfg.fps === 'number') {
                this._timer = setInterval(
                    function() {
                        this.prePlayerUpdates();

                        var sessionsArray = this.getSessions();

                        for (var i = 0, f = sessionsArray.length, s; i < f; ++i) {
                            s = sessionsArray[i];
                            this.onPlayerUpdate(s);
                        }

                        this.postPlayerUpdates();

                        ++this.state.frameNr;
                    }.bind(this),
                    1000 / this._cfg.fps
                );
            }
        },
                
        stop: function() {
            console.log('game stopped.');
            clearInterval(this._timer);
            delete this._timer;
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
            //console.log([session.name, ' profile set. Player ready!'].join(''));
        },



        onKeys: function(o, session) {
            //console.log([session.name, ' keys: ',     JSON.stringify(o)].join(''));
        },

        onMouse: function(o, session) {
            //console.log([session.name, ' mouse: ',    JSON.stringify(o)].join(''));
        },

        onMessage: function(o, session) {
            //console.log([session.name, ' message: ',  JSON.stringify(o)].join(''));
        }
    };




    module.exports = judge;

})();
