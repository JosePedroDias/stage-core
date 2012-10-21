(function() {
    
    'use strict';
    
    /*jshint browser:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, smarttabs:true */
    /*global stage:false, console:false */

    var $ = function(i) { return document.querySelector(i); };

    var onPos = function(o) {   // id, pos
        var el = $('#' + o.id);
        if (!el) {
            el = document.createElement('div');
            el.setAttribute('id', o.id);
            el.className = 'player';
            el.style.backgroundColor = o.color;
            document.body.appendChild(el);
        }
        el.style.left = o.pos[0] + 'px';
        el.style.top  = o.pos[1] + 'px';
    };
    
    var onGameStarting = function() {
        //stage.subscribe('message', onMessage);
        stage.subscribe('pos', onPos);
    };

    window.addEventListener('keydown', function(ev) {
        var els = ['input', 'textarea'];
        var tgtEl = ev.target;
        var tgtName = tgtEl.name.toLowerCase();
        if (els.indexOf(tgtName) !== -1) { return; }

        var kc = ev.keyCode;
        var dP = [0, 0];
        if      (kc === 37) { dP[0] = -1; }
        else if (kc === 39) { dP[0] =  1; }
        else if (kc === 38) { dP[1] = -1; }
        else if (kc === 40) { dP[1] =  1; }
        else {
            return;
        }
        ev.preventDefault();
        stage.send('play', dP);
    });
    
    stage.init(function(session, cfg) {
        stage.lobby.generateForm([
            {name:'name',  kind:'text', value:session.name},
            {name:'color', kind:'text', value:session.color}
        ], onGameStarting);
    });
    stage.console.hide();
    stage.roster.show();

})();
