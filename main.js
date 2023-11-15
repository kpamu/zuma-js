import {
    vec2,
    vec2interpolate,
    vec2distance,
    vec2quadraticBezier,
    vec2sub,
    vec2normal,
    vec2add,
    vec2scale,
} from './vec2.mjs'

import {
    BallColor,
    Zuma,
    DEFAULT_RADIUS,
    brokenLineEasyInit,
    quadraticBezierConverter
} from './zuma.mjs'

/** @type {HTMLCanvasElement} */
let canvas = document.body.getElementsByTagName('canvas')[0];
/** @type {CanvasRenderingContext2D} */
let context = canvas.getContext('2d');

let zuma = new Zuma()

for (let i = 0; i < 10; i++) {
    let randomColor = BallColor.getRandomColor()
    zuma.balls.push({positionOnLine: i, radius: DEFAULT_RADIUS, color: randomColor})
}

var gun = {
    direction: vec2(1),
    currentColor: BallColor.getRandomColor(),
    nextColor: BallColor.getRandomColor(),
    pos: vec2(200, 200),
}

/** @type {[import('./zuma.mjs').FlyingBall]} */
var flyingBalls = []
flyingBalls[0]

document.addEventListener('mousemove', event => {
    let mousevec = vec2(event.offsetX, event.offsetY)
    gun.direction = vec2normal(vec2sub(mousevec, gun.pos))
})
document.addEventListener('click', event => {
    let currentColor = gun.currentColor
    gun.currentColor = gun.nextColor
    gun.nextColor = BallColor.getRandomColor()

    flyingBalls.push({
        color: currentColor,
        radius: DEFAULT_RADIUS,
        pos: gun.pos,
        flyDirection: gun.direction,
        speed: 1,
    })
})

let drawLoop = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    zuma.balls[0].positionOnLine += 0.1;

    context.save()
    context.beginPath()
    context.translate(gun.pos.x, gun.pos.y)
    context.arc(0, 0, DEFAULT_RADIUS, 0, Math.PI * 2)
    context.fillStyle = gun.currentColor
    context.fill()
    context.stroke()
    context.beginPath()
    context.moveTo(gun.direction.x * DEFAULT_RADIUS, gun.direction.y * DEFAULT_RADIUS)
    context.lineTo(gun.direction.x * (DEFAULT_RADIUS * 2), gun.direction.y * (DEFAULT_RADIUS * 2))
    context.stroke()
    context.restore()

    flyingBalls.forEach( ball => {
        ball.pos = vec2add(ball.pos, vec2scale(ball.flyDirection, ball.speed))

        context.save()
        context.globalAlpha = 0.5
        context.beginPath()
        context.arc(ball.pos.x, ball.pos.y, ball.radius, 0, Math.PI * 2)
        context.fillStyle = ball.color
        context.fill()
        context.restore()
    })

    let res = zuma.zumaAlgorithm(zuma.brokenLine, zuma.balls)

    context.beginPath()
    zuma.brokenLine.forEach( ({x, y}) => {
        context.lineTo(x, y)
    })
    context.stroke()

    
    res.forEach( c => {
        c.circle.positionOnLine += c.needOffset
        c.circle.pos = c.pos
        
        context.save()
        context.globalAlpha = 0.5
        context.beginPath()
        context.arc(c.pos.x, c.pos.y, c.circle.radius, 0, Math.PI * 2)
        context.fillStyle = c.circle.color
        context.fill()
        context.restore()

        context.save()
        context.beginPath()
        context.strokeStyle = 'black'
        context.arc(c.pos.x, c.pos.y, 1, 0, Math.PI * 2)
        context.stroke()
        context.restore()
    });

    requestAnimationFrame(drawLoop)
}

zuma.brokenLine = brokenLineEasyInit([
    -DEFAULT_RADIUS, 100,
    0, 100,
    750, 100,
    750, 550,
    50, 550,
    50, 150,
    400, 200,
])

zuma.brokenLine = brokenLineEasyInit([
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

zuma.brokenLine = quadraticBezierConverter(zuma.brokenLine)

drawLoop()