(function() {
    
    'use strict';
    
    /*jshint browser:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, smarttabs:true */
    /*global stage:false, console:false, CS:false, rayCircleIntersection:false */



    var PI  = Math.PI,
        PI2 = 2*PI,
        PIH = PI*0.5;



    var dist = function(p1, p2) {
        var dx = p1[0] - p2[0];
        var dy = p1[1] - p2[1];
        return Math.sqrt(dx*dx + dy*dy);
    };



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



    var scr = CS.createScreen({
        scale:      1,
        resize:     true,
        handleKeys: true
        //handleMouse: true
    });
    document.body.appendChild(scr.el);
    window.scr = scr;   // make scr available



    var fov      = 90;
    var dAngle   = 2;
    var viewDist = 300;


    // actors

    scr.shapes.push({
        pos:    [100, 200],
        r:      20,
        angle:  0,
        color:  '#FF0',
        draw:   circleDraw
    });

    scr.shapes.push({
        pos:    [300, 200],
        r:      20,
        angle:  180,
        color:  '#0FF',
        draw:   circleDraw
    });

    // obstacles

    scr.shapes.push({
        pos:    [120, 40],
        r:      20,
        color:  '#F0F',
        draw:   circleDraw
    });

    scr.shapes.push({
        pos:    [120, 80],
        r:      20,
        color:  '#F0F',
        draw:   circleDraw
    });

    scr.shapes.push({
        pos:    [120, 120],
        r:      20,
        color:  '#F0F',
        draw:   circleDraw
    });



    var actors = [];
    actors.push(scr.shapes[0]);
    actors.push(scr.shapes[1]);



    var obstacles = [];
    obstacles.push(scr.shapes[2]);
    obstacles.push(scr.shapes[3]);
    obstacles.push(scr.shapes[4]);



    var upd = function() {
        var i, f, pair, comb, sh, sh2, ob;

        // update actors
        for (i = 0, f = actors.length; i < f; ++i) {
            sh = actors[i];
            sh.pos[0] += ~~( Math.random() * 3 - 1.5 );
            sh.pos[1] += ~~( Math.random() * 3 - 1.5 );
            sh.angle  += ~~( Math.random() * 5 - 2.5 );
            sh.shapes = [];

            if (i === 0) {
                if (scr.keys[37]) { sh.pos[0] -= 2; }
                if (scr.keys[39]) { sh.pos[0] += 2; }
                if (scr.keys[38]) { sh.pos[1] -= 2; }
                if (scr.keys[40]) { sh.pos[1] += 2; }
                if (scr.keys[90]) { sh.angle -= 2; }
                if (scr.keys[88]) { sh.angle += 2; }
            }
        }


        // each actor against obstacles
        comb = CS.comb2D(actors.length, obstacles.length);
        for (i = 0, f = comb.length; i < f; ++i) {
            pair = comb[i];
            sh = actors[    pair[0] ];
            ob = obstacles[ pair[1] ];
            testVisibleCollision(sh, ob);
        }


        // actors against other actors
        comb = CS.comb2(actors.length);
        for (i = 0, f = comb.length; i < f; ++i) {
            pair = comb[i];
            sh  = actors[ pair[0] ];
            sh2 = actors[ pair[1] ];
            testVisibleCollision(sh,  sh2);
            testVisibleCollision(sh2, sh);
        }
    };

    scr.update = upd;


    var testCollision = function(sh1, sh2) {
        var d = dist(sh1.pos, sh2.pos);
        return d < sh1.r + sh2.r;
    };

    var testVisibleCollision = function(sh1, sh2) {
        var o = rayCast(sh1.pos, sh2.pos, sh1.r, sh2.r, sh1.angle, fov, dAngle, viewDist);

        var i, f;

        if (true) {
            // ray lines
            for (i = 0, f = o.from.length; i < f; ++i) {
                if (!o.hit[i] && i !== 0 && i !== f - 1) { continue; }
                sh1.shapes.push({
                    pos:    o.from[i],
                    pos2:   o.to[i],
                    color:  o.hit[i] ? '#FFF' : '#777',
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

            sh1.shapes.push({
                points: ps,
                color:  '#00F',
                draw:   polygonDraw
            });
        }
    };



    var rayCast = function(c0, c1, r0, r1, i0, di, ii, viewR) {
        var fs = [];    // from (Number[])
        var ts = [];    // to   (Number[])
        var vs = [];    // hit? (boolean)

        for (var i = i0 - di/2; i <= i0+di/2; i += ii) {
            var p = [c0[0], c0[1]];
            var q = [c0[0], c0[1]];

            var a = i * Math.PI/180;
            /*if      (a < -PI) { a += PI2; }
            else if (a >  PI) { a -= PI2; }*/

            var dx = Math.cos(a);
            var dy = Math.sin(a);
            p[0] += dx * r0;
            p[1] += dy * r0;
            q[0] += dx * (r0 + viewR);
            q[1] += dy * (r0 + viewR);

            var t = rayCircleIntersection(p, q, c1, r1);    //L0, L1, C, R

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
