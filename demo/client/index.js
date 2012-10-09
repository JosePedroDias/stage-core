(function() {
    
    'use strict';
    
    /*jshint browser:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, smarttabs:true */
    /*global stage:false */
    
    var onGameStarting = function() {
        stage.subscribe('setPixel', function(a) {
            cvs.setPixel(a.color, a.pos[0], a.pos[1]);
        });

        stage.subscribe('clearPixel', function(a) {
            cvs.clearPixel(a.pos[0], a.pos[1], 0);
        });

        stage.subscribe('setFruit', function(a) {
            cvs.setPixel(a.color, a.pos[0], a.pos[1], 0, true);
        });

        stage.subscribe('alert', function(a) {
            uiMgr.notify(a);
        });
    }
    
    stage.syncProfile(onGameStarting);

})();
