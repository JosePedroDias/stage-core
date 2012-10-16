/* jshint node:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, smarttabs:true */
/* global console:false */



var rndInt = function(max, min) {
    if (min === undefined) { min = 0; }
    return min + ~~( (max-min) * Math.random() );
};

var PI2     = Math.PI * 2,
    RAD2DEG = 180 / Math.PI,
    DEG2RAD = Math.PI / 180;



var judge = {

    init: function(onStart) {
        if (!onStart) { return; }

        console.log('init called.');

        var sessions = this.getReadyPlayers();
        var s;
        for (var i = 0, f = sessions.length; i < f; ++i) {
            s = sessions[i];
            s.pos = [
                rndInt(640),
                rndInt(480)
            ];
            s.angle = rndInt(360);
            s.dV = 0;
            s.dA = 0;
            /*console.log(s.pos);
            console.log(s.angle);*/
        }
    },

    generateDefaultSession: function() {
        return {
            name: 'unnamed_bot',
            color: ['rgb(', rndInt(256), ', ', rndInt(256), ', ', rndInt(256), ')'].join(''),
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

    rosterView: function(o) {
            return {
                name:   ['<span style="color:', o.color, '">', o.name, '</span>', (o.isBot ? ' (BOT)' : ' (HUMAN)')].join(''),
                id:     o.id
            };
        },



    prePlayerUpdates: function() {
        //console.log('prePlayerUpdates');
    },

    onPlayerUpdate: function(s) {
        //console.log('onPlayerUpdate - ' + session.name);
        var dt = 1/30;

        if (s.dA) { s.angle += s.dA; }

        s.pos = [
            s.pos[0] + s.dV * dt * Math.cos(s.angle * DEG2RAD),
            s.pos[1] + s.dV * dt * Math.sin(s.angle * DEG2RAD)
        ];
    },

    postPlayerUpdates: function() {
        var sessions = this.getReadyPlayers();
        var o = [], s;
        for (var i = 0, f = sessions.length; i < f; ++i) {
            s = sessions[i];
            o.push({
                name:   s.name,
                color:  s.color,

                pos:    s.pos,
                angle:  s.angle
            });
        }
        this._stage.broadcast('update', o);
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
        //console.log([session.name, ' play: ', JSON.stringify(o)].join(''));

        var V = 20;
        var A = 3;

        if      (o === 'forward') {  session.dV =  V; }
        else if (o === 'backward') { session.dV = -V; }
        else {                       session.dV =  0; }

        if      (o === 'left') {  session.dA = -A; }
        else if (o === 'right') { session.dA =  A; }
        else {                    session.dA =  0; }
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
