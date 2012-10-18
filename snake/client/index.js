(function() {
    
    'use strict';
    
    /*jshint browser:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, smarttabs:true */
    /*global stage:false, console:false, alert:false */



    var cvsEl, ctx;

    var onGameStarting = function() {
        var mapDims = stage._cfg.mapDims;
        cvsEl = document.createElement('canvas');
        cvsEl.setAttribute('width',  mapDims[0]);
        cvsEl.setAttribute('height', mapDims[1]);
        cvsEl.className = 'nnInterp';
        var s = stage._cfg.pixelMult;
        cvsEl.style.width  = mapDims[0] * s + 'px';
        cvsEl.style.height = mapDims[1] * s + 'px';
        cvsEl.style.marginLeft = -mapDims[1]/2 * s + 'px';
        cvsEl.style.marginTop  = -mapDims[1]/2 * s + 'px';
        document.body.appendChild(cvsEl);
        ctx = cvsEl.getContext('2d');
        ctx.fillStyle = '#FFF';
        ctx.fillRect(0, 0, mapDims[0], mapDims[1]);

        stage.subscribe('message',  function(msg) {
        });

        stage.subscribe('setPixel', function(o) {
            ctx.fillStyle = o.color;
            ctx.fillRect(o.pos[0], o.pos[1], 1, 1);
        });

        stage.subscribe('setFruit', function(o) {
            ctx.fillStyle = '#000';
            ctx.fillRect(o.pos[0], o.pos[1], 1, 1);
        });

        stage.subscribe('alert', function(o) {
            console.log(o);
        });
    };

    document.addEventListener('keydown', function(ev) {
        var kc = ev.keyCode;

        var dir;
        if      (kc === 37) { dir = 'left';  }
        else if (kc === 39) { dir = 'right'; }
        else if (kc === 38) { dir = 'up';    }
        else if (kc === 40) { dir = 'down';  }
        else { return; }
        ev.preventDefault();

        return stage.send('play', dir);
    });
    
    stage.init(function(session, cfg) {
        stage.logIn(session, onGameStarting);
    });
    //stage.syncSession(onGameStarting);

})();
