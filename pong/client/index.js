(function() {
    
    'use strict';
    
    /*jshint browser:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, smarttabs:true */
    /*global stage:false, console:false, CS:false, rayCircleIntersection:false */



    var PI  = Math.PI,
        PI2 = 2*PI,
        PIH = PI*0.5,
        RAD2DEG = 180 / Math.PI,
        DEG2RAD = Math.PI / 180;



    var dist = function(p1, p2) {
        var dx = p1[0] - p2[0];
        var dy = p1[1] - p2[1];
        return Math.sqrt(dx*dx + dy*dy);
    };

    var move = function(from, dlt, angle) {
        return [
            dlt * Math.cos(angle * DEG2RAD) + from[0],
            dlt * Math.sin(angle * DEG2RAD) + from[1]
        ];
    };



    var circleDraw = function(ctx) {
        ctx.strokeStyle = this.color;

        ctx.beginPath();
        ctx.arc(this.pos[0], this.pos[1], this.r, 0, PI2);   // ctx.arc(x, y, r, startAng, endAng, isCCW)
        ctx.stroke();
    };

    var agentDraw = function(ctx) {
        ctx.strokeStyle = this.color;

        ctx.beginPath();
            ctx.arc(this.pos[0], this.pos[1], this.r, 0, PI2);   // ctx.arc(x, y, r, startAng, endAng, isCCW)
        ctx.stroke();

        ctx.save();
            ctx.translate(this.pos[0], this.pos[1]);
            ctx.rotate(this.angle * DEG2RAD);
            ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(this.r, 0);
            ctx.stroke();
        ctx.restore();
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



    var fire = function() {
        var sh = {
            pos:      move(this.pos, this.r+5+1, this.angle),
            r:        5,
            color:    '#00F',
            v:        2,
            angle:    this.angle,
            timeLeft: 50,
            owner:    this,
            draw:     circleDraw
        };

        scr.shapes.push(sh);
        actors.push(sh);
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
        isAgent: true,
        pos:    [100, 200],
        r:      20,
        angle:  0,
        v:      0, // linear vel
        theta:  0, // angular vel
        color:  '#FF0',
        draw:   agentDraw,
        fire:   fire
    });

    scr.shapes.push({
        isAgent: true,
        pos:    [300, 200],
        r:      20,
        angle:  180,
        v:      0,
        theta:  0,
        color:  '#0FF',
        draw:   agentDraw,
        fire:   fire
    });

    scr.shapes.push({
        isAgent: true,
        pos:    [500, 200],
        r:      20,
        angle:  180,
        v:      0,
        theta:  0,
        color:  '#F0F',
        draw:   agentDraw
    });

    // obstacles

    scr.shapes.push({
        pos:    [120, 40],
        r:      20,
        color:  '#D00',
        draw:   circleDraw
    });

    scr.shapes.push({
        pos:    [120, 80],
        r:      20,
        color:  '#D00',
        draw:   circleDraw
    });

    scr.shapes.push({
        pos:    [120, 120],
        r:      20,
        color:  '#D00',
        draw:   circleDraw
    });



    var actors = [];
    actors.push(scr.shapes[0]);
    actors.push(scr.shapes[1]);
    actors.push(scr.shapes[2]);



    var obstacles = [];
    obstacles.push(scr.shapes[3]);
    obstacles.push(scr.shapes[4]);
    obstacles.push(scr.shapes[5]);



    var agentKeys = [
        {
            left:   37, // cursors rshift
            right:  39,
            up:     38,
            down:   40,
            fire:   16
        },
        {
            left:   65, // wasd space
            right:  68,
            up:     87,
            down:   83,
            fire:   32
        }
    ];

    var upd = function() {
        var i, f, pair, comb, sh, sh2, ob;

        // update actors
        for (i = 0, f = actors.length; i < f; ++i) {
            sh = actors[i];
            
            // update theta and v based on keys/random
            if (i === 0 || i === 1) {
                sh.theta = 0;
                sh.v     = 0;
                    if (scr.keys[ agentKeys[i].left  ]) { sh.theta = -2; }
                    if (scr.keys[ agentKeys[i].right ]) { sh.theta =  2; }
                    if (scr.keys[ agentKeys[i].up    ]) { sh.v     =  4; }
                    if (scr.keys[ agentKeys[i].down  ]) { sh.v     = -2; }
                    if (scr.keys[ agentKeys[i].fire  ]) { sh.fire();     }
            }
            else if (this.isAgent) {
                sh.theta = Math.random() * 4 - 2;
                sh.v     = Math.random() * 4 - 2;
            }

            // update pos and angle based on v, angle and theta
            if (sh.theta !== 0) {
                sh.angle += sh.theta;
            }

            if (sh.v !== 0) {
                sh.pos = move(sh.pos, sh.v, sh.angle);
            }

            // setup aux vars
            sh.shapes = [];
            sh.rays = {};
        }


        // each agent against obstacles
        comb = CS.comb2D(actors.length, obstacles.length);
        for (i = 0, f = comb.length; i < f; ++i) {
            pair = comb[i];
            sh = actors[    pair[0] ];
            ob = obstacles[ pair[1] ];
            if (!sh.isAgent) { continue; }
            testVisibleCollision(sh, ob);
        }


        // agent against other actors
        comb = CS.comb2(actors.length);
        for (i = 0, f = comb.length; i < f; ++i) {
            pair = comb[i];
            sh  = actors[ pair[0] ];
            sh2 = actors[ pair[1] ];

            if (sh.isAgent) {  testVisibleCollision(sh,  sh2); }
            if (sh2.isAgent) { testVisibleCollision(sh2, sh);  }
        }

        // setup rays for agents
        var k, ray;
        for (i = 0, f = actors.length; i < f; ++i) {
            sh = actors[i];
            if (!sh.isAgent) { continue; }
            for (k in sh.rays) {
                ray = sh.rays[k];
                sh.shapes.push({
                    pos:    ray.from,
                    pos2:   ray.to,
                    color:  ray.against ? sh.color : '#777',
                    draw:   lineDraw
                });
            }
        }
    };

    scr.update = upd;


    var testCollision = function(sh1, sh2) {
        var d = dist(sh1.pos, sh2.pos);
        return d < sh1.r + sh2.r;
    };

    var testVisibleCollision = function(sh1, sh2) {
        var o = rayCast(sh1.pos, sh2.pos, sh1.r, sh2.r, sh1.angle, fov, dAngle, viewDist);
        var i, f, ray, prevRay, wasHit;
        for (i = 0, f = o.from.length; i < f; ++i) {
            wasHit = o.hit[i];
            prevRay = sh1.rays[i];
            ray = {
                dist:     wasHit ? dist(o.from[i], o.to[i]) : viewDist,
                against:  wasHit ? sh2 : undefined,
                from:     o.from[i],
                to:       o.to[i],
                angle:    o.as[i]
            };
            
            if (!prevRay || ray.dist < prevRay.dist) {
                sh1.rays[i] = ray;
            }
        }
    };



    var rayCast = function(c0, c1, r0, r1, i0, di, ii, viewR) {
        var as = [],    // angles (Number in radians)
            fs = [],    // from (Number[])
            ts = [],    // to   (Number[])
            vs = [];    // hit? (Boolean)

        for (var i = i0 - di/2; i <= i0+di/2; i += ii) {
            var p = [c0[0], c0[1]];
            var q = [c0[0], c0[1]];

            var a = i * Math.PI/180;

            var dx = Math.cos(a);
            var dy = Math.sin(a);
            p[0] += dx * r0;
            p[1] += dy * r0;
            q[0] += dx * (r0 + viewR);
            q[1] += dy * (r0 + viewR);

            var t = rayCircleIntersection(p, q, c1, r1);    //L0, L1, C, R

            fs.push(p);
            as.push(a);
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
            as:   as,
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
