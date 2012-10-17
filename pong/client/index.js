(function() {
    
    'use strict';
    
    /*jshint browser:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, smarttabs:true */
    /*global stage:false, console:false, CS:false */



    var scr = CS.createScreen({
        scale:      1,
        resize:     true,
        handleKeys: true
    });

    document.body.appendChild(scr.el);

    window.scr = scr;   // make scr available


    var onGameStarting = function() {
        var cfg = stage._cfg;

        stage.subscribe('message',  function(msg) {
        });
    };

    document.addEventListener('keydown', function(ev) {
        var kc = ev.keyCode;

        var dir;
        /*if      (kc === 37) { dir = 'left';  }
        else if (kc === 39) { dir = 'right'; }
        else if (kc === 38) { dir = 'up';    }
        else if (kc === 40) { dir = 'down';  }
        else { return; }
        ev.preventDefault();*/

        return stage.send('play', dir);
    });
    
    stage.init(function(session, cfg) {
        stage.logIn(session, onGameStarting);
    });

})();
