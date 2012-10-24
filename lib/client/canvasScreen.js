/*jshint browser:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, smarttabs:true */
/*global */

(function() {
    
    'use strict';

    var s$ = function(id) {return document.getElementById(id);};



    // cross-browser requestAnimationFrame
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame =
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function(cb, element) {window.setTimeout(cb, 1000 / 30);};
    }



    // bind polyfill
    if (!Function.prototype.bind) {
        Function.prototype.bind = function (oThis) {
            if (typeof this !== "function") {
                // closest thing possible to the ECMAScript 5 internal IsCallable function
                throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
            }

            var aArgs = Array.prototype.slice.call(arguments, 1),
                fToBind = this,
                FNOP = function () {},
                fBound = function () {
                    return fToBind.apply(this instanceof FNOP
                    ? this
                    : oThis || window,
                    aArgs.concat(Array.prototype.slice.call(arguments)));
                };

            FNOP.prototype = this.prototype;
            fBound.prototype = new FNOP();

            return fBound;
        };
    }


    var createCanvas = function(dims, scale) {
        var cvsEl = document.createElement('canvas');
        cvsEl.setAttribute('width',     dims[0]);
        cvsEl.setAttribute('height',    dims[1]);
        cvsEl.className = 'nnInterp';
        if (typeof scale === 'number') {
            cvsEl.style.width   = (dims[0] * scale) + 'px';
            cvsEl.style.height  = (dims[1] * scale) + 'px';
        }
        return cvsEl;
    };



    var t = 0, dt = 1000 / 30, prevDate = new Date().valueOf() - dt;



    var getAvailableDims = function() {
        return [window.innerWidth, window.innerHeight];
    };

    /**
     * {optional Number}    scale           (default is 1)
     * {optional Number[2]} dims            if undefined tries to maximize
     * {optional Boolean}   handleMouse     event handler bindings for mousedown|mousemove|mouseup
     * {optional Boolean}   handleTouch     event handler bindings for touchstart|touchmove|touchend
     * {optional Boolean}   handleKeys      event handler
     * {optional Function}  onStrokeDown
     * {optional Function}  onStrokeMove
     * {optional Function}  onStrokeUp
     */
    var createScreen = function(o) {
        if (!('scale' in o)) {
            o.scale = 1;
        }

        if (!('dims' in o)) {
            o.dims = getAvailableDims();
            if (o.scale !== 1) {
                o.dims = [
                    Math.floor(o.dims[0] / o.scale),
                    Math.floor(o.dims[1] / o.scale)
                ];
            }
        }

        var scr = createCanvas(o.dims, o.scale);

        var res = {
            el:     scr,
            dims:   o.dims,
            scroll: [0, 0],
            scale:  o.scale,
            shapes: [],
            keys:   {},
            handleMouse:    o.handleMouse,
            handleTouch:    o.handleTouch,

            onStrokeDown:   o.onStrokeDown  || function() {},
            onStrokeMove:   o.onStrokeMove  || function() {},
            onStrokeUp:     o.onStrokeUp    || function() {},

            getShape:   function(id) {
                var s;
                for (var i = 0, f = this.shapes.length; i < f; ++i) {
                    s = this.shapes[i];
                    if (s.id === id) {  return s;   }
                }
            },

            removeShape: function(sh) {
                for (var i = 0, f = this.shapes.length; i < f; ++i) {
                    if (this.shapes[i] === sh) {
                        this.shapes.splice(i, 1);
                        return true;
                    }
                }
                return false;
            },

            _onFrameShape: function(s) {
                var ctx = this.ctx;
                if ('draw' in s) {          // has draw fn? use it.
                    ctx.save();
                        if (!('static' in s)) {
                            ctx.translate(-this.scroll[0], -this.scroll[1]);
                        }
                        s.draw(ctx, this);
                    ctx.restore();
                }
                else {
                    var x = Math.round(s.pos[0] - this.scroll[0]);
                    var y = Math.round(s.pos[1] - this.scroll[1]);
                    var w = s.dims ? s.dims[0] : 0;
                    var h = s.dims ? s.dims[1] : 0;

                    if (s.color === 'transparent') {    // transparent? show stroke only
                        if (this.debug) {
                            ctx.strokeStyle = 'rgba(255, 0, 0, 0.25)';
                            ctx.strokeWidth = 2;
                            ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
                        }
                    }
                    else if ('color' in s) {            // has color?
                        if ('repeat' in s) {            // use as texture TODO IS IT?
                            ctx.save();
                            ctx.translate(x, y);
                            ctx.fillStyle = s.color;
                            ctx.fillRect(0, 0, w, h);
                            ctx.restore();
                        }
                        else {                          // regular color
                            ctx.fillStyle = s.color;
                            ctx.fillRect(x, y, w, h);
                        }
                    }
                    else if ('image' in s) {            // has image? use as tiled texture
                        if (s.repeat) {
                            s.color = ctx.createPattern(s.image, 'repeat');
                            return;
                        }
                        ctx.drawImage(s.image, x, y);
                    }
                }

                if ('shapes' in s) {    // has shapes, draw them
                    for (var i = 0, f = s.shapes.length; i < f; ++i) {
                        this._onFrameShape( s.shapes[i] );
                    }
                }
            },

            onFrame:    function() {
                if (!this.ctx) {
                    this.ctx = scr.getContext('2d');
                    this.of = this.onFrame.bind(this);
                }
                var ctx = this.ctx;

                // update
                if (this.update) {  this.update();  }

                if (this.followingShape) {
                    this.centerOnShape(this.followingShape, 0.5);
                }

                // draw shapes...
                ctx.clearRect(0, 0, this.dims[0], this.dims[1]);

                for (var i = 0, f = this.shapes.length; i < f; ++i) {
                    this._onFrameShape( this.shapes[i] );
                }

                // update dt and t
                var currDate = new Date().valueOf();
                dt = currDate - prevDate;
                prevDate = currDate;
                t += dt;
                
                this.t  = t;
                this.dt = dt;

                window.requestAnimationFrame(this.of);
            },

            centerOnPos: function(pos) {
                this.scroll = [
                    pos[0] - Math.floor(this.dims[0] / 2),
                    pos[1] - Math.floor(this.dims[1] / 2)
                ];
            },

            centerOnShape: function(shape, p) {
                /*if (p) {
                    return this.centerOnPos([
                        p * (shape.pos[0] + Math.floor(shape.dims[0] / 2)) + (1-p)*this.scroll[0],
                        p * (shape.pos[1] + Math.floor(shape.dims[1] / 2)) + (1-p)*this.scroll[1]
                    ]);
                }*/ //TODO
                this.centerOnPos([
                    shape.pos[0] + Math.floor(shape.dims[0] / 2),
                    shape.pos[1] + Math.floor(shape.dims[1] / 2)
                ]);
            },

            followShape:    function(shape) {
                this.followingShape = shape;
            },

            resize: function(dims) {
                this.dims = dims;
                this.el.setAttribute('width',  dims[0]);
                this.el.setAttribute('height', dims[1]);
                this.el.style.width  = (dims[0] * this.scale) + 'px';
                this.el.style.height = (dims[1] * this.scale) + 'px';
            },

            _onResize: function() {
                var w = Math.floor(window.innerWidth  / this.scale);
                var h = Math.floor(window.innerHeight / this.scale);
                this.dims = [w, h];
                this.el.setAttribute('width',  w);
                this.el.setAttribute('height', h);
                this.el.style.width = (w * this.scale) + 'px';
                this.el.style.height= (h * this.scale) + 'px';
                //this.ctx = this.el.getContext('2d');
            },

            _strokeHandler: function(tp, pos) {
                var gamePos = [
                    Math.floor(pos[0] / this.scale) + this.scroll[0],
                    Math.floor(pos[1] / this.scale) + this.scroll[1]
                ];

                if      (tp === 'm') {  this.onStrokeMove(  gamePos);   }
                else if (tp === 'd') {  this.onStrokeDown(  gamePos);   }
                else {                  this.onStrokeUp(    gamePos);   }

                this.lastPos = pos;
                this.lastGamePos = gamePos;
            },

            _mouseHandler: function(ev) {
                ev.preventDefault();
                var tp = ev.type.substring(5).toLowerCase().charAt(0);
                if (tp !== 'm') {   this.mouseIsDown = (tp === 'd');    }
                else if (!this.mouseIsDown) {   return; }
                var pos = [ev.clientX, ev.clientY];
                //console.log(tp, pos.join(','));
                this._strokeHandler(tp, pos);
            },

            _touchHandler: function(ev) {
                ev.preventDefault();
                var tp = ev.type.substring(5).toLowerCase().charAt(0);
                if      (tp === 's') {tp = 'd';}
                else if (tp === 'e') {tp = 'u';}
                ev = ev.changedTouches[0];
                var pos = [ev.clientX, ev.clientY];
                //console.log(tp, pos.join(','));
                this._strokeHandler(tp, pos);
            },

            _keyHandler: function(ev) {
                ev.stopPropagation();
                //console.log(ev.keyCode, ev.type === 'keydown' ? 'ON' : 'OFF');
                this.keys[ev.keyCode] = ev.type === 'keydown';
            },

            setupMouseHandling: function() {
                this.el.addEventListener('mousedown',   this._mouseHandler.bind(this));
                this.el.addEventListener('mousemove',   this._mouseHandler.bind(this));
                window.addEventListener('mouseup',      this._mouseHandler.bind(this));
            },

            setupTouchHandling: function() {
                this.el.addEventListener('touchstart',  this._touchHandler.bind(this));
                this.el.addEventListener('touchmove',   this._touchHandler.bind(this));
                window.addEventListener('touchend',     this._touchHandler.bind(this));
            },

            setupKeysHandling: function() {
                document.body.addEventListener('keydown',   this._keyHandler.bind(this));
                document.body.addEventListener('keyup',     this._keyHandler.bind(this));
            }

        };

        if (o.resize) {
            res._onResize();
            window.addEventListener('resize', res._onResize.bind(res));
        }

        if (o.handleMouse) {    res.setupMouseHandling();   }
        if (o.handleTouch) {    res.setupTouchHandling();   }
        if (o.handleKeys)  {    res.setupKeysHandling();    }

        return res;
    };



    var createSprite = function(imageEl, data) {
        return {
            pos:            [0, 0],
            vel:            [0, 0],
            imageEl:        imageEl,
            data:           data,
            states:         {},
            currentState:   undefined,
            lastLoopT:      0,

            setState:   function(stateName) {
                this.lastLoopT = t;
                this.state = this.states[stateName];
            },

            draw:   function(ctx) {
                // select frame index to use
                var sumT = 0;
                var loopT = t - this.lastLoopT;
                var idx = 0;

                if (typeof this.state === 'number') {
                    idx = this.state;
                }
                else {
                    var step, found = false;
                    for (var i = 0, f = this.state.length; i < f; ++i) {
                        step = this.state[i];
                        sumT += step[1];
                        if (loopT < sumT) {
                            found = true;
                            idx = step[0];
                            break;
                        }
                    }
                    if (!found) {
                        this.lastLoopT = t; // TODO
                    }
                }

                // draw frame
                var d = this.data[idx];
                ctx.drawImage(
                    this.imageEl,               // image
                    d.pos[0], d.pos[1],         // sx, sy
                    d.dims[0], d.dims[1],       // sw, sh
                    this.pos[0], this.pos[1],   // dx, dy
                    d.dims[0], d.dims[1]        // dw, dh
                );
            }
        };
    };



    var createDrawing = function(o) {
        var d = {};

        d.dims = o.dims || [32, 32];

        d.el = document.createElement('canvas');
        d.el.setAttribute('width',  d.dims[0]);
        d.el.setAttribute('height', d.dims[1]);

        d.ctx = d.el.getContext('2d');
        
        d.pos = [0, 0];

        d.draw = function(ctx) {
            ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)';
            ctx.strokeWidth = 0.5;
            ctx.strokeRect(-0.5, -0.5, this.dims[0] + 1, this.dims[1] + 1);

            ctx.drawImage(this.el, 0, 0);
        };

        d._prePaint = function() {
            this.dt = this.ctx.getImageData(0, 0, this.dims[0], this.dims[1]);
        };

        d._postPaint = function() {
            this.ctx.putImageData(this.dt, 0, 0);
        };

        d._isValidPos = function(p) {
            return (p[0] >= 0 && p[1] >= 0 && p[0] < this.dims[0] && p[1] < this.dims[1]);
        };

        d._p2i = function(p) {
            return (p[1] * this.dims[0] + p[0]) * 4;
        };

        d.paint = function(p, rgb, skp) {
            if (!skp) { this._prePaint(); }
            var dt = this.dt;
            var i = this._p2i(p);
            dt.data[i++] = rgb[0];
            dt.data[i++] = rgb[1];
            dt.data[i++] = rgb[2];
            dt.data[i  ] = (typeof rgb[3] === 'number') ? rgb[3] : 255;
            if (!skp) { this._postPaint(); }
        };

        d.paintMultiple = function(p, P, rgb, isnt1st) {
            if (!isnt1st) { this._prePaint(); }
            var x, y;
            for (var i = 0, f = P.length; i < f; ++i) {
                x = p[0] + P[i][0];
                y = p[1] + P[i][1];
                if (x < 0 || y < 0 || x >= this.dims[0] || y >= this.dims[1]) { continue; }
                this.paint([x, y], rgb, true);
            }
            if (!isnt1st) { this._postPaint(); }
        };

        d.floodfill = function(p, tgtClr, rplClr, isnt1st) {
            // http://en.wikipedia.org/wiki/Flood_fill
            if (!isnt1st) { this._prePaint(); }
            if (this.pick(p).toString() !== tgtClr.toString() || !this._isValidPos(p)) { return; }
            this.paint(p, rplClr, true);
            this.floodfill([p[0]-1, p[1]  ], tgtClr, rplClr, true);
            this.floodfill([p[0]+1, p[1]  ], tgtClr, rplClr, true);
            this.floodfill([p[0],   p[1]-1], tgtClr, rplClr, true);
            this.floodfill([p[0],   p[1]+1], tgtClr, rplClr, true);
            if (!isnt1st) { this._postPaint(); }
        },

        d._abstractLine = function(a, b) {
            var e2, points = [];
            // http://en.wikipedia.org/wiki/Bresenham's_line_algorithm
            var dx = Math.abs(b[0] - a[0]);
            var dy = Math.abs(b[1] - a[1]);
            var sx = (a[0] < b[0]) ? 1 : -1;
            var sy = (a[1] < b[1]) ? 1 : -1;
            var err = dx - dy;

            while (1) {
                points.push(a.slice());
                if (a[0] === b[0] && a[1] === b[1]) { return points; }
                e2 = err * 2;
                if (e2 > -dy) {
                    err -= dy;
                    a[0] += sx;
                }
                if (e2 < dx) {
                    err += dx;
                    a[1] += sy;
                }
            }
        };

        d.line = function(a, b, P, clr) {
            this._prePaint();
            var points = this._abstractLine(a, b);
            for (var i = 0, f = points.length; i < f; ++i) {
                this.paintMultiple(points[i], P, clr, true);
            }
            this._postPaint();
        },

        d._plot4 = function(ctrP, x, y, points) {
            points.push([ctrP[0] + x, ctrP[1] + y]);
            if (x !== 0) {            points.push([ctrP[0] - x, ctrP[1] + y]); }
            if (y !== 0) {            points.push([ctrP[0] + x, ctrP[1] - y]); }
            if (x !== 0 && y !== 0) { points.push([ctrP[0] - x, ctrP[1] - y]); }
        };

        d._plot8 = function(ctrP, x, y, points) {
            this._plot4(ctrP, x, y, points);
            if (x === y) { return; }
            this._plot4(ctrP, y, x, points);
        };

        d._abstractCircle = function(centerP, r) {
            var points = [];
            var err = -r;
            var x = r;
            var y = 0;

            while (x > y) {
                this._plot8(centerP, x, y, points);
                err += y;
                ++y;
                err += y;

                if (err >= 0) {
                    err -= x;
                    --x;
                    err -= x;
                }
            }

            return points;
        };

        d.circle = function(ctrP, arcP, P, clr) {
            var dx = ctrP[0] - arcP[0];
            var dy = ctrP[1] - arcP[1];
            var r = Math.round( Math.sqrt(dx*dx + dy*dy) );
            this._prePaint();
            var points = this._abstractCircle(ctrP, r);
            for (var i = 0, f = points.length; i < f; ++i) {
                this.paintMultiple(points[i], P, clr, true);
            }
            this._postPaint();
        },

        d.pick = function(p) {
            var rgb = new Array(4);
            this._prePaint();
            var dt = this.dt;
            var i = this._p2i(p);
            return [
                dt.data[i++],
                dt.data[i++],
                dt.data[i++],
                dt.data[i  ]
            ];
        };

        d.getData = function() {
            return this.el.toDataURL('image/png');
        };

        d.resize = function(dims) {
            //if (this.dims[0] === dims[0] && this.dims[1] === dims[1]) { return; }
            this.dims = dims;
            this.el.setAttribute('width',  dims[0]);
            this.el.setAttribute('height', dims[1]);
            this.ctx = this.el.getContext('2d');
        };

        d.setData = function(base64Data) {
            var imgEl = document.createElement('img');
            var that = this;
            imgEl.onload = function() {
                var dims = [imgEl.width, imgEl.height];
                that.resize(dims);
                that.ctx.drawImage(imgEl, 0, 0);
            };
            imgEl.src = base64Data;
        };

        return d;
    };



    var _comb2Cache = {};

    var comb2 = function(n) {
        var r;

        r = _comb2Cache[n];
        if (r) { return r; }

        var a, A;
        var b, B;
        r = [];
        for (a = 0, A = n; a < A; ++a) {
            for (b = a + 1, B = n; b < B; ++b) {
                r.push([a, b]);
            }
        }

        _comb2Cache[n] = r;

        return r;
    };

    var _comb2DCache = {};

    var comb2D = function(n, N) {   // disjoin
        var r;

        var k = n + ' ' + N;

        r = _comb2DCache[k];
        if (r) { return r; }

        var a, A;
        var b, B;
        r = [];
        for (a = 0, A = n; a < A; ++a) {
            for (b = 0, B = N; b < B; ++b) {
                r.push([a, b]);
            }
        }

        _comb2DCache[k] = r;

        return r;
    };



    window.CS = {
        comb2:          comb2,
        comb2D:         comb2D,

        createSprite:   createSprite,
        createScreen:   createScreen,
        createDrawing:  createDrawing,
        t:              t,
        dt:             dt
    };
    window.s$ = s$;
    
})();
