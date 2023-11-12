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
balls.push({positionOnLine: 100, radius: DEFAULT_RADIUS})
balls.push({positionOnLine: 400, radius: DEFAULT_RADIUS})
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

function interpolate(v1, v2, t) {
    return v1 + (v2 - v1) * t
}

function quadraticBezier(v1, v2, p3, t) {
    return t * (t * (p3 - v2 * 2 + v1) + 2 * (v2 - v1)) + v1
};

function vec2(x = 0, y = 0) {
    return { x, y }
}

function vec2sub(v1, v2) {
    return {
        x: v1.x - v2.x,
        y: v1.y - v2.y
    }
}
function vec2add(v1, v2) {
    return {
        x: v1.x + v2.x,
        y: v1.y + v2.y
    }
}

function vec2dotProduct(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y 
}

function vec2normal(v1) {
    let len = Math.hypot(v1.x, v1.y)
    return {
        x: v1.x / len,
        y: v1.y / len
    }
}

function vec2distance(v1, v2) {
    return Math.hypot((v2.x - v1.x), (v2.y - v1.y))
}

function vec2interpolate(v1, v2, t) {
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
    let line = [null, brokenLine[0]]
    
    let sumLength = 0
    while (pointIndex < points.length && circleIndex < circles.length) {
        let circle = circles[circleIndex]
        let point = points[pointIndex]

        if (lastResult === null && circle.positionOnLine < 0) {
            circleIndex += 1
            continue
        }
        
        line = [line[1], point]
    
        let len = vec2distance(line[0], line[1]);

        let isgoodline = len && sumLength + len > circle.positionOnLine

        let mayberesult = null
        let needOffset = 0
        
        if (isgoodline) {
            mayberesult = vec2interpolate(line[0], line[1], (circle.positionOnLine - sumLength) / len)
        }

        if (isgoodline && lastResult) {
            let iscorrect = true
            iscorrect &&= lastResult.circle.positionOnLine + lastResult.needOffset < circle.positionOnLine
            iscorrect &&= vec2distance(lastResult.pos, mayberesult) > circle.radius + lastResult.circle.radius
            
            if (!iscorrect) {
                mayberesult = null
            }
            if (!iscorrect && vec2distance(lastResult.pos, line[1]) > circle.radius + lastResult.circle.radius) {
                let b = vec2sub(line[1], line[0])
                let c = vec2sub(lastResult.pos, line[0])
                let projRoot = vec2dotProduct(c, b) / vec2dotProduct(b, b)
                let proj = vec2interpolate(line[0], line[1], projRoot)
                
                let len0 = vec2distance(lastResult.pos, proj)
                let len1 = circle.radius + lastResult.circle.radius
                let len2 = Math.sqrt(Math.abs(len1 * len1 - len0 * len0))
                
                mayberesult = vec2interpolate(line[0], line[1], projRoot + (len2 / len))
                needOffset = sumLength + len * (projRoot + (len2 / len)) - circle.positionOnLine
            }
        }
            
        if (mayberesult !== null) {
            result[circleIndex] = {circle: circle, pos: mayberesult, needOffset: needOffset}
            lastResult = result[circleIndex]
            circleIndex += 1
            line = [line[1], line[0]]
            continue
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
            vec2interpolate(first, second, t),
            second,
            vec2interpolate(second, third, t)
        ])
    })
    
    let result = [];
    let quality = 10;

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

//brokenLine = quadraticBezierConverter(brokenLine)