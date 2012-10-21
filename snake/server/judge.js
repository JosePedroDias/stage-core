/* jshint node:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, smarttabs:true */
/* global console:false */


var rndInt = function(max, min) {
    if (min === undefined) { min = 0; }
    return min + ~~( (max-min) * Math.random() );
};


var DiscreteMap;



var dirVecs = {
    right: [ 1,  0],
    down:  [ 0,  1],
    left:  [-1,  0],
    up:    [ 0, -1]
};

var dirNames = Object.keys(dirVecs);



var judge = {

    _createSnake: function(session) {
        // randomize a position on the map
        var mapDims = this._stage._cfg.mapDims;
        var p = [
            rndInt(mapDims[0]),
            rndInt(mapDims[1])
        ];

        // randomize a direction and get its deltaPos
        session.direction = dirNames[ rndInt(4) ];
        var d = dirVecs[ session.direction ];

        // fill in positions and send pixels
        session.positions = [];
        for (var i = 0; i < this._stage._cfg.startLength; ++i) {
            session.positions.push(p);
            this._state.map.setCell(p[0], p[1], session.id);
            this._stage.broadcast('setPixel', {pos:p, color:session.color});
            p = [p[0] + d[0], p[1] + d[1]];
            p = this._state.map.wrapPosition(p[0], p[1]);    // wrap it
        }
    },

    _destroySnake: function(session) {
        var p;
        for (var i = 0, f = session.positions.length; i < f; ++i) {
            p = session.positions[i];
            this._state.map.setCell(p[0], p[1], 0);
            this._stage.broadcast('setPixel', {pos:p, color:'#FFFFFF'});
        }
        session.positions = [];
    },

    init: function(onStart) {
        if (onStart) { return; }

        console.log('init called.');

        var mapDims = this._stage._cfg.mapDims;

        DiscreteMap = require(this._stage._cfg.stageDir + '/lib/server/DiscreteMap').DiscreteMap;
        this._state.map = new DiscreteMap(mapDims[0], mapDims[1], undefined, true);
        this._state.map.fill(0);
    },

    generateDefaultSession: function() {
        return {
            name: 'unnamed',
            color: ['rgb(', rndInt(256), ', ', rndInt(256), ', ', rndInt(256), ')'].join('')
        };
    },



    prePlayerUpdates: function() {
        //console.log('prePlayerUpdates');
    },

    onPlayerUpdate: function(session) {
        //console.log('onPlayerUpdate - ' + session.name);

        if (!session.positions) { return; }    // player not yet ready, skip it TODO REMOVE THIS LINE?

        var state = this._state;
        var map = state.map;
        var mapDims = this._stage._cfg.mapDims;

        // remove first pos (if nor every n frame, in which case it gets bigger)
        if (state.frameNr % this._stage._cfg.increaseEveryN === 0) {
            var img = [
                rndInt(4),
                rndInt(2)
            ];

            var pos = [
                rndInt(mapDims[0]),
                rndInt(mapDims[1])
            ];

            if (state.lastFruit) {
                map.setCell(state.lastFruit[0], state.lastFruit[1], 0);
                this._stage.broadcast('setPixel', {pos:state.lastFruit, color:'#FFFFFF'});
            }
            state.lastFruit = [pos[0], pos[1]];

            map.setCell(pos[0], pos[1], 'fruit');
            this._stage.broadcast('setFruit', {img:img, pos:pos});
        }


        // get last pos...
        var p1 = session.positions[ session.positions.length - 1 ];


        // create a new pos using last pos and dir
        var d = dirVecs[ session.direction ];
        var p2 = [p1[0] + d[0], p1[1] + d[1]];
        p2 = map.wrapPosition(p2[0], p2[1]);    // wrap it
        var data = map.getCell(p2[0], p2[1]);   // get current cell

        if (data !== 0 && data !== 'fruit') {   // cell occuppied -> game over
            /*console.log(session.name, 'game over');
            this.stop();
            this._stage.broadcast('alert', 'GAME OVER:\n' + session.name + ' lost!');
            return;*/

            this._destroySnake(session);
            session.isReady = false;

            setTimeout(
                function(session) {
                    this._createSnake(session);
                    session.isReady = true;
                }.bind(this, session),
                2000
            );
        }
        else {
            var p0;
            if (data !== 'fruit') {
                p0 = session.positions.shift();
            } else {
                p0 = session.positions[0];
            }
            map.setCell(p0[0], p0[1], 0);
            this._stage.broadcast('setPixel', {pos:p0, color:'#FFFFFF'});
        }

        // add it to the end
        session.positions.push( p2 );
        map.setCell(p2[0], p2[1], session.id);
        this._stage.broadcast('setPixel', {pos:p2, color:session.color});
    },

    postPlayerUpdates: function() {
        //console.log('postPlayerUpdates');

        //this._stage.broadcast('msg', this._state.frameNr);
    },



    onPlayerEnter: function(session) {
        console.log(['player ', session.name, ' entered'].join(''));
    },

    onPlayerExit: function(session) {
        console.log(['player ', session.name, ' left'].join(''));

        this._destroySnake(session);
    },

    onPlayerReady: function(session) {
        console.log(['player ', session.name, ' ready'].join(''));

        session.points = 0;

        this._createSnake(session);

        if (!this.isRunning()) {   // have at least this player ready, start if not yet running...
            this.start();
        }
    },



    onPlay: function(o, session) {
        session.direction = o;
        //console.log([session.name, ' keys: ', JSON.stringify(o)].join(''));
    },

    onMessage: function(o, session) {
        //console.log([session.name, ' message: ', JSON.stringify(o)].join(''));
    }

};



module.exports = judge;
