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

        _profile: {},

        send: function(kind, o) {
            socket.emit(kind, json2(o));
        },

        subscribe: function(kind, cb) {
            socket.on(kind, cb);
        },

        syncProfile: function(cb, skipPromptIfProfileFound) {
            var stage = this;

            this.subscribe('profileInfo', function(o) {
                //console.log('client received profileInfo', o);

                // get configuration and profile
                stage._cfg = o.cfg;

                var profile = {name: 'unnamed'};

                if (o.profile) {
                    profile = o.profile;
                    stage._profile = o.profile;
                }

                if (!skipPromptIfProfileFound) {
                    profile.name = prompt('name?', profile.name);

                    // save profile key locally for recalling next time
                    stage.subscribe('profileId', function(id) {
                        localStorage.setItem('stage_player_id', id);
                        //console.log('client received profileId', id);
                    });

                    stage.send('setProfile', profile);
                    //console.log('client sent setProfile', profile);

                    cb();
                }

                // setup form fields
                /*for (var i = 0, f = window.cfg.fields.length, field; i < f; ++i) {
                    field = window.cfg.fields[i];
                    field.value = window.profile[field.name];
                    if (field.value === undefined) {    field.value = field['default']; }
                    if (!field.label) { field.label = _(field.name);    }
                }
                
                if (!skipPromptIfProfileFound) {
                    uiMgr.formFill(document.body, window.cfg.fields, profile, function() {

                        // save profile key locally for recalling next time
                        cliUtils.subscribe('profileId', function(prfId) {
                            localStorage.setItem('stage_snake_player_id', prfId);
                        });
                        
                        // send updated/new profile
                        cliUtils.send('setProfile', profile);

                        cb();
                    });
                }*/
            });

            // try to obtain key from localStorage...
            var playerId = localStorage.getItem('stage_player_id');

            this.send('getProfile', playerId ? playerId : 'dummy');
        }

    };
    
})();
