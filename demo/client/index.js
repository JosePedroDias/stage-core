(function() {
    
    'use strict';
    
    /*jshint browser:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, smarttabs:true */
    /*global stage:false, console:false */

    var $ = function(i) { return document.querySelector(i); };

    var ctnEl  = $('#ctn');
    var lineEl = $('#line');

    var addLine = function(line) {
        var pEl = document.createElement('p');
        pEl.innerHTML = line;
        ctnEl.appendChild(pEl);
        ctnEl.scrollTop = ctnEl.scrollHeight;
    };

    var onMessage = function(msg) {
        console.log('<- %s', msg);
        addLine(msg);
    };

    var onPos = function(o) {   // id, pos
        console.log(o);
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
        stage.subscribe('message', onMessage);
        stage.subscribe('pos', onPos);
        addLine('starting...');
        lineEl.focus();
    };

    lineEl.addEventListener('keydown', function(ev) {
        var kc = ev.keyCode;

        var dP = [0, 0];
        if (kc === 37) { dP[0] = -1; }
        if (kc === 39) { dP[0] =  1; }
        if (kc === 38) { dP[1] = -1; }
        if (kc === 40) { dP[1] =  1; }

        if (dP[0] !== 0 || dP[1] !== 0) {
            console.log('-> ' + dP.join(','));
            return stage.send('keys', dP);
        }

        if (kc !== 13) { return; }
        ev.preventDefault();
        var msg = lineEl.value;
        lineEl.value = '';
        lineEl.focus();
        console.log('-> %s', msg);
        stage.send('msg', msg);
    });
    
    stage.syncSession(onGameStarting);

})();
