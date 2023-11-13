import {
    vec2,
    vec2interpolate,
    vec2distance,
    vec2squareDistance,
    vec2quadraticBezier,
    vec2sub,
    vec2dot,
} from './vec2.mjs'

/** @type {HTMLCanvasElement} */
let canvas = document.body.getElementsByTagName('canvas')[0];
/** @type {CanvasRenderingContext2D} */
let context = canvas.getContext('2d');

/**@typedef {{positionOnLine: Number, radius: Number}} Ball */

/** @type {[{x: Number, y: Number}]} */
let brokenLine = []
/** @type {[Ball]} */
let balls = []

const DEFAULT_RADIUS = 20
for (let i = 0; i < 1000; i++) {
    balls.push({positionOnLine: i, radius: DEFAULT_RADIUS})
}

/**
 * 
 * @param {[vec2]} points 
 * @param {[Ball]} circles 
 * @returns {[{{needOffset: Number, circle: Ball, pos: vec2}}]}
 */
function zumaAlgorithm(points, circles) {
    let result = []

    let circleIndex = 0
    let pointIndex = 1
    
    let lastResult = null
    let line = [null, brokenLine[0]]
    
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

let drawLoop = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    balls[0].positionOnLine += 0.1;

    let res = zumaAlgorithm(brokenLine, balls)
    context.beginPath()
    brokenLine.forEach( ({x, y}) => {
        context.lineTo(x, y);
    })
    context.stroke()
    res.forEach( c => {
        c.circle.positionOnLine += c.needOffset
        context.beginPath()
        context.arc(c.pos.x, c.pos.y, c.circle.radius, 0, Math.PI * 2)
        context.stroke()

        context.save()
        context.beginPath()
        context.strokeStyle = 'red'
        context.arc(c.pos.x, c.pos.y, 1, 0, Math.PI * 2)
        context.stroke()
        context.restore()
    });
    requestAnimationFrame(drawLoop)
}

function quadraticBezierConverter(points) {
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

function brokenLineEasyInit(nums) {
    let result = [];

    for(let i = 0; i < nums.length; i += 2) {
        result.push(vec2(nums[i], nums[i + 1]))
    }
    return result
}

brokenLine = brokenLineEasyInit([
    -DEFAULT_RADIUS, 100,
    0, 100,
    750, 100,
    750, 550,
    50, 550,
    50, 150,
    400, 200,
])

brokenLine = brokenLineEasyInit([
    0, 0,
    50, 50,
    100, 50,
    150, 0,
    200, 0,
    250, 50,
    250, 100,
    200, 150,
    200, 200,
    250, 250,
    300, 250,
    350, 200,
].map( v => v * 2 ))

brokenLine = quadraticBezierConverter(brokenLine)

drawLoop()
document.body.onclick = drawLoop