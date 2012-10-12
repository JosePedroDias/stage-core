/* jshint node:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, smarttabs:true */
/* global console:false */



var judge = {

    init: function(onStart) {
        if (onStart) { return; }

        console.log('init called.');
    },



    prePlayerUpdates: function() {
        console.log('prePlayerUpdates');
    },

    onPlayerUpdate: function(session) {
        console.log('onPlayerUpdate - ' + session.name);
    },

    postPlayerUpdates: function() {
        console.log('postPlayerUpdates');
    },



    onPlayerEnter: function(session) {
        console.log(['player ', session.name, ' entered'].join(''));
    },

    onPlayerExit: function(session) {
        console.log(['player ', session.name, ' left'].join(''));
    },

    onPlayerReady: function(session) {
        console.log(['player ', session.name, ' ready'].join(''));
    },



    onPlay: function(o, session) {
        console.log([session.name, ' play: ', JSON.stringify(o)].join(''));
    },

    onMessage: function(o, session) {
        console.log([session.name, ' message: ', JSON.stringify(o)].join(''));
    }

};



module.exports = judge;
