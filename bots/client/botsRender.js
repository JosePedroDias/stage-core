(function() {
    
    'use strict';
    
    /*jshint browser:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, smarttabs:true */
    /*global stage:false, console:false, alert:false, CS:false */

    var PI2     = Math.PI * 2,
        RAD2DEG = 180 / Math.PI,
        DEG2RAD = Math.PI / 180;



    var scr = CS.createScreen({
        scale:      1,
        resize:     true,
        handleKeys: true
    });

    scr.update = function() {
        //var dt = this.dt / 1000;
        var dt = 1/30;
        //console.log(dt);
        var sh;
        for (var i = 0, f = this.shapes.length; i < f; ++i) {
            sh = this.shapes[i];
            sh.pos = [
                sh.pos[0] + sh.speed * dt * Math.cos(sh.angle * DEG2RAD),
                sh.pos[1] + sh.speed * dt * Math.sin(sh.angle * DEG2RAD)
            ];
        }
    };

    var botDraw = function(ctx, scr) {
        ctx.save();
            ctx.translate(this.pos[0], this.pos[1]);

            ctx.fillStyle   = this.color;
            ctx.strokeStyle = '#000';

            ctx.beginPath();
            ctx.arc(0, 0, this.dims[0]/2, 0, PI2);   // ctx.arc(x, y, r, startAng, endAng, isCCW)
            ctx.fill();

            ctx.beginPath();
            ctx.arc(0, 0, this.dims[0]/2, 0, PI2);   // ctx.arc(x, y, r, startAng, endAng, isCCW)
            ctx.stroke();

            ctx.save();
                ctx.rotate(this.angle * DEG2RAD);

                ctx.fillRect(-4, -4, 30, 8);

                ctx.strokeRect(-4, -4, 30, 8);
            ctx.restore();

            // hud
            ctx.globalAlpha = 0.5;
            //ctx.font = '16px uni';
            ctx.font = '8px Silkscreen';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#000';
            ctx.fillText(this.name, 0, 36);

            var w = 50;
            ctx.fillStyle = '#0A0';
            ctx.fillRect(-25, 40, 50 * this.energy, 10);

            ctx.strokeRect(-25, 40, 50, 10);
            ctx.globalAlpha = 1;
        ctx.restore();
    };

    scr.shapes.push({
        draw:   botDraw,
        dims:   [40, 40],

        pos:    [80, 50],
        color:  '#F77',
        angle:  90,
        speed:  5,
        energy: 1,
        name:   'drone'
    });

    scr.shapes.push({
        draw:   botDraw,
        dims:   [40, 40],

        pos:    [180, 80],
        color:  '#7F7',
        angle:  45,
        speed:  20,
        energy: 0.75,
        name:   'mayhem'
    });

    document.body.appendChild(scr.el);



    window.scr = scr;   // make scr available

})();
