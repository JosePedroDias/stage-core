var st = require('./stage-core');


new st('snake', {
    port:     9000,
    rootDir:  __dirname + '/snake',
    fps:      20
});
