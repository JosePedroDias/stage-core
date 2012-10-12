(function() {
    
    'use strict';

    /*jshint node:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, evil:true, smarttabs:true */
    /*global */


    var clone = function(o) {
        return JSON.parse( JSON.stringify(o) );
    };


    /* supports alternate init with JSON object */
    var DiscreteMap = function(w, h, data, wrap) {
        var o;
        if (typeof w === 'object') {
            o = w;
            this._init(o.dims[0], o.dims[1], o.data);
            return;
        }

        this._wrap = !!wrap;
        this._init(w, h, data);
    };

    DiscreteMap.prototype = {
        _init: function(w, h, data) {
            if (w < 1) { throw 'w must be at least 1'; }
            if (h < 1) { throw 'h must be at least 1'; }
            this._w = w;
            this._h = h;
            this._l = w * h;
            if (!!data) { this._setArray(data);         }
            else {        this._d = new Array(this._l); }
        },

        _getIndex: function(x, y) { // TODO: wrap modes - return null or wrap around
            if (this._wrap) {
                x = x < 0 ? x + this._w : x % this._w;
                y = y < 0 ? y + this._h : y % this._h;
            }
            else {
                if (x < 0 || x >= this._w) {    throw 'x argument out of bounds';   }
                if (y < 0 || y >= this._h) {    throw 'y argument out of bounds';   }
            }
            return y * this._w + x;
        },

        _getArray: function() {
            return this._d.slice(0);
        },

        _setArray: function(arr) {
            if (arr.length !== this._l) {   throw 'given array has wrong dimensions (array has ' + arr.length + ' elements, expected ' + this._l +')!'; }
            this._d = arr;
        },

        wrapPosition: function(x, y) {
            return [
                x < 0 ? x + this._w : x % this._w,
                y < 0 ? y + this._h : y % this._h
            ];
        },

        getCell: function(x, y) {
            return this._d[ this._getIndex(x, y) ];
        },

        setCell: function(x, y, o) {
            this._d[ this._getIndex(x, y) ] = o;
        },

        fill: function(o) {
            for (var i = 0, f = this._l; i < f; i++) {
                this._d[i] = clone(o);
            }
        },

        clone: function() {
            return new Map( this.toJSON() );
        },

        toString: function(spaced) {
            var res = [];
            for (var i = 0; i < this._l; ++i) {
                if (i !== 0 && i % this._w === 0) { res.push('\n');  }
                res.push( this._d[i] );
            }
            return res.join(spaced ? ' ' : '');
        },

        toJSON: function() {
            return {dims:[this._w, this._h], data:this._d.slice(0)};
        }
    };



    /**
     * referential is x right, y down
     * dirs: 0 (right), 1 (bottom), 2 (left), 3 (up)
     * multiply by 90 to obtain degrees...
     */
    var DirOps = {
        dir2vec: function(dir) {
            switch (dir) {
                case 0: return [ 1,  0];
                case 1: return [ 0,  1];
                case 2: return [-1,  0];
                case 3: return [ 0, -1];
                default:    throw 'unsupported dir';
            }
        },

        vec2dir: function(vec) {    // does not validate vector
            if (vec[1] === 0) {
                return vec[0] === 1 ? 0 : 2;    // no Y. right or left
            }
            else {
                return vec[1] === 1 ? 1 : 3;    // no X. down or up
            }
        },

        turn: function(dir, isNeg) {
            if (isNeg) {
                if (dir === 0) { return 3; }
                return --dir;
            }
            if (dir === 3) { return 0; }
            return ++dir;
        }
    };



    exports.DiscreteMap = DiscreteMap;
    exports.DirOps      = DirOps;

})();