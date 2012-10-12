(function() {
    
    'use strict';
    
    /*jshint browser:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, smarttabs:true */
    /*global stage:false, console:false, alert:false */



    var cvsEl, ctx;

    var onGameStarting = function() {
        var cfg = stage._cfg;
        var dims = [100, 75];
        var s = 10;
        cvsEl = document.createElement('canvas');
        cvsEl.setAttribute('width',  dims[0]);
        cvsEl.setAttribute('height', dims[1]);
        cvsEl.className = 'nnInterp';
        cvsEl.style.width  = dims[0] * s + 'px';
        cvsEl.style.height = dims[1] * s + 'px';
        cvsEl.style.marginLeft = -dims[1]/2 * s + 'px';
        cvsEl.style.marginTop  = -dims[1]/2 * s + 'px';
        document.body.appendChild(cvsEl);
        ctx = cvsEl.getContext('2d');
        ctx.fillStyle = '#FFF';
        ctx.fillRect(0, 0, dims[0], dims[1]);

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
    
    stage.syncSession(onGameStarting);

})();
