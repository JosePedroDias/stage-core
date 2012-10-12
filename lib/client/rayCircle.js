/**
 * @function {Number[2]|undefined} ?
 * @param {Number[2]} L0 - starting point of the ray
 * @param {Number[2]} L1 - end      point of the ray
 * @param {Number[2]} C  - center of the circle
 * @param {Number}    r  - radius of the circle
 *
 * http://uxebu.com/blog/2012/10/11/when-worlds-collide/
 * http://stackoverflow.com/questions/1073336/circle-line-collision-detection
 */
var rayCircleIntersection = function(L0, L1, C, r) {
    var dx = L1[0]-L0[0]; // direction vector of ray, from start to end
    var dy = L1[1]-L0[1];
    var fx = L0[0]- C[0]; // vector from center of circle to ray start
    var fy = L0[1]- C[1];

    var a = dx*dx + dy*dy;
    var b = 2 * (fx*dx + fy*dy);
    var c = (fx*fx + fy*fy) - (r*r);
    var discriminant = (b*b) - (4*a*c);

    // if discriminant <= 0, there are no intersections
    if (discriminant <= 0) { return; }

    // get t1 and t2 to determine where on ray the collisions occur
    discriminant = Math.sqrt(discriminant);
    var t1 = (-b + discriminant) / (2*a);
    var t2 = (-b - discriminant) / (2*a);

    // start is L0, end is L1, check if either t is on L0-L1
    if ((t1 < 0 || t1 > 1) && (t2 < 0 || t2 > 1)) { return; }

    // nearest collision to A?
    var t = t1 < t2 && t1 > 0 ? t1 : t2 > 0 ? t2 : t1;

    return [
        L0[0] + (dx*t),
        L0[1] + (dy*t)
    ];
};
