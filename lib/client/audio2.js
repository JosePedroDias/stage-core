/*jshint browser:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, smarttabs:true */
/*global alert:false, console:false */


// https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html


(function() {

    'use strict';

    var ctx;

    try {
        ctx = new webkitAudioContext();
    } catch (e) {
        alert('web audio not supported!');
    }

    var buffers = {};

    var onError = function(e) {
        alert(e);
    };

    var loadSample = function(url, name, reverseIt) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';

        // decode asynchronously
        request.onload = function() {
            ctx.decodeAudioData(request.response, function(buffer) {

                if (reverseIt) {
                    for (var i = 0; i < buffer.numberOfChannels; ++i) {
                        Array.prototype.reverse.call( buffer.getChannelData(i) );
                    }
                }

                buffers[name] = buffer;
                console.log('Loaded audio ' + url + ' with ' + buffer.duration.toFixed(1) + 's as ' + name);
            }, onError);
        };
        request.send();
    };

    var loadSamples = function(urls, suffix, reverseThem) {
        if (!suffix) { suffix = ''; }
        var url, name, a;
        for (var i = 0, f = urls.length; i < f; ++i) {
            url = urls[i];
            a = url.split('/');
            a = a[a.length - 1];
            name = a.substring(0, a.indexOf('.')) + suffix;
            loadSample(url, name, reverseThem);
        }
    };

    var playSample = function(name, loop) {
        var buffer = buffers[name];
        if (!buffer) { /*console.log('X ' + name);*/ return; }

        var source = ctx.createBufferSource();
        source.buffer = buffer;
        //source.playbackRate = buffer.sampleRate/4;
        if (loop) {
            source.loop = true;
        }
        source.connect(ctx.destination);
        source.noteOn(0);
        //console.log('* ' + name);

        return {
            stop: function() {
                source.noteOff(0);
            }
        };
    };

    var getSampleNames = function() {
        return Object.keys(buffers);
    };

    var getSampleDuration = function(name) {
        var buffer = buffers[name];
        if (buffer) {
            return buffer.duration;
        }
    };


    window.AU = {
        loadSample:        loadSample,
        loadSamples:       loadSamples,
        playSample:        playSample,
        getSampleNames:    getSampleNames,
        getSampleDuration: getSampleDuration
    };

})();
