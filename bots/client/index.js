(function() {
    
    'use strict';
    
    /*jshint browser:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, smarttabs:true */
    /*global stage:false, console:false, alert:false, scr:false */



    var $ = function(i) { return document.querySelector(i); };


    var onGameStarting = function() {
        stage.subscribe('message', function(msg) {
        });
    };

    var onSessionAvailable = function(session, cfg) {
        stage.lobby.generateForm([
            {name:'name', kind:'text',     value:session.name},
            {name:'code', kind:'textarea', value:session.code}
        ], onGameStarting);
    };
    
    stage.init(onSessionAvailable);

})();
