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
        this.balls.forEach( ball => {
            context.save()
            context.translate(ball.x, ball.y)
            this.drawBall(ball, context)
            context.restore()
        })
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
        let previewBall = null

        let segmentState = this.getStartSegmentState()

        let sliceIterateDirection = 1
        for (let sliceIndex = 0; sliceIndex < this.slices.length && sliceIndex >= 0; sliceIndex += sliceIterateDirection) {
            let slice = this.slices[sliceIndex]

            let isContact = false
            let needSkip = false
            if (slice.speed < 0 && sliceIterateDirection > 0) {
                needSkip = true
                previewBall = null
            }

            if (!needSkip) {
                let firstBallIndex = 0
                let lastBallIndex = slice.balls.length - 1
                if (sliceIterateDirection < 0) {
                    firstBallIndex = lastBallIndex
                    lastBallIndex = 0
                }
                let ballIndex = firstBallIndex
                if (sliceIterateDirection > 0 && slice.speed > 0 || sliceIterateDirection < 0 && slice.speed < 0) {
                    slice.balls[ballIndex].position += slice.speed
                }
                
                while (ballIndex < slice.balls.length && ballIndex >= 0) {
                    let ball = slice.balls[ballIndex]
    
                    let resultOffset = this.calculatePlace(ball, previewBall, segmentState, sliceIterateDirection)
    
                    if (ballIndex === firstBallIndex && resultOffset !== 0) {
                        isContact = true
                    }
                    
                    previewBall = ball
                    ballIndex += sliceIterateDirection
                }
            }

            if (isContact) {
                if (sliceIterateDirection > 0) {
                    this.slices[sliceIndex - 1].balls.push(...slice.balls)
                    this.slices.splice(sliceIndex, 1)
                    sliceIndex--
                } else {
                    this.slices[sliceIndex + 1].balls.unshift(...slice.balls)
                    this.slices.splice(sliceIndex, 1)
                }
            }

            if (sliceIndex === this.slices.length - 1 && sliceIterateDirection > 0) {
                sliceIterateDirection = -1
                sliceIndex += 1
                previewBall = null
                this.searchSegment(segmentState, () => false, 1)
            }
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
            state.sumLength -= state.length * 2
        }

        while (true) {
            if (conditionFn(state)) return state
            state.index += sign
            if (state.index < 0 || state.index >= this.brokenLine.length - 1) return null
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

    calculatePlace(ball, behindBall, segmentState, sign = 1) {
        let point
        let resultOffset = 0

        if (!behindBall || behindBall.isManualControl || ball.position * sign > behindBall.position * sign) {
            let conditionFn = ({sumLength, length}) => (sumLength + length) * sign > ball.position * sign
            if (this.searchSegment(segmentState, conditionFn, sign)) {
                let root = (ball.position - segmentState.sumLength) / segmentState.length
                point = vec2interpolate(segmentState.segment[0], segmentState.segment[1], root)
            }
        }

        if (behindBall) {
            let len1sq = (ball.radius + behindBall.radius) ** 2
            if (!point || vec2squareDistance(point, behindBall) < len1sq) {
                let conditionFn = ({segment}) => vec2squareDistance(behindBall, segment[1]) > len1sq
                if (this.searchSegment(segmentState, conditionFn, sign)) {
                    let root = this.triangleSolution(segmentState, behindBall, len1sq)
                    point = vec2interpolate(segmentState.segment[0], segmentState.segment[1], root)
                    resultOffset = segmentState.sumLength + segmentState.length * root - ball.position
                }
            }
        }

        if (point) {
            vec2setvec2(ball, point)
            ball.position = ball.position + resultOffset
            return resultOffset
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