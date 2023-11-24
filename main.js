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

for (let i = 0; i < 5; i++) {
    let randomColor = BallColor.getRandomColor()
    zuma.balls.push({radius: DEFAULT_RADIUS, color: randomColor})
}
for (let i = 0; i < zuma.balls.length; i++) {
    zuma.places.push({
        circle: zuma.balls[i],
        requestOffset: i * 70,
        position: 0
    })
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


let mousepos = vec2()
canvas.addEventListener('mousemove', event => {
    let mousevec = vec2(event.offsetX, event.offsetY)
    mousepos = mousevec
    gun.direction = vec2normal(vec2sub(mousevec, gun.pos))
})
canvas.addEventListener('click', event => {
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

    // flyingBalls.forEach( flyingBall => {
    //     flyingBall.pos = vec2add(flyingBall.pos, vec2scale(flyingBall.flyDirection, flyingBall.speed))

    //     zuma.visibledBalls.forEach( zumaBall => {
    //         let distance = vec2distance(zumaBall.pos, flyingBall.pos)
    //         let minDistance = zumaBall.radius + zumaBall.radius
    //         if (distance < minDistance) {
    //             console.log(1)
    //         } 
    //     })

    //     zuma.drawBall(flyingBall, context)
    // })

    if (zuma.places[4]) {
        zuma.places[4].requestOffset = -0.1
        // zuma.places[0].isManualControl = true;
        // zuma.places[0].point = mousepos
        // zuma.places[0].sign = -1
    }
    zuma.step()

    zuma.drawPath(context)
    zuma.drawVisibledBalls(context)

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

zuma.step()
drawLoop()