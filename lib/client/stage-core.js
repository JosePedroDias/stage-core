/*jshint browser:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:false, evil:true, smarttabs:true */
/*global eio:false, prompt:false, alert:false, console:false */



(function() {

    'use strict';



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


    
    window.stage = {
        _cfg: {},

        _session: {},

        // engine.io stuff
        _socket: new eio.Socket('ws://' + location.host + '/'),

        _socketSubs: {},

        init: function(onSessionAvailableCb) {
            var that = this;

            this._socket.on('open', function() {
                if (debugSockets) { console.log('SOCKET OPENED'); }

                that._socket.on('message', function(data) {
                    if (debugSockets) { console.log('RECEIVED SOCKET MESSAGE: %s', data); }
                    data = JSON.parse(data);
                    var kind = data[0];
                    var o    = data[1];
                    var bucket = that._socketSubs[kind];
                    if (!bucket || bucket.length === 0) {
                        if (debugSockets) { console.log('WARNING: MESSAGE UNATTENDED.'); }
                        return;
                    }
                    for (var i = 0, f = bucket.length; i < f; ++i) {
                        bucket[i](o);
                    }
                });

                that._socket.on('close', function() {
                    if (debugSockets) { console.log('SOCKET CLOSED'); }
                    alert('Lost connection to server!');
                });

                that.subscribe('sessionInfo', function(o) {
                    //console.log('client received sessionInfo', o);

                    // get configuration and session
                    that._cfg = o.cfg;

                    that._session = o.session;

                    onSessionAvailableCb(o.session, o.cfg);
                });

                // try to obtain key from localStorage...
                var playerId = localStorage.getItem('stage_player_id');

                that.send('getSession', playerId ? playerId : 'bogusId');
            });
        },

        logIn: function(session, onGameStartedCb) {
            // save session key locally for recalling next time
            this.subscribe('sessionId', function(id) {
                localStorage.setItem('stage_player_id', id);
                //console.log('client received sessionId', id);
            });

            this.send('setSession', session);
            //console.log('client sent setSession', session);

            onGameStartedCb();
        },

        send: function(kind, o) {
            var data = jsonEnc(kind, o);
            this._socket.send(data);
            if (debugSockets) { console.log('SENDING MESSAGE: %s', data); }
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

        /*syncSession: function(cb, skipPromptIfSessionFound) {
            var stage = this;

            this.subscribe('sessionInfo', function(o) {
                //console.log('client received sessionInfo', o);

                // get configuration and session
                stage._cfg = o.cfg;

                var session = {name: 'unnamed'};

                if (o.session) {
                    session = o.session;
                    stage._session = o.session;
                }

                if (!skipPromptIfSessionFound) {
                    session.name = prompt('name?', session.name);

                    // save session key locally for recalling next time
                    stage.subscribe('sessionId', function(id) {
                        localStorage.setItem('stage_player_id', id);
                        //console.log('client received sessionId', id);
                    });

                    stage.send('setSession', session);
                    //console.log('client sent setSession', session);

                    cb();
                }
            });

            // try to obtain key from localStorage...
            var playerId = localStorage.getItem('stage_player_id');

            this.send('getSession', playerId ? playerId : 'dummy');
        }*/

    };
    
})();
