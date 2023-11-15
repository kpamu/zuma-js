import {
    vec2,
    vec2interpolate,
    vec2distance,
    vec2squareDistance,
    vec2sub,
    vec2dot,
    vec2quadraticBezier
} from './vec2.mjs'

/**
 * @enum {string}
 */
export var BallColor = {
    RED: 'red',
    BLUE: 'blue',
    GREEN: 'green',
};
BallColor.values = Object.values(BallColor);
BallColor.getRandomColor = function() {
    const randomIndex = Math.floor(Math.random() * this.values.length);
    return this.values[randomIndex];
};
export const DEFAULT_RADIUS = 20

/**
 * @typedef {{positionOnLine: Number, radius: Number, color: BallColor, pos?: vec2}} Ball
 * @typedef {Ball & {flyDirection: vec2, speed: number, pos: vec2}} FlyingBall
 */

export class Zuma {

    /** @type {[{x: Number, y: Number}]} */
    brokenLine = []
    /** @type {[Ball]} */
    balls = []

    /**
     * 
     * @param {[vec2]} points 
     * @param {[Ball]} circles 
     * @returns {[{{needOffset: Number, circle: Ball, pos: vec2}}]}
     */
    zumaAlgorithm(points, circles) {
        let result = []

        let circleIndex = 0
        let pointIndex = 1
        
        let lastResult = null
        let line = [null, points[0]]
        
        let sumLength = 0
        let lineLength = 0
        while (pointIndex < points.length && circleIndex < circles.length) {
            let circle = circles[circleIndex]
            let point = points[pointIndex]

            if (lastResult === null && circle.positionOnLine < 0) {
                circleIndex += 1
                continue
            }

            line = [line[1], point]
            lineLength = vec2distance(line[0], line[1]);

            let potentialPoint = null
            let needOffset = 0

            if (lineLength && sumLength + lineLength > circle.positionOnLine) {
                potentialPoint = vec2interpolate(line[0], line[1], (circle.positionOnLine - sumLength) / lineLength)

                if (lastResult) {
                    let len1sq = (circle.radius + lastResult.circle.radius) ** 2

                    let potentialPointIsCorrect = true
                        && lastResult.circle.positionOnLine + lastResult.needOffset < circle.positionOnLine
                        && vec2squareDistance(lastResult.pos, potentialPoint) > len1sq
        
                    if (!potentialPointIsCorrect) {
                        potentialPoint = null
                    }

                    if (!potentialPointIsCorrect && vec2squareDistance(lastResult.pos, line[1]) > len1sq) {
                        let b = vec2sub(line[1], line[0])
                        let c = vec2sub(lastResult.pos, line[0])
                        let projRoot = vec2dot(c, b) / (lineLength * lineLength)
                        let proj = vec2interpolate(line[0], line[1], projRoot)
                        
                        let len0sq = vec2squareDistance(lastResult.pos, proj)
                        let len2 = Math.sqrt(Math.abs(len1sq - len0sq))
                        
                        let resultPointRoot = projRoot + (len2 / lineLength)
                        potentialPoint = vec2interpolate(line[0], line[1], resultPointRoot)
                        needOffset = sumLength + lineLength * resultPointRoot - circle.positionOnLine
                    }
                }
            }

            if (potentialPoint) {
                result[circleIndex] = {circle: circle, pos: potentialPoint, needOffset: needOffset}
                lastResult = result[circleIndex]
                circleIndex += 1
                line = [line[1], line[0]]
            } else {
                sumLength += lineLength
                pointIndex += 1
            }
        }

        return result
    }

}

/**
 * 
 * @param {vec2} points 
 * @returns 
 */
export function quadraticBezierConverter(points) {
    let curves = []
    let t = 0.5
    points.forEach((p, i) => {
        let first = points[Math.max(0, i - 1)]
        let second = p
        let third = points[Math.min(points.length - 1, i + 1)]
        curves.push([
            vec2interpolate(first, second, t),
            second,
            vec2interpolate(second, third, t)
        ])
    })
    
    let result = [];
    let quality = 1;

    curves.forEach( curve => {
        let sumlen = vec2distance(curve[0], curve[1]) + vec2distance(curve[1], curve[2])
        let step = (1 / quality) / sumlen

        for (let t = 0; t < 1; t += step) {
            let point = vec2quadraticBezier(curve[0], curve[1], curve[2], t)
            result.push(point)
        }
    })

    return result
}

/**
 * 
 * @param {number} nums 
 * @returns 
 */
export function brokenLineEasyInit(nums) {
    let result = [];

    for(let i = 0; i < nums.length; i += 2) {
        result.push(vec2(nums[i], nums[i + 1]))
    }
    return result
}