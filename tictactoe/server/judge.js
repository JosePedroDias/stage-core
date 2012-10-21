/* jshint node:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, smarttabs:true */
/* global console:false */



var DiscreteMap;



var validateTTTMap = function(map) {
    var hasSpace = false;

    var i;
    for (i = 0; i < 9; ++i) {
        if (!map._d[i]) { hasSpace = true; break; }
    }

    var pairs = [
        [ [0, 0], [1, 0] ], // horizontals
        [ [0, 1], [1, 0] ],
        [ [0, 2], [1, 0] ],

        [ [0, 0], [0, 1] ], // verticals
        [ [1, 0], [0, 1] ],
        [ [2, 0], [0, 1] ],

        [ [0, 0], [1, 1] ], // diagonals
        [ [2, 0], [-1, 1] ]
    ];

    var p, pair, o, lastO;
    for (p = 0; p < 8; ++p) {
        pair = pairs[p];
        for (i = 0; i < 3; ++i) {
            o = map.getCell(
                pair[0][0] + pair[1][0] * i,
                pair[0][1] + pair[1][1] * i
            );
            if (!o) { break; }
            if (i === 0) { lastO = o; }
            else if (lastO !== o) { break; }
            if (i === 2) {
                return {
                    whoWon:   o,
                    hasSpace: hasSpace
                };
            }
        }
    }

    return {
        whoWon:   undefined,
        hasSpace: hasSpace
    };
};




var judge = {

    init: function(onStart) {
        if (onStart) { return; }
        
        //console.log('init called.');

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
        var ns = this.getNumReadyPlayers();
        var msg = 'player ' + session.name + ' left. players still in: ' + ns;
        console.log(msg);
        this._stage.broadcast('message', msg);
    },

    onPlayerReady: function(session) {
        var msg = 'player ' + session.name + ' ready!';
        console.log(msg);
        this._stage.broadcast('message', msg);

        var sessions = this.getReadyPlayers();
        var ns = sessions.length;

        if (ns < 2) {
            msg = 'waiting for players...';
            console.log(msg);
            this._stage.broadcast('message', msg);
        }
        else if (ns === 2) {
            sessions[0].piece = 'x';
            sessions[1].piece = 'o';
            msg = [
                'let\'s begin! ',
                sessions[0].name, ' plays ', sessions[0].piece, ', ',
                sessions[1].name, ' plays ', sessions[1].piece, '.'
            ].join('');
            console.log(msg);
            this._stage.broadcast('message', msg);

            this._stage.send('setPiece', sessions[0].piece, sessions[0]);
            this._stage.send('setPiece', sessions[1].piece, sessions[1]);

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
        /*console.log([
            'got pos ', pos.join(','), ' from player #', this._state.nextToPlay, ' (', session.piece, ').'
        ].join(''));*/

        this._state.map.setCell(pos[0], pos[1], session.piece);
        //console.log( this._state.map.toString(true) );

        var val = validateTTTMap(this._state.map);
        //console.log(val);

        var msg = '';
        if (val.whoWon) {
            msg = ['Player ', session.name, ' (', session.piece, ') won!'].join('');
            
        }
        else if (!val.hasSpace) {
            msg = 'No one won...';
        }

        if (msg) {
            this._stage.broadcast('message', msg);
            this.stop();
            this._stage.broadcast('reset', msg);
            this.start();
            return;
        }

        var play = {
            piece:  session.piece,
            pos:    pos
        };

        // update state for other player
        var sessions = this.getReadyPlayers();
        var otherPlayer = (this._state.nextToPlay + 1) % 2;
        this._stage.send('play', play, sessions[ otherPlayer ]);

        //console.log([session.name, ' play: ', JSON.stringify(o)].join(''));
    },

    onMessage: function(o, session) {
        this._stage.broadcast('message', ['<b>', session.name, ' @ ', this.getTime(), ':</b> ', o].join(''));
        //console.log([session.name, ' message: ', JSON.stringify(o)].join(''));
    }

};



module.exports = judge;
