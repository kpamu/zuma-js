import {
    vec2,
    vec2interpolate,
    vec2distance,
    vec2squareDistance,
    vec2sub,
    vec2dot,
    vec2quadraticBezier,
    vec2scale
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
 * @typedef {{radius: Number, color: BallColor}} Ball
 * @typedef {Ball & {flyDirection: vec2, speed: number, pos: vec2}} FlyingBall
 */

export class Zuma {

    /** @type {[{x: Number, y: Number}]} */
    brokenLine = []
    /** @type {[Ball]} */
    balls = []

    places = []

    /**
     * 
     * @param {Ball} ball
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
        this.places.filter( a => a ).forEach( place => {
            context.save()
            context.translate(place.point.x, place.point.y)
            this.drawBall(place.circle, context)
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
        this.places = this.zumaAlgorithm()
    }

    zumaAlgorithm() {
        let previewPlaceResult = null

        let segmentState = this.getStartSegmentState()

        let positive = this.places.map( (place) => {
            let result = this.calculatePlace(place, previewPlaceResult, segmentState, 1)
            
            if (result) {
                previewPlaceResult = result
            }

            return result
        })

        this.searchSegment(segmentState, () => false, 1)
        previewPlaceResult = null

        let negative = positive.reverse().map( (place) => {
            let result = this.calculatePlace(place, previewPlaceResult, segmentState, -1)
            
            if (result) {
                previewPlaceResult = result
            }

            return result
        })

        negative.reverse()

        return negative
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

    calculatePlace(place, behindPlace, segmentState, sign = 1) {
        if (place.position < 0 && sign > 0 || place.isManualControl) {
            return place
        }

        let point
        let resultOffset = 0

        if (!behindPlace || behindPlace.isManualControl || place.position * sign > behindPlace.position * sign) {
            let conditionFn = ({sumLength, length}) => (sumLength + length) * sign > place.position * sign
        
            segmentState = this.searchSegment(segmentState, conditionFn, sign)
            if (segmentState) {
                let root = (place.position - segmentState.sumLength) / segmentState.length
                point = vec2interpolate(segmentState.segment[0], segmentState.segment[1], root)
            }
        }

        if (behindPlace) {
            let len1sq = (place.circle.radius + behindPlace.circle.radius) ** 2
            if (!point || vec2squareDistance(point, behindPlace.point) < len1sq) {
                let conditionFn = ({segment}) => vec2squareDistance(behindPlace.point, segment[1]) > len1sq
        
                segmentState = this.searchSegment(segmentState, conditionFn, sign)
                if (segmentState) {
                    let root = this.triangleSolution(segmentState, behindPlace.point, len1sq)
                    point = vec2interpolate(segmentState.segment[0], segmentState.segment[1], root)
                    resultOffset = segmentState.sumLength + segmentState.length * root - place.position
                }
            }
        }

        return segmentState && {
            circle: place.circle,
            point,
            position: place.position + resultOffset
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
    let quality = 0.01;

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