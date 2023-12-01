import {
    vec2,
    vec2interpolate,
    vec2distance,
    vec2squareDistance,
    vec2sub,
    vec2dot,
    vec2quadraticBezier,
    vec2scale,
    vec2setvec2,
    vec2perpendicular,
    vec2add,
    vec2cross
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
 * @typedef {vec2 & {radius: Number, color: BallColor, position: Number}} ZumaBall
 * @typedef {ZumaBall & {flyDirection: vec2, speed: number}} FlyingBall
 * @typedef {{balls: [ZumaBall], speed: Number}} Slice
 */

export class Zuma {

    /** @type {[{x: Number, y: Number}]} */
    brokenLine = []

    /** @type {[Slice]} */
    slices = []

    /** @type {[FlyingBall]} */
    flyingBalls = []

    gun = {
        direction: vec2(1),
        currentColor: BallColor.getRandomColor(),
        nextColor: BallColor.getRandomColor(),
        pos: vec2(200, 200),
    }

    draw(context) {
        this.drawPath(context)
        this.drawGun(context)
        this.drawVisibledBalls(context)
        this.drawFlyingBalls(context)
    }

    gunShot(context) {
        let currentColor = this.gun.currentColor
        this.gun.currentColor = this.gun.nextColor
        this.gun.nextColor = BallColor.getRandomColor()

        this.flyingBalls.push({
            color: currentColor,
            radius: DEFAULT_RADIUS,
            x: this.gun.pos.x,
            y: this.gun.pos.y,
            flyDirection: this.gun.direction,
            speed: 1,
        })
    }

    drawGun(context) {
        context.save()
        context.beginPath()
        context.translate(this.gun.pos.x, this.gun.pos.y)
        context.arc(0, 0, DEFAULT_RADIUS, 0, Math.PI * 2)
        context.fillStyle = this.gun.currentColor
        context.fill()
        context.stroke()
        context.beginPath()
        context.moveTo(this.gun.direction.x * DEFAULT_RADIUS, this.gun.direction.y * DEFAULT_RADIUS)
        context.lineTo(this.gun.direction.x * (DEFAULT_RADIUS * 2), this.gun.direction.y * (DEFAULT_RADIUS * 2))
        context.stroke()
        context.restore()
    }

    drawFlyingBalls(context) {
        this.flyingBalls.forEach( flyingBall => {
            context.save()
            context.translate(flyingBall.x, flyingBall.y)
            this.drawBall(flyingBall, context)
            context.restore()
        })
    }

    /**
     * 
     * @param {ZumaBall} ball
     * @param {CanvasRenderingContext2D} context  
     */
    drawBall(ball, context) {
        context.save()
        context.globalAlpha = 0.5
        context.beginPath()
        context.arc(0, 0, ball.radius, 0, Math.PI * 2)
        context.fillStyle = ball.color
        context.fill()
        context.restore()

        context.save()
        context.beginPath()
        context.strokeStyle = 'black'
        context.arc(0, 0, 1, 0, Math.PI * 2)
        context.stroke()
        context.restore()

        if (ball.perpendicular) {
            context.save()
            context.moveTo(0, 0)
            context.scale(10, 10)
            context.lineTo(ball.perpendicular.x, ball.perpendicular.y)
            context.restore()
            context.stroke()
        }
    }

    /**
     * 
     * @param {CanvasRenderingContext2D} context 
     */
    drawVisibledBalls(context) {
        this.slices.forEach( slice => slice.balls.forEach( ball => {
            context.save()
            context.translate(ball.x, ball.y)
            this.drawBall(ball, context)
            context.restore()
        }))
    }

    /**
     * 
     * @param {CanvasRenderingContext2D} context 
     */
    drawPath(context) {
        context.save()
        context.beginPath()
        this.brokenLine.forEach( ({x, y}) => {
            context.lineTo(x, y)
        })
        context.stroke()
        context.closePath()
        context.restore()
    }

    step() {
        this.stepFlyingBalls()
        this.zumaAlgorithm()
    }

    stepFlyingBalls() {
        this.flyingBalls.forEach( flyingBall => {
            vec2setvec2(flyingBall, vec2add(flyingBall, vec2scale(flyingBall.flyDirection, flyingBall.speed)))
            
            let balls = this.slices.reduce((p, slice) => {
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
                    this.flyingBalls.splice(this.flyingBalls.indexOf(flyingBall), 1)
                    
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
                            let sliceIndex = this.slices.indexOf(slice)
                            let newSlice = {
                                balls: slice.balls.splice(leftIndex, slice.balls.length - leftIndex),
                                speed: 0
                            }
                            this.slices.splice(sliceIndex + 1, 0, newSlice)
                        }
                    }
                }
            })
        })
    }

    zumaAlgorithm() {
        let behindBall = null

        let segmentState = this.getStartSegmentState()

        let handleIteration = (slice, iterator) => {
            let sign = iterator.sign

            let outOfLine
            let isContact

            if (!(slice.speed < 0 && sign > 0)) {
                if (sign > 0 && slice.speed > 0 || sign < 0 && slice.speed < 0) {
                    let [firstBall] = this.getBallsIterator(slice, sign)
                    firstBall.position += slice.speed
                }
                ({ behindBall, isContact, outOfLine } = this.slicePlace(slice, behindBall, segmentState, sign))
            } else {
                behindBall = null
                this.slicePlace(slice, null, segmentState, sign)
            }
            
            if (outOfLine && sign > 0) {
                // end game
            }
            if (isContact) {
                this.mergeSlices(slice, iterator)
            }
        }

        let iterator = this.getSlicesIterator(this.slices, 1)
        for (let slice of iterator) {
            handleIteration(slice, iterator)
        }
        iterator.reverse()
        behindBall = null

        for (let slice of iterator) {
            handleIteration(slice, iterator)
        }
    }
    
    getStartSegmentState() {
        return {
            index: 0,
            sumLength: 0,
            length: vec2distance(this.brokenLine[0], this.brokenLine[1]),
            segment: [this.brokenLine[0], this.brokenLine[1]],
            sign: 1
        }
    }

    searchSegment(state, conditionFn, sign) {
        if (sign !== state.sign) {
            state.segment.reverse()
            state.sign = sign
            state.length = -state.length
            state.sumLength -= state.length
        }

        while (true) {
            if (conditionFn(state)) return state
            if (state.index + sign < 0 || state.index + sign >= this.brokenLine.length - 1) return null
            state.index += sign
            state.segment[0] = this.brokenLine[state.index + (sign < 0)]
            state.segment[1] = this.brokenLine[state.index + (sign > 0)]
            state.sumLength += state.length
            state.length = vec2distance(state.segment[0], state.segment[1]) * sign
        }
    }

    triangleSolution({segment, length}, point, len1sq) {
        let b = vec2sub(segment[1], segment[0])
        let c = vec2sub(point, segment[0])
        let projRoot = vec2dot(c, b) / (length * length)
        let proj = vec2interpolate(segment[0], segment[1], projRoot)
        let len0sq = vec2squareDistance(point, proj)
        let len2 = Math.sqrt(Math.abs(len1sq - len0sq))
        return projRoot + len2 / Math.abs(length)
    }

    calculatePlace(ball, behindBall, segmentState, sign) {
        let root
        let point
        let perpendicular
        let resultOffset = 0

        if (!behindBall || behindBall.isManualControl || ball.position * sign > behindBall.position * sign) {
            let conditionFn = ({sumLength, length}) => (sumLength + length) * sign > ball.position * sign
            if (this.searchSegment(segmentState, conditionFn, sign)) {
                root = (ball.position - segmentState.sumLength) / segmentState.length
                point = vec2interpolate(segmentState.segment[0], segmentState.segment[1], root)
                
            }
        }

        let len1sq = behindBall && (ball.radius + behindBall.radius) ** 2
        if (len1sq && (!point || vec2squareDistance(point, behindBall) < len1sq)) {
            let conditionFn = ({segment}) => vec2squareDistance(behindBall, segment[1]) > len1sq
            if (this.searchSegment(segmentState, conditionFn, sign)) {
                root = this.triangleSolution(segmentState, behindBall, len1sq)
                point = vec2interpolate(segmentState.segment[0], segmentState.segment[1], root)
                resultOffset = segmentState.sumLength + segmentState.length * root - ball.position
            } else {
                point = null
            }
        }

        if (point) {
            perpendicular = vec2perpendicular(vec2scale(vec2sub(point, segmentState.segment[0]), 1 / (segmentState.length * root)))
        }

        return { point, resultOffset, perpendicular }
    }

    slicePlace(slice, behindBall, segmentState, sign) {
        let isContact = false

        let firstBallFlag = true
        for (let ball of this.getBallsIterator(slice, sign)) {
            let {point, resultOffset, perpendicular} = this.calculatePlace(ball, behindBall, segmentState, sign)

            if (!point) {
                return { outOfLine: true }
            }
            
            vec2setvec2(ball, point)
            ball.position = ball.position + resultOffset
            ball.perpendicular = perpendicular

            if (firstBallFlag && resultOffset !== 0) {
                isContact = true
            }

            firstBallFlag = false
            behindBall = ball
        }

        return { behindBall, isContact }
    }

    getSlicesIterator(slices, sign) {
        let iterator = {
            index: sign > 0 ? 0 : this.slices.length - 1,
            sign,
            slices,
            reverse() {
                this.index -= this.sign
                this.sign = -1
            }
        }
        iterator[Symbol.iterator] = function*() {
            for (;iterator.index < this.slices.length && iterator.index >= 0; iterator.index += iterator.sign) {
                yield this.slices[iterator.index]
            }
        }
        return iterator
    }

    *getBallsIterator(slice, sign) {
        if (sign < 0) {
            return yield *slice.balls.toReversed()
        } else {
            return yield *slice.balls
        }
    }

    mergeSlices(slice, iterator) {
        let behindSlice = iterator.slices[iterator.index - iterator.sign]

        iterator.slices.splice(iterator.index, 1)
        if (iterator.sign > 0) {
            behindSlice.balls.push(...slice.balls)
            iterator.index--
        } else {
            behindSlice.balls.unshift(...slice.balls)
        }
    }
}

/**
 * 
 * @param {vec2} points 
 * @returns {vec2}
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
 * @returns {vec2} 
 */
export function brokenLineEasyInit(nums) {
    let result = [];

    for(let i = 0; i < nums.length; i += 2) {
        result.push(vec2(nums[i], nums[i + 1]))
    }
    return result
}