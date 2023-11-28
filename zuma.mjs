import {
    vec2,
    vec2interpolate,
    vec2distance,
    vec2squareDistance,
    vec2sub,
    vec2dot,
    vec2quadraticBezier,
    vec2scale,
    vec2setvec2
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
 * @typedef {ZumaBall & {flyDirection: vec2, speed: number, pos: vec2}} FlyingBall
 * @typedef {{balls: [ZumaBall], speed: Number}} Slice
 */

export class Zuma {

    /** @type {[{x: Number, y: Number}]} */
    brokenLine = []

    /** @type {[ZumaBall]} */
    balls = []

    /** @type {[Slice]} */
    slices = []

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
        this.zumaAlgorithm()
    }

    zumaAlgorithm() {
        let behindBall = null

        let segmentState = this.getStartSegmentState()

        let handleIteration = (slice, iterator) => {
            let sign = iterator.sign

            let isContact = false
            let needSkip = false
            if (slice.speed < 0 && sign > 0) {
                needSkip = true
                behindBall = null
            }

            if (!needSkip) {
                if (sign > 0 && slice.speed > 0 || sign < 0 && slice.speed < 0) {
                    let firstBall = this.getBallsIterator(slice, sign).next().value
                    firstBall.position += slice.speed
                }
                let outOfLine;
                ({ behindBall, isContact, outOfLine } = this.slicePlace(slice, behindBall, segmentState, sign))
                if (outOfLine) {
                    let ball = this.popBall(slice, iterator)
                }
            } else {
                this.slicePlace(slice, null, segmentState, sign)
            }

            if (isContact) {
                this.mergeSlices(iterator)
            }
        }

        for (let [iterator, slice] of this.getSlicesIterator(this.slices, 1)) {
            handleIteration(slice, iterator)
        }
        behindBall = null

        for (let [iterator, slice] of this.getSlicesIterator(this.slices, -1)) {
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
        let point
        let resultOffset = 0

        if (!behindBall || behindBall.isManualControl || ball.position * sign > behindBall.position * sign) {
            let conditionFn = ({sumLength, length}) => (sumLength + length) * sign > ball.position * sign
            if (this.searchSegment(segmentState, conditionFn, sign)) {
                let root = (ball.position - segmentState.sumLength) / segmentState.length
                point = vec2interpolate(segmentState.segment[0], segmentState.segment[1], root)
            }
        }

        let len1sq = behindBall && (ball.radius + behindBall.radius) ** 2
        if (len1sq && (!point || vec2squareDistance(point, behindBall) < len1sq)) {
            let conditionFn = ({segment}) => vec2squareDistance(behindBall, segment[1]) > len1sq
            if (this.searchSegment(segmentState, conditionFn, sign)) {
                let root = this.triangleSolution(segmentState, behindBall, len1sq)
                point = vec2interpolate(segmentState.segment[0], segmentState.segment[1], root)
                resultOffset = segmentState.sumLength + segmentState.length * root - ball.position
            } else {
                point = null
            }
        }

        return {
            point, resultOffset
        }
    }

    slicePlace(slice, behindBall, segmentState, sign) {
        let isContact = false

        let firstBallFlag = true
        for (let ball of this.getBallsIterator(slice, sign)) {
            let {point: newPoint, resultOffset} = this.calculatePlace(ball, behindBall, segmentState, sign)

            if (!newPoint) {
                return {outOfLine: true}
            }
            
            vec2setvec2(ball, newPoint)
            ball.position = ball.position + resultOffset

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
            slices
        }
        iterator[Symbol.iterator] = function*() {
            for (;iterator.index < this.slices.length && iterator.index >= 0; iterator.index += iterator.sign) {
                yield [iterator, this.slices[iterator.index]]
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

    mergeSlices(iterator) {
        let behindSlice = iterator.slices[iterator.index - iterator.sign]
        let slice = iterator.slices[iterator.index]

        iterator.slices.splice(iterator.index, 1)
        if (iterator.sign > 0) {
            behindSlice.balls.push(...slice.balls)
            iterator.index--
        } else {
            behindSlice.balls.unshift(...slice.balls)
        }
    }

    popBall(slice, iterator) {
        let ball
        if (iterator.sign > 0) {
            ball = slice.balls.pop()
        } else {
            ball = slice.balls.shift()
        }

        if (slice.balls.length === 0) {
            iterator.slices.splice(iterator.index, 1)
        }
        return ball
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
    let quality = 0.02;

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