/* jshint node:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, smarttabs:true */
/* global console:false */



var judge = {

    init: function(onStart) {
        //if (onStart) { return; }

        console.log('init called.');
    },

    generateDefaultSession: function() {
        return {
            name: 'unnamed_bot',
            code: [
                '// available inputs/perceptions:   per',
                '// available output/action:        act, default is noop',
                '// internal state:                 stt',
                '',
                'if (isNaN(stt.x)) { stt.x = 0; }',
                'console.log(++stt.x);',
                'act="left";'
            ].join('\n')
        };
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
        console.log(['player ', session.name, ' entered'].join(''));
    },

    onPlayerExit: function(session) {
        console.log(['player ', session.name, ' left'].join(''));

        if (this.getNumReadyPlayers() === 0) {
            this.stop();
        }
    },

    onPlayerReady: function(session) {
        console.log(['player ', session.name, ' ready'].join(''));

        if (this.getNumReadyPlayers() > 0) {
            this.start();
        }
    },



    onPlay: function(o, session) {
        console.log([session.name, ' play: ', JSON.stringify(o)].join(''));
    },

    onMessage: function(o, session) {
        //console.log([session.name, ' message: ', JSON.stringify(o)].join(''));

        this._stage.broadcast('message', session.name + ': ' + o);
    },



    updateBotPerceptions: function(perceptions, session, state) {
        perceptions.position = session.position;
        perceptions.rotation = session.rotation;
    }

};



module.exports = judge;
