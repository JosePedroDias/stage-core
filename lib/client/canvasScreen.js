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


    var getVisibleDims = function() {
        return [window.innerWidth, window.innerHeight];
    };



    var extend = function(dest, src) {
        for (var prop in src) {
            if (src[prop] === undefined) {
                dest[prop] = src[prop];
            }
        }
        return dest;
    };


    /**
     * @namespace CS
     */

    /**
     * CS.Shape has a simple API:
     *   {Number[2]}                   pos     top left corner of the image (if )
     *   {Number[2]}                   dims    shape dimensions (bounding box)
     *   {optional Function(ctx, scr)} draw    custom draw function
     *   {optional CS.Shape[]}         shapes  optional array of sub-shapes
     *   {optional Boolean}            static  iif true draws in screen space, otherwise in scene space (applying scroll)
     *   {optional String}             color   used on some draw() fns
     *   {optional DOMImg}             image   image to use as texture/sprite
     *   {optional Boolean}            repeat  iif true wraps image (like background-image-repeat)
     */

    /**
     * @class CS.Screen
     *
     * we expose directly:
     *   Object[] shapes
     *   Number   t
     *   Number   dt
     *
     * a shape is expected to have:
     *   Number[2] pos
     *   Number[2] dims
     *   optional Function(ctx) draw
     *   optional Object[] shapes
     */

    /**
     * @constructor CS.Screen.?
     *
     * @param {Object} o
     * @... {optional Number}    scale           (default is 1)
     * @... {optional Number[2]} dims            if undefined tries to maximize
     * @... {optional Boolean}   handleMouse     listen to mouse events mousedown|mousemove|mouseup
     * @... {optional Boolean}   handleTouch     listen to touch events touchstart|touchmove|touchend
     * @... {optional Boolean}   handleKeys      listen to key events keydown|keyup
     * @... {optional Function}  onStrokeDown    custom callback for mouse|touch down
     * @... {optional Function}  onStrokeMove    custom callback for mouse|touch move
     * @... {optional Function}  onStrokeUp      custom callback for mouse|touch up
     */
    var Screen = function(o) {
        if (!o.scale) { o.scale = 1; }
        if (!o.dims) { o.dims = getVisibleDims(); }
        if (!o.dims && o.scale !== 1) {
            o.dims = [
                Math.floor(o.dims[0] / o.scale),
                Math.floor(o.dims[1] / o.scale)
            ];
        }

        this._scale = o.scale;
        this._dims = o.dims;

        this._handlers = {
            frame:  this._onFrame.bind(this),
            resize: this._onResize.bind(this),
            mouse:  this._onMouse.bind(this),
            touch:  this._onTouch.bind(this),
            key:    this._onKey.bind(this)
        };

        this._cvsEl = document.createElement('canvas');
        this._cvsEl.setAttribute('width',   this._dims[0]);
        this._cvsEl.setAttribute('height',  this._dims[1]);
        this._cvsEl.className = 'nnInterp';
        if (this._scale !== 1) {
            this._cvsEl.style.width   = (this._dims[0] * this._scale) + 'px';
            this._cvsEl.style.height  = (this._dims[1] * this._scale) + 'px';
        }
        this._ctx = this._cvsEl.getContext('2d');
        this._scroll = [0, 0];

        this.keys   = {};
        this.shapes = [];
        this.t      = 0;
        this.dt     = 0.00001;
        this._prevT = new Date().valueOf();

        if (o.resize) {
            this._onResize();
            window.addEventListener('resize', this._handlers.resize);
        }

        if (o.handleMouse) {
            this._cvsEl.addEventListener('mousedown', this._handlers.mouse);
            this._cvsEl.addEventListener('mousemove', this._handlers.mouse);
            window.addEventListener(     'mouseup',   this._handlers.mouse);
        }

        if (o.handleTouch) {
            this._cvsEl.addEventListener('touchstart', this._handlers.touch);
            this._cvsEl.addEventListener('touchmove',  this._handlers.touch);
            window.addEventListener(     'touchend',   this._handlers.touch);
        }
        if (o.handleKeys) {
            document.body.addEventListener('keydown', this._handlers.key);
            document.body.addEventListener('keyup',   this._handlers.key);
        }

        this._onStrokeDown = o.onStrokeDown || function() {};
        this._onStrokeMove = o.onStrokeMove || function() {};
        this._onStrokeUp   = o.onStrokeUp   || function() {};
    };

    Screen.prototype = {

        /**
         * @function {CS.Shape} ?
         * @param {String} id
         */
        getShape: function(id) {
            var s;
            for (var i = 0, f = this.shapes.length; i < f; ++i) {
                s = this.shapes[i];
                if (s.id === id) { return s; }
            }
        },

        /**
         * @function {Boolean} ?
         * @param {CS.Shape} shape
         */
        removeShape: function(shape) {
            for (var i = 0, f = this.shapes.length; i < f; ++i) {
                if (this.shapes[i] === shape) {
                    this.shapes.splice(i, 1);
                    return true;
                }
            }
            return false;
        },

        /**
         * @function ?
         * @param {Number[2]} pos
         */
        centerOnPos: function(pos) {
            this.scroll = [
                pos[0] - Math.floor(this.dims[0] / 2),
                pos[1] - Math.floor(this.dims[1] / 2)
            ];
        },

        /**
         * @function ?
         * @param {CS.Shape} shape
         */
        centerOnShape: function(shape) {
            this.centerOnPos([
                shape.pos[0] + Math.floor(shape.dims[0] / 2),
                shape.pos[1] + Math.floor(shape.dims[1] / 2)
            ]);
        },

        /**
         * @function ?
         * @param {CS.Shape} shape
         */
        followShape: function(shape) {
            this._followingShape = shape;
        },

        /**
         * @function ?
         */
        run: function() {
            if (!this._cvsEl.parentNode) {
                document.body.appendChild(this._cvsEl);
            }
            this._onFrame();
        },

        /**
         * @function ?
         * @param {Number[2]} dims
         */
        resize: function(dims) {
            this._dims = dims;
            this.el.setAttribute('width', this._dims[0]);
            this.el.setAttribute('height', this._dims[1]);
            this.el.style.width  = (this._dims[0] * this.scale) + 'px';
            this.el.style.height = (this._dims[1] * this.scale) + 'px';
        },



        /***************
         * PRIVATE API *
         ***************/

        _onFrame: function() {
            var ctx = this._ctx;

            // update
            if (this.update) { this.update(); }

            if (this._followingShape) {
                this.centerOnShape(this._followingShape, 0.5);
            }

            // draw shapes...
            ctx.clearRect(0, 0, this._dims[0], this._dims[1]);

            for (var i = 0, f = this.shapes.length; i < f; ++i) {
                this._onFrameShape( this.shapes[i] );
            }

            // update dt and t
            var t = new Date().valueOf();
            var dt = t - this._prevT;
            this._prevT = t;
            this.t += dt;
            this.dt = dt;

            window.requestAnimationFrame(this._handlers.frame);
        },

        _onFrameShape: function(s) {
            var ctx = this._ctx;
            if ('draw' in s) {          // has draw fn? use it.
                ctx.save();
                    if (!('static' in s)) {
                        ctx.translate(-this._scroll[0], -this._scroll[1]);
                    }
                    s.draw(ctx, this);
                ctx.restore();
            }
            else {
                var x = Math.round(s.pos[0] - this._scroll[0]);
                var y = Math.round(s.pos[1] - this._scroll[1]);
                var w = s.dims ? s.dims[0] : 0;
                var h = s.dims ? s.dims[1] : 0;

                if (s.color === 'transparent') {    // transparent? show stroke only
                    if (this._debug) {
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

        _onResize: function() {
            var w = Math.floor(window.innerWidth  / this._scale);
            var h = Math.floor(window.innerHeight / this._scale);
            this._dims = [w, h];
            this._cvsEl.setAttribute('width',  w);
            this._cvsEl.setAttribute('height', h);
            this._cvsEl.style.width = (w * this.scale) + 'px';
            this._cvsEl.style.height= (h * this.scale) + 'px';
        },

        _strokeHandler: function(tp, pos) {
            var gamePos = [
                Math.floor(pos[0] / this.scale) + this.scroll[0],
                Math.floor(pos[1] / this.scale) + this.scroll[1]
            ];

            if      (tp === 'm') { this.onStrokeMove( gamePos); }
            else if (tp === 'd') { this.onStrokeDown( gamePos); }
            else {                 this.onStrokeUp(   gamePos); }

            this.lastPos = pos;
            this.lastGamePos = gamePos;
        },

        _onMouse: function(ev) {
            ev.preventDefault();
            var tp = ev.type.substring(5).toLowerCase().charAt(0);
            if (tp !== 'm') { this._mouseIsDown = (tp === 'd'); }
            else if (!this._mouseIsDown) { return; }
            var pos = [ev.clientX, ev.clientY];
            //console.log(tp, pos.join(','));
            this._onStroke(tp, pos);
        },

        _onTouch: function(ev) {
            ev.preventDefault();
            var tp = ev.type.substring(5).toLowerCase().charAt(0);
            if      (tp === 's') { tp = 'd'; }
            else if (tp === 'e') { tp = 'u'; }
            ev = ev.changedTouches[0];
            var pos = [ev.clientX, ev.clientY];
            //console.log(tp, pos.join(','));
            this._onStroke(tp, pos);
        },

        _onKey: function(ev) {
            ev.stopPropagation();
            //console.log(ev.keyCode, ev.type === 'keydown' ? 'ON' : 'OFF');
            this.keys[ev.keyCode] = ev.type === 'keydown';
        }

    };



    /**
     * @class CS.Sprite
     *
     * states is a hash of stateName -> state
     * a state is an array of [data.index, time in milisseconds] or simply a index number (if no animation required)
     * data is an array of {pos, dims}, relating to sprites in the given image
     */

    /**
     * @constructor CS.Sprite
     *
     * @param {DOMImage} imageEl
     * @param {Array[]}  data
     * @param {Object[]} states
     */
    var Sprite = function(imageEl, data, states) {
        this.pos = [0, 0];

        this._imageEl   = imageEl;
        this._data      = data;
        this._states    = states;
        this._state     = undefined;
        this._lastLoopT = 0;
    };

    Sprite.prototype = {

        /**
         * @function ?
         * @param {String} stateName
         */
        setState: function(stateName) {
            this._lastLoopT = new Date().valueOf();
            this._state = this._states[stateName];
        },

        /**
         * @function ?
         * @param {CanvasContext2D}    ctx
         * @param {optional CS.Screen} scr
         */
        draw: function(ctx, scr) {
            // select frame index to use
            var sumT = 0;
            var loopT = new Date().valueOf() - this._lastLoopT;
            var idx = 0;

            if (typeof this._state === 'number') {
                idx = this._state;
            }
            else {
                var step, found = false;
                for (var i = 0, f = this._state.length; i < f; ++i) {
                    step = this._state[i];
                    sumT += step[1];
                    if (loopT < sumT) {
                        found = true;
                        idx = step[0];
                        break;
                    }
                }
                if (!found) {
                    this._lastLoopT = new Date().valueOf(); // TODO
                }
            }

            // draw frame
            var d = this._data[idx];
            ctx.drawImage(
                this._imageEl,              // image
                d.pos[0],    d.pos[1],      // sx, sy
                d.dims[0],   d.dims[1],     // sw, sh
                this.pos[0], this.pos[1],   // dx, dy
                d.dims[0],   d.dims[1]      // dw, dh
            );
        }

    };



    /**
     * @class CS.Drawing
     *
     * exposes drawing API
     */

    /**
     * @constructor CS.Drawing.?
     * @param {Object} o
     * @... {optional Number[2]} dims
     * @... {optional Number[2]} pos
     * @... {optional Boolean}   debug
     */
    var Drawing = function(o) {
        this.dims  = o.dims || [32, 32];
        this.pos   = o.pos  || [0, 0];
        this.debug = !!o.debug;

        this.el = document.createElement('canvas');
        this.el.setAttribute('width',  this.dims[0]);
        this.el.setAttribute('height', this.dims[1]);

        this.ctx = this.el.getContext('2d');
    };

    Drawing.prototype = {
        
        /**
         * @function ?
         * @param {CanvasContext2D}    ctx
         * @param {optional CS.Screen} scr
         */
        draw: function(ctx, scr) {
            if (this.debug) {
                ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)';
                ctx.strokeWidth = 0.5;
                ctx.strokeRect(-0.5, -0.5, this.dims[0] + 1, this.dims[1] + 1);
            }

            ctx.drawImage(this.el, 0, 0);
        },

        /**
         * @function ? single pixel paint
         * @param {Number[2]}        p   position
         * @param {Number[]}         rgb color. can have alpha
         * @param {optional Boolean} skp if trueish paint is part of bigger update
         */
        paint: function(p, rgb, skp) {
            if (!skp) { this._prePaint(); }
            var dt = this.dt;
            var i = this._p2i(p);
            dt.data[i++] = rgb[0];
            dt.data[i++] = rgb[1];
            dt.data[i++] = rgb[2];
            dt.data[i  ] = (typeof rgb[3] === 'number') ? rgb[3] : 255;
            if (!skp) { this._postPaint(); }
        },

        /**
         * @function ? single brush paint
         * @param {Number[2]}        p   position
         * @param {Number[]}         P   array of relative positions (brush)
         * @param {Number[]}         rgb color. can have alpha
         * @param {optional Boolean} skp if trueish paint is part of bigger update
         */
        paintMultiple: function(p, P, rgb, skp) {
            if (!skp) { this._prePaint(); }
            var x, y;
            for (var i = 0, f = P.length; i < f; ++i) {
                x = p[0] + P[i][0];
                y = p[1] + P[i][1];
                if (x < 0 || y < 0 || x >= this.dims[0] || y >= this.dims[1]) { continue; }
                this.paint([x, y], rgb, true);
            }
            if (!skp) { this._postPaint(); }
        },

        /**
         * @function ? fill color using floodfill
         * @param {Number[2]}        p   position
         * @param {Number[]}         tgtClr x
         * @param {Number[]}         rplClr x
         * @param {optional Boolean} skp if trueish paint is part of bigger update
         */
        floodfill: function(p, tgtClr, rplClr, skp) {
            // http://en.wikipedia.org/wiki/Flood_fill
            if (!skp) { this._prePaint(); }
            if (this.pick(p).toString() !== tgtClr.toString() || !this._isValidPos(p)) { return; }
            this.paint(p, rplClr, true);
            this.floodfill([p[0]-1, p[1]  ], tgtClr, rplClr, true);
            this.floodfill([p[0]+1, p[1]  ], tgtClr, rplClr, true);
            this.floodfill([p[0],   p[1]-1], tgtClr, rplClr, true);
            this.floodfill([p[0],   p[1]+1], tgtClr, rplClr, true);
            if (!skp) { this._postPaint(); }
        },

        /**
         * @function ? draw a line between a and b
         * @param {Number[2]}        a start position
         * @param {Number[2]}        b end position
         * @param {Number[]}         P   array of relative positions (brush)
         * @param {Number[]}         rgb color. can have alpha
         */
        line: function(a, b, P, rgb) {
            this._prePaint();
            var points = this._abstractLine(a, b);
            for (var i = 0, f = points.length; i < f; ++i) {
                this.paintMultiple(points[i], P, rgb, true);
            }
            this._postPaint();
        },

        /**
         * @function ? draw a circle centered on ctrP
         * @param {Number[2]}        ctrP center position
         * @param {Number[2]}        arcP radiuses
         * @param {Number[]}         P    array of relative positions (brush)
         * @param {Number[]}         rgb color. can have alpha
         */
        circle: function(ctrP, arcP, P, rgb) {
            var dx = ctrP[0] - arcP[0];
            var dy = ctrP[1] - arcP[1];
            var r = Math.round( Math.sqrt(dx*dx + dy*dy) );
            this._prePaint();
            var points = this._abstractCircle(ctrP, r);
            for (var i = 0, f = points.length; i < f; ++i) {
                this.paintMultiple(points[i], P, rgb, true);
            }
            this._postPaint();
        },

        /**
         * @function {Number[4]} ? returns color from position
         * @param {Number[2]} p position
         */
        pick: function(p) {
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
        },

        /**
         * @function {String} ? returns base64 string representing the image
         */
        getData: function() {
            return this.el.toDataURL('image/png');
        },

        /**
         * @function ? sets image from base64 string representation
         * @param {String} ? returns base64 string representing the image
         */
        setData: function(b64Data) {
            var imgEl = document.createElement('img');
            var that = this;
            imgEl.onload = function() {
                var dims = [imgEl.width, imgEl.height];
                that.resize(dims);
                that.ctx.drawImage(imgEl, 0, 0);
            };
            imgEl.src = b64Data;
        },

        /**
         * @function ? resizes the image
         * @param {Number[2]} dims
         */
        resize: function(dims) {
            //if (this.dims[0] === dims[0] && this.dims[1] === dims[1]) { return; }
            this.dims = dims;
            this.el.setAttribute('width',  dims[0]);
            this.el.setAttribute('height', dims[1]);
            this.ctx = this.el.getContext('2d');
        },



        /***************
         * PRIVATE API *
         ***************/

        _prePaint: function() {
            this.dt = this.ctx.getImageData(0, 0, this.dims[0], this.dims[1]);
        },

        _postPaint: function() {
            this.ctx.putImageData(this.dt, 0, 0);
        },

        _isValidPos: function(p) {
            return (p[0] >= 0 && p[1] >= 0 && p[0] < this.dims[0] && p[1] < this.dims[1]);
        },

        _p2i: function(p) {
            return (p[1] * this.dims[0] + p[0]) * 4;
        },

        _plot4: function(ctrP, x, y, points) {
            points.push([ctrP[0] + x, ctrP[1] + y]);
            if (x !== 0) {            points.push([ctrP[0] - x, ctrP[1] + y]); }
            if (y !== 0) {            points.push([ctrP[0] + x, ctrP[1] - y]); }
            if (x !== 0 && y !== 0) { points.push([ctrP[0] - x, ctrP[1] - y]); }
        },

        _plot8: function(ctrP, x, y, points) {
            this._plot4(ctrP, x, y, points);
            if (x === y) { return; }
            this._plot4(ctrP, y, x, points);
        },

        _abstractCircle: function(centerP, r) {
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
        },

        _abstractLine: function(a, b) {
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
        }

    };



    var _comb2Cache = {};
    var _comb2DCache = {};

    /**
     * @function ? combinations from same array
     * @param {Number} n
     */
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



    /**
     * @function ? combinations from disjoint arrays
     * @param {Number} n
     * @param {Number} N
     */
    var comb2D = function(n, N) {
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



    // export API
    window.CS = {
        comb2:    comb2,
        comb2D:   comb2D,

        Sprite:   Sprite,
        Screen:   Screen,
        Drawing:  Drawing
    };
    window.s$ = s$;
    
})();
