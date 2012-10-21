/* jshint node:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, smarttabs:true */
/* global console:false */


var rndInt = function(max, min) {
    if (min === undefined) { min = 0; }
    return min + ~~( (max-min) * Math.random() );
};



var judge = {

    sortFn: undefined,



    init: function(onStart) {
        if (onStart) { return; }

        console.log('init called.');
    },



    generateDefaultSession: function() {
        return {
            name:  'unnamed',
            color: ['rgb(', rndInt(256), ', ', rndInt(256), ', ', rndInt(256), ')'].join('')
        };
    },



    prePlayerUpdates: function() {
        //console.log('prePlayerUpdates');
    },

    onPlayerUpdate: function(session) {
        //console.log('onPlayerUpdate - ' + session.name);

        if (session.changed) {
            this._stage.broadcast('pos', {id:session.name, pos:session.pos, color:session.color});
            delete session.changed;
        }
    },

    postPlayerUpdates: function() {
        //console.log('postPlayerUpdates');

        //this._stage.broadcast('msg', this._state.frameNr);
    },



    onPlayerEnter: function(session) {
        console.log(['-> player ', session.name, ' entered'].join(''));

        session.pos = [
            rndInt(500),
            rndInt(500)
        ];

        session.color = ['rgb(', rndInt(255), ', ', rndInt(255), ', ', rndInt(255), ')'].join('');
    },

    onPlayerExit: function(session) {
        console.log(['-> player ', session.name, ' left'].join(''));
        this._stage.broadcast('message', '** ' + session.name + ' left. **');

        var ns = this.getNumReadyPlayers();
        console.log('nr players: ' + ns);

        if (ns > 2) { this.stop(); }
        this._stage.broadcast('message', '** GAME STOPPED **');
    },

    onPlayerReady: function(session) {
        session.changed = true;
        console.log([session.name, ' session set. Player ready!'].join(''));
        this._stage.broadcast('message', '** ' + session.name + ' got in. **');

        var ns = this.getNumReadyPlayers();
        console.log('nr players: ' + ns);

        if (ns > 1) {
            this.start();
            this._stage.broadcast('message', '** GAME STARTED **');
        }
        else {
            this._stage.broadcast('message', '** WAITING FOR AT LEAST 1 MORE PLAYER... **');
        }
    },



    onPlay: function(o, session) {
        session.pos[0] += o[0] * 20;
        session.pos[1] += o[1] * 20;
        session.changed = true;
        //console.log([session.name, ' keys: ', JSON.stringify(o)].join(''));
    },

    onMessage: function(o, session) {
        this._stage.broadcast('message', ['<span style="color:', session.color, '"><b>', session.name, ' @ ', this.getTime(), ':</b> ', o, '</span>'].join(''));
        //console.log([session.name, ' message: ', JSON.stringify(o)].join(''));
    }

};



module.exports = judge;
