/*jshint browser:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, smarttabs:true */
/*global AU:false, prompt:false, alert:false, console:false */

(function() {
	
	'use strict';

	/**
	 * container
	 * tempo
	 * steps
	 * tracks
	 */
	var genDrumMachine = function(o) {
		var res = {};

		res.ctnEl = document.getElementById(o.container);
		res.tempo = o.tempo || 120;
		res.steps = o.steps || 16;
		res.tracks = o.tracks;
		res.currentStep = -1;

		var i, f;

		if (!('grid' in o)) {
			res.grid = new Array(res.tracks.length);
			for (i = 0, f = res.tracks.length; i < f; ++i) {
				res.grid[i] = new Array(res.steps);
			}
		}
		else {
			res.grid = o.grid;
		}

		var tpl = [
			'<div class="drumMachine">',
			'</div>',
			'',
			'<div class="drumMachineControls">',
				'<button id="playStopBtn"></button>',
				'<label for="tempoIn">BPM:</label>',
				'<input type="text" id="tempoIn" value="', res.tempo, '" />',
			'</div>'
		].join('');

		res.ctnEl.innerHTML = tpl;
		res.dmEl = document.getElementsByClassName('drumMachine')[0];
		res.dmcEl = document.getElementsByClassName('drumMachineControls')[0];
		res.tempoInEl = document.getElementById('tempoIn');

		res.addTrack = function(o, idx) {
			var trackEl = document.createElement('div');
			trackEl.className = 'track';
			var el = document.createElement('label');
			el.innerHTML = o.name;
			trackEl.appendChild(el);
			for (var i = 0, f = this.steps; i < f; ++i) {
				el = document.createElement('button');
				el.setAttribute('data-index', i);
				trackEl.appendChild(el);
			}
			trackEl.setAttribute('data-index', typeof i === 'number' ? idx : res.tracks.length);
			res.dmEl.appendChild(trackEl);
		};

		res.getGrid = function() {
			return this.grid;
		};

		res.setGrid = function(grid) {
			this.grid = grid;
			var i, f, trackEl, btnEl;
			for (var t = 0, tf = this.tracks.length; t < tf; ++t) {
				trackEl = this.dmEl.getElementsByTagName('div')[t];
				for (i = 0, f = this.steps; i < f; ++i) {
					btnEl = trackEl.getElementsByTagName('button')[i];
					btnEl.className = this.grid[t][i] ? 'selected' : '';
				}
			}
		};

		res.onTimer = function() {
			var i = this.currentStep;
			if (i > -1) {	this.ledsEls[i].className = '';	}
			++i;
			if (i === this.steps) {	i = 0;	}
			this.ledsEls[i].className = 'current';

			for (var t = 0, tf = this.tracks.length; t < tf; ++t) {
				if (this.grid[t][i]) {
					//this.samples[t].hit();
					AU.playSample( this.tracks[i].uri );
				}
			}

			this.currentStep = i;
		};

		res.samples = new Array(res.tracks.length);
		for (i = 0, f = res.tracks.length; i < f; ++i) {
			res.addTrack(res.tracks[i], i);
			AU.loadSample(o.tracks[i].uri, o.tracks[i].uri);
		}

		res.setGrid(res.grid);

		res.ledsCtnEl = document.createElement('div');
		res.ledsCtnEl.className = 'ledsCtn';
		res.ledsEls = new Array(res.steps);
		var el;
		for (i = 0, f = res.steps; i < f; ++i) {
			el = document.createElement('div');
			res.ledsCtnEl.appendChild(el);
			res.ledsEls[i] = el;
		}
		res.dmEl.appendChild(res.ledsCtnEl);

		res.dmEl.addEventListener('click', function(ev) {
			ev.preventDefault();
			var btnEl = ev.target;
			var track;
			if (btnEl.nodeName.toLowerCase() === 'label') {
				track	= parseInt(	btnEl.parentNode.getAttribute('data-index'),	10);
				this.editTrack(track);
			}
			if (btnEl.nodeName.toLowerCase() !== 'button') {	return;	}
			var selected = !btnEl.className;
			btnEl.className = selected ? 'selected' : '';
			track	= parseInt(	btnEl.parentNode.getAttribute('data-index'),	10);
			var step	= parseInt(	btnEl.getAttribute('data-index'),				10);
			this.grid[track][step] = selected;
		}.bind(res));

		res.editTrack = function(trackIdx) {
			var trackObj = this.tracks[trackIdx];
			var name = prompt('Name?', trackObj.name);
			var uri  = prompt('URI?',  trackObj.uri);
			this.dmEl.getElementsByTagName('label')[trackIdx].innerHTML = name;
			trackObj.name = name;
			if (uri !== this.samples[trackIdx]._src) {
				this.samples[trackIdx] = AU.loadAudio(uri);
				trackObj.uri = uri;
			}
		};

		res['import'] = function(o) {
			o = JSON.parse(o);
			o.container = this.ctnEl.id;
			genDrumMachine(o);
		};

		res['export'] = function() {
			var o = JSON.stringify({
				tempo:	this.tempo,
				tracks:	this.tracks,
				grid:	this.grid
			});
			console.log(o);
		};

		res.dmEl.addEventListener('mouseover', function(ev) {
			ev.preventDefault();
			var btnEl = ev.target;
			if (btnEl.nodeName.toLowerCase() !== 'label') {	return;	}
			var i = parseInt(	btnEl.parentNode.getAttribute('data-index'),	10);
			AU.playSample( this.tracks[i].uri );
		}.bind(res));

		document.getElementById('playStopBtn').addEventListener('click', function(ev) {
			ev.preventDefault();
			var btnEl = ev.target;
			var selected = !btnEl.className;
			btnEl.className = selected ? 'running' : '';
			this.isRunning = selected;

			if (this.isRunning) {
				this.onTimer();
				this.timer = setInterval(this.onTimer.bind(this), 60000/this.tempo);
			}
			else {
				clearInterval(this.timer);
			}
		}.bind(res));

		document.getElementById('tempoIn').addEventListener('change', function(ev) {
			var t = parseInt(this.tempoInEl.value, 10);
			if (isNaN(t)) {	return alert('Invalid tempo!');	}
			this.tempo = t;
			if (this.isRunning) {
				clearInterval(this.timer);
				this.timer = setInterval(this.onTimer.bind(this), 60000/this.tempo);
			}
		}.bind(res));

		return res;
	};

	window.genDrumMachine = genDrumMachine;
	
})();


