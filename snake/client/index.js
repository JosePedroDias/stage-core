(function() {
    
    'use strict';
    
    /*jshint browser:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, smarttabs:true */
    /*global stage:false, console:false, alert:false */



    var cvsEl, ctx;

    var s;

    var onGameStarting = function() {
        var mapDims = stage._cfg.mapDims;
        cvsEl = document.createElement('canvas');
        s = stage._cfg.pixelMult;
        cvsEl.setAttribute('width',  mapDims[0]*s);
        cvsEl.setAttribute('height', mapDims[1]*s);
        cvsEl.style.marginLeft = -mapDims[0]/2 * s + 'px';
        cvsEl.style.marginTop  = -mapDims[1]/2 * s + 'px';
        document.body.appendChild(cvsEl);
        ctx = cvsEl.getContext('2d');
        ctx.fillStyle = '#FFF';
        ctx.fillRect(0, 0, mapDims[0]*s, mapDims[1]*s);

        stage.subscribe('setPixel', function(o) {
            ctx.fillStyle = o.color;
            ctx.fillRect(o.pos[0]*s, o.pos[1]*s, s, s);
        });

        stage.subscribe('setFruit', function(o) {
            ctx.fillStyle = '#000';
            ctx.fillRect(o.pos[0]*s, o.pos[1]*s, s, s);
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
        stage.lobby.generateForm([
            {name:'name',  kind:'text', value:session.name},
            {name:'color', kind:'text', value:session.color}
        ], onGameStarting);
    });

})();
