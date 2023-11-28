
/**
 * Linear interpolation between two values v1 and v2 using a third value t. When t is 0, it returns v1, when t is 1, it returns v2, and for other t, it returns a value proportionally in between.
 * @param {Number} v1 
 * @param {Number} v2 
 * @param {Number} t 
 * @returns {Number}
 */
export function interpolate(v1, v2, t) {
    return v1 + (v2 - v1) * t
}

/**
 * It calculates the value at the point t on a quadratic bézier curve defined by three points v1, v2, and p3.
 * @param {Number} v1 
 * @param {Number} v2 
 * @param {Number} p3 
 * @param {Number} t 
 * @returns {Number}
 */
export function quadraticBezier(v1, v2, p3, t) {
    return t * (t * (p3 - v2 * 2 + v1) + 2 * (v2 - v1)) + v1
};

/** @typedef {{x: Number, y: Number}} vec2 */

/**
 * Generates an object representing a 2D vector with x and y coordinates.
 * @param {Number} x 
 * @param {Number} y 
 * @returns {vec2}
 */
export function vec2(x = 0, y = 0) {
    return { x, y }
}

/**
 * Sets the x and y coordinates of the vector to the specified values.
 * @param {vec2} v - The vector to modify.
 * @param {Number} x - The new x-coordinate.
 * @param {Number} y - The new y-coordinate.
 */
export function vec2set(v, x, y) {
    v.x = x;
    v.y = y;
}

/**
 * Sets the x and y coordinates of the target vector to the values of the source vector.
 * @param {vec2} target - The vector to modify.
 * @param {vec2} source - The vector from which to copy the values.
 */
export function vec2setvec2(target, source) {
    target.x = source.x;
    target.y = source.y;
}

/**
 * Subtracts v2 from v1 and returns the result as a new 2D vector.
 * @param {vec2} v1 
 * @param {vec2} v2 
 * @returns {vec2}
 */
export function vec2sub(v1, v2) {
    return {
        x: v1.x - v2.x,
        y: v1.y - v2.y
    }
}

/**
 * Adds v2 to v1 and returns the result as a new 2D vector.
 * @param {vec2} v1 
 * @param {vec2} v2 
 * @returns {vec2}
 */
export function vec2add(v1, v2) {
    return {
        x: v1.x + v2.x,
        y: v1.y + v2.y
    }
}

/**
 * Multiplies vector `v` by scalar `s`. 
 * @param {vec2} v 
 * @param {Number} s 
 * @returns {vec2}
 */
export function vec2scale(v, s){
    return vec2(v.x * s, v.y * s);
}

/**
 * Calculates the dot product of v1 and v2. The dot product is a value expressing the angular relationship between two vectors.
 * @param {vec2} v1 
 * @param {vec2} v2 
 * @returns {Number}
 */
export function vec2dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y 
}

/**
 * Computes the cross product of v1 and v2.
 * @param {vec2} v1 
 * @param {vec2} v2 
 * @returns {Number} - The scalar denoting the signed area spanned by v1 and v2.
 */
export function vec2cross(v1, v2) {
    return v1.x * v2.y - v1.y * v2.x;
}

/**
 * Normalizes v1, i.e., converts the vector to a unit vector (a vector of length 1) pointing in the same direction.
 * @param {vec2} v1 
 * @returns {vec2}
 */
export function vec2normal(v) {
    if (v.x === 0 && v.y === 0) {
        return vec2()
    }
    let len = Math.hypot(v.x, v.y)
    return {
        x: v.x / len,
        y: v.y / len
    }
}

/**
 * Reflects vector v off the surface with the given normal.
 * @param {vec2} v 
 * @param {vec2} normal 
 * @returns {vec2}
 */
export function vec2reflect(v, normal) {
    let dot = dotProduct(v, normal);
    let reflection = vec2(
        v.x - 2 * dot * normal.x,
        v.y - 2 * dot * normal.y
    );
    return reflection;
}

/**
 * Computes the perpendicular vector to v.
 * @param {vec2} v 
 * @returns {vec2}
 */
export function vec2perpendicular(v) {
    return vec2(-v.y, v.x);
}

/**
 * Rotates vector `v` by angle `a` (in radians). 
 * @param {vec2} v 
 * @param {Number} a 
 * @returns {vec2}
 */
export function vec2rotate(v, a){
    var ca = Math.cos(a);
    var sa = Math.sin(a);
    return vec2(ca*v.x - sa*v.y, sa*v.x + ca*v.y);
}

/**
 * Computes the Euclidean distance between v1 and v2.
 * @param {vec2} v1 
 * @param {vec2} v2 
 * @returns {Number}
 */
export function vec2distance(v1, v2) {
    return Math.hypot((v2.x - v1.x), (v2.y - v1.y))
}

/**
 * Computes the squared Euclidean distance between v1 and v2. This is faster to calculate and can be used in place of vec2distance if you're comparing distances but don't need the exact values.
 * @param {vec2} v1 
 * @param {vec2} v2 
 * @returns {Number}
 */
export function vec2squareDistance(v1, v2) {
    return (v2.x - v1.x) ** 2 + (v2.y - v1.y) ** 2
}

/**
 * Applies the function interpolate on both the x and y values of v1 and v2.
 * @param {vec2} v1 
 * @param {vec2} v2 
 * @param {Number} t 
 * @returns {vec2}
 */
export function vec2interpolate(v1, v2, t) {
    return {
        x: interpolate(v1.x, v2.x, t),
        y: interpolate(v1.y, v2.y, t)
    }
}

/**
 * Applies the function quadraticBezier on both the x and y values of v1, v2, and p3.
 * @param {vec2} v1 
 * @param {vec2} v2 
 * @param {vec2} p3 
 * @param {Number} t 
 * @returns {vec2}
 */
export function vec2quadraticBezier(v1, v2, p3, t) {
    return {
        x: quadraticBezier(v1.x, v2.x, p3.x, t),
        y: quadraticBezier(v1.y, v2.y, p3.y, t)
    }
}