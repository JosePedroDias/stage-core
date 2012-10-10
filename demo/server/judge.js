/* jshint node:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, smarttabs:true */
/* global console:false */


var rndInt = function(max, min) {
	if (min === undefined) { min = 0; }
	return min + ~~( (max-min) * Math.random() );
};


// TODO
var judge = {

	sortFn: undefined,



    init: function() {
        console.log('init called.');
    },



    prePlayerUpdates: function() {
        //console.log('prePlayerUpdates');
    },

    onPlayerUpdate: function(session) {
        //console.log('onPlayerUpdate - ' + session.name);

        this._stage.broadcast('pos', {id:session.name, pos:session.pos, color:session.color});
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

        var ns = this.getNumberOfSessions();
        console.log('nr sessions: ' + ns);
    },

    onPlayerReady: function(session) {
        console.log([session.name, ' session set. Player ready!'].join(''));

        var ns = this.getNumberOfSessions();
        console.log('nr sessions: ' + ns);

        if (ns > 1) {
            this.start();
        }
    },



    onKeys: function(o, session) {
    	session.pos[0] += o[0] * 20;
    	session.pos[1] += o[1] * 20;
        //console.log([session.name, ' keys: ',     JSON.stringify(o)].join(''));
    },

    onMouse: function(o, session) {
        //console.log([session.name, ' mouse: ',    JSON.stringify(o)].join(''));
    },

    onMessage: function(o, session) {
        this._stage.broadcast('msg', ['<span style="color:', session.color, '"><b>', session.name, ' @ ', this.getTime(), ':</b> ', o, '</span>'].join(''));
        //console.log([session.name, ' message: ',  JSON.stringify(o)].join(''));
    }

};



module.exports = judge;
