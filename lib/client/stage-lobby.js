/*jshint browser:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:false, evil:true, smarttabs:true */
/*global eio:false, prompt:false, alert:false, console:false */



(function() {

    'use strict';

    var stage = window.stage;



    var lobby = {

        _lobbyEl: undefined,

        _createOrGet: function() {
            if (this._lobbyEl) {
                return this._lobbyEl;
            }

            var lobbyEl = document.createElement('div');

            lobbyEl.id = 'lobby';

            document.body.appendChild(lobbyEl);

            this._lobbyEl = lobbyEl;

            return lobbyEl;
        },

        _updateSessionFromForm: function() {
            var field;
            for (var i = 0, f = this._formFields.length; i < f; ++i) {
                field = this._formFields[i];

                window.stage._session[field.name] = document.getElementById(field.name).value;
            }
        },

        generateForm: function(formFields, onGameStarting) {
            var lobbyEl = this._createOrGet();

            this._formFields = formFields;

            var field, pEl, labelEl, fieldEl;
            for (var i = 0, f = formFields.length; i < f; ++i) {
                field = formFields[i];

                labelEl = document.createElement('label');
                labelEl.innerHTML = field.label ? field.label : field.name;

                switch (field.kind) {
                    case 'textarea':
                        fieldEl = document.createElement('textarea');
                        fieldEl.value = field.value || '';
                        break;

                    case 'text':
                        /* falls through */
                    default:
                        fieldEl = document.createElement('input');
                        fieldEl.setAttribute('type', 'text');
                        fieldEl.value = field.value || '';
                }
                fieldEl.id = field.name;

                pEl = document.createElement('p');
                pEl.appendChild(labelEl);
                pEl.appendChild(fieldEl);
                lobbyEl.appendChild(pEl);
            }

            pEl = document.createElement('p');
            var buttonEl = document.createElement('button');
            buttonEl.innerHTML = 'submit';
            pEl.appendChild(buttonEl);
            buttonEl.addEventListener('click', function() {
                window.stage.lobby._updateSessionFromForm();
                console.log( window.stage._session );
                window.stage.lobby.destroy();

                // TODO ?
                window.stage.logIn(stage._session, onGameStarting);
            });
            lobbyEl.appendChild(pEl);
        },

        destroy: function() {
            var lobbyEl = this._lobbyEl;
            if (!lobbyEl) { return; }
            lobbyEl.parentNode.removeChild(lobbyEl);
        }

    };



    stage.lobby = lobby;

})();