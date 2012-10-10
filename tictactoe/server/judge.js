/* jshint node:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, smarttabs:true */
/* global console:false */



var DiscreteMap;




var judge = {

    init: function() {
        console.log('init called.');

        DiscreteMap = require(this._stage._cfg.stageDir + '/lib/server/DiscreteMap').DiscreteMap;
        this._state.map = new DiscreteMap(3, 3);
    },



    // REAL-TIME CBs
    /*prePlayerUpdates: function() {
        //console.log('prePlayerUpdates');
    },

    onPlayerUpdate: function(session) {
        //console.log('onPlayerUpdate - ' + session.name);
    },

    postPlayerUpdates: function() {
        //console.log('postPlayerUpdates');
    },*/



    onPlayerEnter: function(session) {
        var msg = 'player ' + session.name + ' getting ready...';
        console.log(msg);
        this._stage.broadcast('message', msg);
    },

    onPlayerExit: function(session) {
        var ns = this.getNumberOfSessions();
        var msg = 'player ' + session.name + ' left. players still in: ' + ns;
        console.log(msg);
        this._stage.broadcast('message', msg);
    },

    onPlayerReady: function(session) {
        var msg = 'player ' + session.name + ' ready!';
        console.log(msg);
        this._stage.broadcast('message', msg);

        var ns = this.getNumberOfSessions();

        if (ns < 2) {
            msg = 'waiting for players...';
            console.log(msg);
            this._stage.broadcast('message', msg);
        }
        else if (ns === 2) {
            var sessions = this.getSessions();
            sessions[0].piece = 'x';
            sessions[1].piece = 'o';
            msg = [
                'let\'s begin! ',
                sessions[0].name, ' plays ', sessions[0].piece, ', ',
                sessions[1].name, ' plays ', sessions[1].piece, '.'
            ].join('');
            console.log(msg);
            this._stage.broadcast('message', msg);

            this._stage.send('setPiece', sessions[0].piece, sessions[0].socket);
            this._stage.send('setPiece', sessions[1].piece, sessions[1].socket);

            this._state.numPlayers = 2;

            this.start();
        }
        else {
            msg = 'too many players!';
            console.log(msg);
            this._stage.broadcast('message', msg);
        }
    },



    onPlay: function(pos, session) {
        // validate it is your turn
        var sessions = this.getSessions();
        if (session !== sessions[ this._state.nextToPlay ]) {
            console.log('ignoring play out of turn!');
            return;
        }
        
        console.log([
            'got pos ', pos.join(','), ' from player #', this._state.nextToPlay, ' (', session.piece, ').'
        ].join(''));

        this._state.map.setCell(pos[0], pos[1], session.piece);
        console.log( this._state.map.toString(true) );

        var play = {
            piece:  session.piece,
            pos:    pos
        };

        ++this._state.nextToPlay;
        if (this._state.nextToPlay >= this._state.numPlayers) {
            this._state.nextToPlay = 0;
        }

        // update state for other player
        this._stage.send('play', play, sessions[ this._state.nextToPlay ].socket);

        this._notifyNextTurn();

        //console.log([session.name, ' play: ', JSON.stringify(o)].join(''));
    },

    onMessage: function(o, session) {
        this._stage.broadcast('message', ['<b>', session.name, ' @ ', this.getTime(), ':</b> ', o].join(''));
        //console.log([session.name, ' message: ', JSON.stringify(o)].join(''));
    }

};



module.exports = judge;
