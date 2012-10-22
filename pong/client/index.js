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

    var polygonDraw = function(ctx) {
        ctx.fillStyle = this.color;

        ctx.beginPath();
        var p = this.points;
        for (var i = 0, f = p.length; i < f; ++i) {
            if (i === 0) { ctx.moveTo(p[i]); }
            else {         ctx.lineTo(p[i]); }
        }
        ctx.lineTo(p[0]);
        ctx.fill();
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



    var rayCast = function(c0, c1, r, i0, di, ii) {
        var fs = [];    // from (Number[])
        var ts = [];    // to   (Number[])
        var vs = [];    // hit? (boolean)

        for (var i = i0 - di/2; i <= i0+di/2; i += ii) {
            var p = [c0[0], c0[1]];
            var q = [c0[0], c0[1]];

            var a = i * Math.PI/180;
            var dx = Math.cos(a);
            var dy = Math.sin(a);
            p[0] += dx * r;
            p[1] += dy * r;
            q[0] += dx * (r + 300);
            q[1] += dy * (r + 300);

            var t = rayCircleIntersection(p, q, c1, r);    //L0, L1, C, R

            fs.push(p);
            if (t) {
                ts.push(t);
                vs.push(true);
            }
            else {
                ts.push(q);
                vs.push(false);
            }
        }

        return {
            from: fs,
            to:   ts,
            hit:  vs
        };
    };

    (function() {
        var o = rayCast(p1, p2, r, 45, 90, 2.5);
        var i, f;

        if (true) {
            // ray lines
            for (i = 0, f = o.from.length; i < f; ++i) {
                scr.shapes.push({
                    pos:    o.from[i],
                    pos2:   o.to[i],
                    color:  o.hit[i] ? '#F00' : '#0F0',
                    draw:   lineDraw
                });
            }
        }
        else {
            // ray area TODO
            f = o.from.length;
            var ps = [];

            for (i = 0; i < f; ++i) {
                ps.push(o.from[i]);
            }

            for (i = 0; i < f; ++i) {
                ps.push(o.from[f - i - 1]);
            }

            scr.shapes.push({
                points: ps,
                color:  '#00F',
                draw:   polygonDraw
            });
        }
    })();
    
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
