var st = require('./stage-core');

new st({
    port:                   9000,
    rootDir:                __dirname + '/bots',
    fps:                    30,
    botsRunEveryNFrames:    60
});
