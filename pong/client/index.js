(function() {
    
    'use strict';
    
    /*jshint browser:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, smarttabs:true */
    /*global stage:false, console:false, CS:false, rayCircleIntersection:false */



    var PI  = Math.PI,
        PI2 = 2*PI;

    var scr = CS.createScreen({
        scale:      1,
        resize:     true
    });

    document.body.appendChild(scr.el);

    window.scr = scr;   // make scr available

    var r = 20;
    var p1 = [40, 50];
    var p2 = [160, 130];

    var circleDraw = function(ctx) {
        ctx.strokeStyle = this.color;

        ctx.beginPath();
        ctx.arc(this.pos[0], this.pos[1], this.r, 0, PI2);   // ctx.arc(x, y, r, startAng, endAng, isCCW)
        ctx.stroke();
    };

    var lineDraw = function(ctx) {
        ctx.strokeStyle = this.color;

        ctx.beginPath();
        ctx.moveTo(this.pos[0],  this.pos[1]);
        ctx.lineTo(this.pos2[0], this.pos2[1]);
        ctx.stroke();
    };

    scr.shapes.push({
        pos:    p1,
        r:      r,
        color:  '#F00',
        draw:   circleDraw
    });

    scr.shapes.push({
        pos:    p2,
        r:      r,
        color:  '#F00',
        draw:   circleDraw
    });

    for (var i = 0; i < 360; i += 4) {

        var clr = '#0F0';

        var c0 = p1;
        var c1 = p2;

        var p = [c0[0], c0[1]];
        var q = [c0[0], c0[1]];

        var t = rayCircleIntersection(p, q, c1, r);    //L0, L1, C, R
        if (t) {
            console.log(t);
            q   = t;
            clr = '#F00';
        }

        var a = i * 180/Math.PI;
        var dx = Math.cos(a);
        var dy = Math.sin(a);
        p[0] += dx * r;
        p[1] += dy * r;
        q[0] += dx * (r + 300);
        q[1] += dy * (r + 300);

        scr.shapes.push({
            pos:    p,
            pos2:   q,
            color:  '#0F0',
            draw:   lineDraw
        });
    }

    scr.onFrame();

    


    var onGameStarting = function() {
        var cfg = stage._cfg;

        stage.subscribe('message',  function(msg) {
        });
    };
    
    stage.init(function(session, cfg) {
        stage.logIn(session, onGameStarting);
    });

})();
