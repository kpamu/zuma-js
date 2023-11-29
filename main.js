import {
    vec2,
    vec2interpolate,
    vec2distance,
    vec2quadraticBezier,
    vec2sub,
    vec2normal,
    vec2add,
    vec2scale,
    vec2setvec2,
    vec2cross,
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

var gun = {
    direction: vec2(1),
    currentColor: BallColor.getRandomColor(),
    nextColor: BallColor.getRandomColor(),
    pos: vec2(200, 200),
}

/** @type {[import('./zuma.mjs').FlyingBall]} */
var flyingBalls = []

let mousepos = vec2(500, 500)
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
        x: gun.pos.x,
        y: gun.pos.y,
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

    flyingBalls.forEach( flyingBall => {
        vec2setvec2(flyingBall, vec2add(flyingBall, vec2scale(flyingBall.flyDirection, flyingBall.speed)))
        
        let balls = zuma.slices.reduce((p, slice) => {
            p.push(...slice.balls.map( (ball, index) => {
                return {slice, ball, index}
            }))
            return p
        }, [])
        balls.filter( ({ball}) => ball.position > 0).forEach( ({slice, ball: visibleBall, index}, _, _array) => {
            let distance = vec2distance(visibleBall, flyingBall)
            let minDistance = visibleBall.radius + flyingBall.radius
            if (distance < minDistance) {
                let indexModifier = +(vec2cross(vec2sub(flyingBall, visibleBall), visibleBall.perpendicular) > 0)

                flyingBall.position = slice.balls[0].position
                slice.balls.splice(index + indexModifier, 0, flyingBall)
                flyingBalls.splice(flyingBalls.indexOf(flyingBall), 1)
                
                delete flyingBall.speed
                delete flyingBall.flyDirection
                _array.length = 0

                let leftIndex = index + indexModifier
                let rightIndex = index + indexModifier
                while(leftIndex - 1 >= 0 && slice.balls[leftIndex - 1].color === slice.balls[rightIndex].color) {
                    leftIndex--
                }
                while(rightIndex + 1 < slice.balls.length && slice.balls[leftIndex].color === slice.balls[rightIndex + 1].color) {
                    rightIndex++
                }

                let cutLength = rightIndex - leftIndex + 1
                if (cutLength >= 3) {
                    slice.balls.splice(leftIndex, cutLength)
                    if (leftIndex !== 0 && leftIndex !== slice.balls.length - 1) {
                        let sliceIndex = zuma.slices.indexOf(slice)
                        let newSlice = {
                            balls: slice.balls.splice(leftIndex, slice.balls.length - leftIndex),
                            speed: 0
                        }
                        zuma.slices.splice(sliceIndex + 1, 0, newSlice)
                    }
                }
            }
        })
        
        context.save()
        context.translate(flyingBall.x, flyingBall.y)
        zuma.drawBall(flyingBall, context)
        context.restore()
    })

    // if (zuma.places[4]) {
        // zuma.places[1].isManualControl = true;
        // zuma.places[1].point = mousepos
    // }
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