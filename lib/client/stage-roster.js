/*jshint browser:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:false, evil:true, smarttabs:true */
/*global eio:false, prompt:false, alert:false, console:false */



(function() {

    'use strict';

    var stage = window.stage;



    var roster = {

        _rosterEl: undefined,

        _isHidden: true,

        _createOrGet: function() {
            if (this._rosterEl) {
                return this._rosterEl;
            }

            var rosterEl = document.createElement('div');
            rosterEl.id = 'roster';

            var titleEl = document.createElement('div');
            titleEl.innerHTML = 'roster';
            titleEl.className = 'title';
            rosterEl.appendChild(titleEl);

            var linesEl = document.createElement('div');
            linesEl.className = 'lines';
            rosterEl.appendChild(linesEl);
            this._linesEl = linesEl;

            document.body.appendChild(rosterEl);

            this._rosterEl = rosterEl;

            titleEl.addEventListener('click', function(ev) {
                window.stage.roster.toggle();
            });

            return rosterEl;
        },

        toggle: function() {
            if (this._isHidden) { this.show(); }
            else {                this.hide(); }
        },

        show: function() {
            this._createOrGet();
            this._rosterEl.style.right = 0;
            this._isHidden = false;
        },

        hide: function() {
            this._createOrGet();
            this._rosterEl.style.right = '-200px';
            this._isHidden = true;
        },

        update: function(o) {
            this._linesEl.innerHTML = [
                '<b>ready:</b>',
                '<blockquote>',
                    '<div>toni</div>',
                    '<div>fonfonso</div>',
                '</blockquote>',
                '<b>waiting:</b>',
                '<blockquote>',
                    '<div>toni</div>',
                    '<div>fonfonso</div>',
                '</blockquote>'
            ].join('');
        },

        destroy: function() {
            var rosterEl = this._rosterEl;
            if (!rosterEl) { return; }
            rosterEl.parentNode.removeChild(rosterEl);
        }

    };

    stage.roster = roster;

})();