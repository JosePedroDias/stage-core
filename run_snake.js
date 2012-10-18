var st = require('./stage-core');

new st({
    port:     9000,
    rootDir:  __dirname + '/snake',
    fps:      15,

    mapDims:        [60, 40],
    pixelMult:      12,
    increaseEveryN: 10,
    startLength:    4
});
