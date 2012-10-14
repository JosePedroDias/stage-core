/*jshint browser:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:false, evil:true, smarttabs:true */
/*global eio:false, prompt:false, alert:false, console:false */



(function() {

    'use strict';

    var stage = window.stage;



    var console = {

        _consoleEl: undefined,

        _numLines: 0,

        _maxLines: 10,

        _isHidden: true,

        _createOrGet: function() {
            if (this._consoleEl) {
                return this._consoleEl;
            }

            var consoleEl = document.createElement('div');
            consoleEl.id = 'console';

            var titleEl = document.createElement('div');
            titleEl.innerHTML = 'console';
            titleEl.className = 'title';
            consoleEl.appendChild(titleEl);

            var linesEl = document.createElement('div');
            linesEl.className = 'lines';
            consoleEl.appendChild(linesEl);
            this._linesEl = linesEl;

            var promptEl = document.createElement('div');
            promptEl.innerHTML = '&gt;';
            promptEl.className = 'prompt';
            consoleEl.appendChild(promptEl);

            var inputEl = document.createElement('input');
            inputEl.setAttribute('type', 'text');
            consoleEl.appendChild(inputEl);
            this._inputEl = inputEl;

            document.body.appendChild(consoleEl);

            this._consoleEl = consoleEl;

            titleEl.addEventListener('click', function(ev) {
                window.stage.console.toggle();
            });

            var that = this;
            inputEl.addEventListener('keydown', function(ev) {
                var kc = ev.keyCode;
                if (kc === 27) {
                    ev.preventDefault();
                    return that.hide();
                }
                else if (kc !== 13) { return; }
                var v = that._inputEl.value;
                that.writeLine(v);
                that._inputEl.value = '';
                ev.preventDefault();
            });

            return consoleEl;
        },

        toggle: function() {
            if (this._isHidden) { this.show(); }
            else {                this.hide(); }
        },

        show: function() {
            this._createOrGet();
            this._consoleEl.style.bottom = 0;
            this._inputEl.focus();
            this._isHidden = false;
        },

        hide: function() {
            this._createOrGet();
            this._consoleEl.style.bottom = '-100px';
            this._isHidden = true;
        },

        writeLine: function(line) {
            if (this._numLines >= this._maxLines) {
                this._linesEl.removeChild( document.querySelector('p', this._linesEl) );
            }
            var pEl = document.createElement('p');
            pEl.innerHTML = line;
            this._linesEl.appendChild(pEl);
            this._linesEl.scrollTop = this._linesEl.scrollHeight;
        },

        destroy: function() {
            var consoleEl = this._consoleEl;
            if (!consoleEl) { return; }
            consoleEl.parentNode.removeChild(consoleEl);
        }

    };

    stage.console = console;

})();