(function() {
    
    'use strict';
    
    /*jshint browser:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, smarttabs:true */
    /*global stage:false, console:false, alert:false, scr:false */



    var $ = function(i) { return document.querySelector(i); };


    var onGameStarting = function() {
        stage.subscribe('update', function(o) {
            stage._o = o;
        });

        scr.onFrame();
    };

    var onSessionAvailable = function(session, cfg) {
        stage.lobby.generateForm([
            {name:'name',  kind:'text',     value:session.name},
            {name:'color', kind:'text',     value:session.color},
            {name:'code',  kind:'textarea', value:session.code}
        ], onGameStarting);
    };

    stage.init(onSessionAvailable);

    stage.console.hide();

    stage.roster.show();

    document.addEventListener('keydown', function(ev) {
        var discardEls = ['input', 'textarea', 'button'];
        if (discardEls.indexOf( ev.target.nodeName.toLowerCase() ) !== -1) { return; }

        var kc = ev.keyCode;

        var dir;
        if      (kc === 37) { dir = 'left';     }
        else if (kc === 39) { dir = 'right';    }
        else if (kc === 38) { dir = 'forward';  }
        else if (kc === 40) { dir = 'backward'; }
        else { return; }
        ev.preventDefault();

        return stage.send('play', dir);
    });

})();
