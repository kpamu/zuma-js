/** @type {HTMLCanvasElement} */
let canvas = document.body.getElementsByTagName('canvas')[0];
/** @type {CanvasRenderingContext2D} */
let context = canvas.getContext('2d');

context.stroke()

/** @type {[{x: Number, y: Number}]} */
let brokenLine = []
/** @type {[{positionOnLine: Number, radius: Number]} */
let balls = []

const DEFAULT_RADIUS = 10

balls.push({positionOnLine: 0, radius: DEFAULT_RADIUS})
balls.push({positionOnLine: 0, radius: DEFAULT_RADIUS})
balls.push({positionOnLine: 0, radius: DEFAULT_RADIUS})
balls.push({positionOnLine: 0, radius: DEFAULT_RADIUS})
balls.push({positionOnLine: 0, radius: DEFAULT_RADIUS})

brokenLine.push({x: 0, y: 0})
brokenLine.push({x: 50, y: 50})
brokenLine.push({x: 100, y: 50})
brokenLine.push({x: 150, y: 0})
brokenLine.push({x: 200, y: 0})
brokenLine.push({x: 250, y: 50})
brokenLine.push({x: 250, y: 100})
brokenLine.push({x: 200, y: 150})
brokenLine.push({x: 200, y: 200})
brokenLine.push({x: 250, y: 250})
brokenLine.push({x: 300, y: 250})
brokenLine.push({x: 350, y: 200})

function vec2(x = 0, y = 0) {
    return { x, y }
}

function interpolate(v1, v2, t) {
    return v1 + (v2 - v1) * t
}

function quadraticBezier(v1, v2, p3, t) {
    return t * (t * (p3 - v2 * 2 + v1) + 2 * (v2 - v1)) + v1
};

function vec2distance(v1, v2) {
    return Math.hypot((v2.x - v1.x), (v2.y - v1.y))
}

function vec2interpolate(v1, v2) {
    return {
        x: interpolate(v1.x, v2.x, t),
        y: interpolate(v1.y, v2.y, t)
    }
}
function vec2quadraticBezier(v1, v2, p3, t) {
    return {
        x: quadraticBezier(v1.x, v2.x, p3.x, t),
        y: quadraticBezier(v1.y, v2.y, p3.y, t)
    }
}

function asd(points, circles) {
    let result = []

    let circleIndex = 0
    let pointIndex = 1
    
    let lastResult = null
    let line = [{x: 0, y: 0}, brokenLine[0]]
    
    let sumLength = 0
    while (pointIndex < points.length && circleIndex < circles.length) {
        let circle = circles[circleIndex]
        let point = points[pointIndex]
        
        line = [line[1], point]
    
        let len = Math.hypot((line[1].x - line[0].x), (line[1].y - line[0].y))
    
        if (lastResult == null && circle.positionOnLine < 0) {
            circleIndex += 1
        } else if (len != 0 && sumLength + len > circle.positionOnLine) {
            let mayberesult = null
            if (sumLength <= circle.positionOnLine) {
                let t = (circle.positionOnLine - sumLength) / len;
                mayberesult = {x: line[0].x + (line[1].x - line[0].x) * t, y: line[0].y + (line[1].y - line[0].y) * t}
            }
            let needOffset = 0
            if (lastResult !== null) {
                if (mayberesult !== null) {
                    //tut kakaya to error
                    let templen = Math.hypot((lastResult.pos.x - mayberesult.x), (lastResult.pos.y - mayberesult.y))
                    console.log(templen)
                    if (lastResult.circle.positionOnLine + lastResult.needOffset >= circle.positionOnLine || templen <= circle.radius + lastResult.circle.radius) {
                        mayberesult = null
                    }
                }
                let templen = Math.hypot((lastResult.pos.x - line[1].x), (lastResult.pos.y - line[1].y))
                if (mayberesult === null && templen > circle.radius + lastResult.circle.radius) {
                    let b = {x: line[1].x - line[0].x, y: line[1].y - line[0].y}
                    let c = {x: lastResult.pos.x - line[0].x, y: lastResult.pos.y - line[0].y}
                    let root = (c.x * b.x + c.y * b.y) / (b.x * b.x + b.y * b.y)
                    let proj = {x: line[0].x + (line[1].x - line[0].x) * root, y: line[0].y + (line[1].y - line[0].y) * root}
                    
                    let len0 = Math.hypot((proj.x - lastResult.pos.x), (proj.y - lastResult.pos.y))
                    let len1 = circle.radius + lastResult.circle.radius
                    let len2 = Math.sqrt(Math.abs(len1 * len1 - len0 * len0))
                    
                    let len = Math.hypot((line[0].x - proj.x), (line[0].y - proj.y))
                    let lpnormal = {x: (line[0].x - proj.x) / len , y: (line[0].y - proj.y) / len}
    
                    let rootLinePoint = (line, point) => {
                        let result = (point.y - line[0].y) / (line[1].y - line[0].y)
                        if (isNaN(result)) {
                            result = (point.x - line[0].x) / (line[1].x - line[0].x)
                        }
                        return result
                    }
                    let flag = rootLinePoint(line, proj) > 0 ? -1 : 1
                    mayberesult = {x: proj.x + lpnormal.x * len2 * flag, y: proj.y + lpnormal.y * len2 * flag}
                    needOffset = (sumLength + len * rootLinePoint(line, mayberesult)) - circle.positionOnLine
                }
            }
            
            if (mayberesult !== null) {
                result[circleIndex] = {circle: circle, pos: mayberesult, needOffset: needOffset}
                lastResult = result[circleIndex]
                circleIndex += 1
                line = [line[1], line[0]]
                continue
            }
        }
    
        sumLength += len
        pointIndex += 1
    }

    return result
}


let drawLoop = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    balls[0].positionOnLine += 0.1;

    let res = asd(brokenLine, balls)
    context.beginPath()
    brokenLine.forEach( ({x, y}) => {
        context.lineTo(x, y);
    })
    context.stroke()
    res.forEach( c => {
        context.beginPath()
        context.arc(c.pos.x, c.pos.y, c.circle.radius, 0, Math.PI * 2)
        context.stroke()
    });
    console.log(res)
    requestAnimationFrame(drawLoop)
}

drawLoop()
document.body.onclick = drawLoop

function quadraticBezierConverter(points) {
    let curves = []
    let t = 0.5
    points.forEach((p, i) => {
        let first = points[Math.max(0, i - 1)]
        let second = p
        let third = points[Math.min(points.length - 1, i + 1)]
        curves.push([
            {x: first.x + (second.x - first.x) * t, y: first.y + (second.y - first.y) * t},
            second,
            {x: second.x + (third.x - second.x) * t, y: second.y + (third.y - second.y) * t}
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

brokenLine = quadraticBezierConverter(brokenLine)