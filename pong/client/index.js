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


    var cannonBallNr = 1;
    var fire = function() {
        var sh = {
            name:         'cannonBall' + cannonBallNr++,
            isCannonBall: true,
            pos:         move(this.pos, this.r+5+1, this.angle),
            r:           5,
            angle:       this.angle,
            v:           5,
            theta:       0,
            color:       '#00F',
            draw:        circleDraw,
            owner:       this,
            framesToDie: 100
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
        name:         'agent1',
        isAgent:      true,
        pos:          [100, 200],
        r:            20,
        angle:        0,
        v:            0, // linear vel
        theta:        0, // angular vel
        color:        '#FF0',
        draw:         agentDraw,
        fire:         fire,
        energy:       1,
        framesToFire: 0
    });

    scr.shapes.push({
        name:         'agent2',
        isAgent:      true,
        pos:          [300, 200],
        r:            20,
        angle:        180,
        v:            0,
        theta:        0,
        color:        '#0FF',
        draw:         agentDraw,
        fire:         fire,
        energy:       1,
        framesToFire: 0
    });

    scr.shapes.push({
        name:         'agent3',
        isAgent:      true,
        pos:          [500, 200],
        r:            20,
        angle:        180,
        v:            0,
        theta:        0,
        color:        '#F0F',
        draw:         agentDraw,
        energy:       1,
        framesToFire: 0
    });

    // obstacles

    scr.shapes.push({
        name:          'wall1',
        undestroyable: true,
        pos:           [120, 40],
        r:             20,
        color:         '#D00',
        draw:          circleDraw
    });

    scr.shapes.push({
        name:          'wall2',
        undestroyable: true,
        pos:           [120, 80],
        r:             20,
        color:         '#D00',
        draw:          circleDraw
    });

    scr.shapes.push({
        name:          'wall3',
        undestroyable: true,
        pos:           [120, 120],
        r:             20,
        color:         '#D00',
        draw:          circleDraw
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

    var removeItemFromArray = function(sh, arr) {
        for (var i = 0, f = arr.length; i < f; ++i) {
            if (arr[i] === sh) {
                arr.splice(i, 1);
                return true;
            }
            return false;
        }
    };

    var updActor = function(sh, i) {
        var sh2;

        // update theta and v based on keys/random
        if (i === 0 || i === 1) {
            sh.theta = 0;
            sh.v     = 0;
                if (scr.keys[ agentKeys[i].left  ]) { sh.theta = -2; }
                if (scr.keys[ agentKeys[i].right ]) { sh.theta =  2; }

                if (!('keepV' in sh)) {
                    if (scr.keys[ agentKeys[i].up    ]) { sh.v     =  4; }
                    if (scr.keys[ agentKeys[i].down  ]) { sh.v     = -2; }
                }

                if (scr.keys[ agentKeys[i].fire ] && sh.framesToFire === 0) {
                    sh.fire();
                    sh.framesToFire = 50;
                }
        }
        else if (sh.isAgent) {
            sh.theta = Math.random() * 4 - 2;

            if (!('keepV' in sh)) {
                sh.v = Math.random() * 4 - 2;
            }
        }

        if ('keepV' in sh) {
            --sh.keepV;
            if (sh.keepV === 0) {
                delete sh.keepV;
            }
        }

        // update pos and angle based on v, angle and theta
        if (sh.theta !== 0) {
            sh.angle += sh.theta;
        }

        if (sh.v !== 0) {
            sh.pos = move(sh.pos, sh.v, sh.angle);
        }

        if (sh.framesToFire > 0) {
            --sh.framesToFire;
        }

        if ('framesToDie' in sh) {
            if (sh.framesToDie === 0) {
                return true;
            }
            else {
                --sh.framesToDie;
            }
        }

        // check for collision against other shapes
        for (var I = 0, F = scr.shapes.length; I < F; ++I) {
            sh2 = scr.shapes[I];
            if (sh === sh2) { continue; }
            if (testCollision(sh, sh2)) {
                if (sh.isCannonBall && !sh2.undestroyable) {
                    console.log('killing ' + sh2.name);
                    scr.removeShape(sh2);
                    removeItemFromArray(sh2, actors);
                    removeItemFromArray(sh2, obstacles);
                    return true;    // remove sh too
                }
                else if ('v' in sh2) {
                    console.log(sh.name + ' collided with actor ' + sh2.name);
                    sh.v  *= -0.5;
                    sh2.v *= -0.5;
                    sh.keepV  = 20;
                    sh2.keepV = 20;

                    sh.pos  = move(sh.pos,  sh.v  * 3,  sh.angle);
                    sh2.pos = move(sh2.pos, sh2.v * 3, sh2.angle);
                }
                else {
                    console.log(sh.name + ' collided with obstacle ' + sh2.name);
                    sh.v *= -1;
                    sh.keepV = 20;

                    sh.pos = move(sh.pos, sh.v * 2, sh.angle);
                }
            }
        }

        // setup aux vars
        sh.shapes = [];
        sh.rays   = {};

        return false;
    };

    var upd = function() {
        var i, f, comb, pair, sh, sh2, ob, willDie;


        // update actors
        for (i = 0, f = actors.length; i < f; ++i) {
            sh = actors[i];
            willDie = updActor(sh, i);
            if (willDie) {
                console.log('killing actor ' + sh.name);
                
                console.log( scr.removeShape(sh) );
                console.log( removeItemFromArray(sh, actors) );
                --i;
                --f;
            }
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
                if (sh.rays.hasOwnProperty(k)) {
                    ray = sh.rays[k];
                    sh.shapes.push({
                        pos:    ray.from,
                        pos2:   ray.to,
                        color:  ray.against ? sh.color : '#777',
                        draw:   lineDraw
                    });
                }
            }
        }
    };

    scr.update = upd;


    var testCollision = function(sh1, sh2) {
        var d = dist(sh1.pos, sh2.pos);
        return d < sh1.r + sh2.r;
    };

    var isOutOfBounds = function(sh) {
        console.log(scr.dims);
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
