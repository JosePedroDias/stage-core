(function(window, undefined) {
    
    'use strict';

    /*jshint browser:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, smarttabs:true */
    /*global console:false, stage:false */
    
    
    
    var $ = function(i) { return document.querySelector(i); };

    var getCell = function(x, y) { return $(('#c' + x) + y); };

    var ctnEl = $('#ctn');

    var log = function(msg) {
        var pEl = document.createElement('p');
        pEl.innerHTML = msg;
        ctnEl.appendChild(pEl);
        ctnEl.scrollTop = ctnEl.scrollHeight;
    };



    var x, y, bEl;

    for (y = 0; y < 3; ++y) {
        for (x = 0; x < 3; ++x) {
            getCell(x, y).className = 'empty';
        }
    }

    var myPiece = '';
    var canPlay = false;

    $('#cells').addEventListener('click', function(ev) {
        var cellEl = ev.target;
        if (cellEl.className !== 'empty') { return; }
        if (!canPlay) { return log('wait for your turn!'); }
        cellEl.className = myPiece;
        var pos = [
            parseInt(cellEl.id.charAt(1), 10),
            parseInt(cellEl.id.charAt(2), 10)
        ];
        stage.send('play', pos);
        canPlay = false;
    });

    var onGameStarting = function() {
        stage.subscribe('message', function(msg) {
            log(msg);
        });

        stage.subscribe('setPiece', function(piece) {
            myPiece = piece;
            log('Your piece is ' + piece + '.');
        });

        stage.subscribe('yourTurn', function() {
            canPlay = true;
            log('Your turn now!');
        });

        stage.subscribe('play', function(o) {
            var p = o.pos;
            var cEl = getCell(p[0], p[1]);
            cEl.className = o.piece;
        });

        stage.subscribe('reset', function() {
            var x, y;
            for (y = 0; y < 3; ++y) {
                for (x = 0; x < 3; ++x) {
                    getCell(x, y).className = 'empty';
                }
            }
        });
    };

    stage.init(function(session, cfg) {
        stage.logIn(session, onGameStarting);
    });
    //stage.syncSession(onGameStarting);

    
})(window);
