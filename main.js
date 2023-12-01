import {
    vec2,
    vec2sub,
    vec2normal,
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

zuma.slices.push({balls: [], speed: 0.1})

for (let i = 0; i < 30; i++) {
    let randomColor = BallColor.getRandomColor()
    let ball = {radius: DEFAULT_RADIUS, color: randomColor}
    ball.position = DEFAULT_RADIUS * 2 * -i - DEFAULT_RADIUS + 1300

    zuma.slices[0].balls.unshift(ball)
}

let mousepos = vec2(500, 500)
canvas.addEventListener('mousemove', event => {
    let mousevec = vec2(event.offsetX, event.offsetY)
    mousepos = mousevec
    zuma.gun.direction = vec2normal(vec2sub(mousevec, zuma.gun.pos))
})
canvas.addEventListener('click', event => {
    zuma.gunShot()
})

let drawLoop = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    zuma.step()
    zuma.draw(context)

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