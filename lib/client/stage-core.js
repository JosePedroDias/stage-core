/*jshint browser:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:false, evil:true, smarttabs:true */
/*global io:false, prompt:false, console:false */



(function() {

    'use strict';

    
    // objects
    var socket = io.connect();



    // leaner JSON stringify
    var censor = function(key, value) {
        switch (typeof value) {
            case 'boolean': return (value ? 1 : 0);
            case 'number':  return Number(value.toFixed(2));
        }
        return value;
    };

    var json2 = function(o) {
        return JSON.parse( JSON.stringify(o, censor, 0) );
    };
    
    
    
    window.stage = {
        _cfg: {},

        _session: {},

        send: function(kind, o) {
            socket.emit(kind, json2(o));
        },

        subscribe: function(kind, cb) {
            socket.on(kind, cb);
        },

        syncSession: function(cb, skipPromptIfSessionFound) {
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
        }

    };
    
})();
