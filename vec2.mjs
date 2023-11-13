
/**
 * 
 * @param {Number} v1 
 * @param {Number} v2 
 * @param {Number} t 
 * @returns {Number}
 */
export function interpolate(v1, v2, t) {
    return v1 + (v2 - v1) * t
}

/**
 * 
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
 * 
 * @param {Number} x 
 * @param {Number} y 
 * @returns {vec2}
 */
export function vec2(x = 0, y = 0) {
    return { x, y }
}

/**
 * 
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
 * 
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
 * 
 * @param {vec2} v1 
 * @param {vec2} v2 
 * @returns {Number}
 */
export function vec2dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y 
}

/**
 * 
 * @param {vec2} v1 
 * @returns {vec2}
 */
export function vec2normal(v1) {
    let len = Math.hypot(v1.x, v1.y)
    return {
        x: v1.x / len,
        y: v1.y / len
    }
}

/**
 * 
 * @param {vec2} v1 
 * @param {vec2} v2 
 * @returns {Number}
 */
export function vec2distance(v1, v2) {
    return Math.hypot((v2.x - v1.x), (v2.y - v1.y))
}
/**
 * 
 * @param {vec2} v1 
 * @param {vec2} v2 
 * @returns {Number}
 */
export function vec2squareDistance(v1, v2) {
    return (v2.x - v1.x) ** 2 + (v2.y - v1.y) ** 2
}

/**
 * 
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
 * 
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