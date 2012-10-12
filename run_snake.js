var st = require('./stage-core');

new st({
    port:     9000,
    rootDir:  __dirname + '/snake',
    fps:      20,

    mapDims:        [60, 40],
    pixelMult:      12,
    increaseEveryN: 5,
    startLength:    4
});
