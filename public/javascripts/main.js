import Vector from './models/vector.js'
import FourByFour from './models/four_by_four.js'
import Camera from './models/orthographic.js'
import angles from './isomorphisms/angles.js'
import coordinates from './isomorphisms/coordinates.js'
import renderLine from './views/line.js'
import renderCircle from './views/circle.js'
import renderPolygon from './views/polygon.js'
import { seed, noise } from './utilities/noise.js'
import { stableSort, remap, sample } from './utilities/index.js'
import { BLACK, WHITE } from './constants/colors.js'
import { ZOOM, FPS, Δt, CUBE_FACES, X_AXIS, Y_AXIS, Z_AXIS, FRAMES } from './constants/dimensions.js'

// Copyright (c) 2020 Nathaniel Wroblewski
// I am making my contributions/submissions to this project solely in my personal
// capacity and am not conveying any rights to any intellectual property of any
// third parties.

const canvas = document.querySelector('.canvas')
const context = canvas.getContext('2d')

const { sin, cos } = Math

const perspective = FourByFour.identity()
  .rotX(angles.toRadians(-5))

const camera = new Camera({
  position: Vector.zeroes(),
  direction: Vector.zeroes(),
  up: Vector.from([0, 1, 0]),
  width: canvas.width,
  height: canvas.height,
  zoom: ZOOM
})

const CUBE_VERTICES = [
  Vector.from([ 1,  1,  1]),
  Vector.from([-1,  1,  1]),
  Vector.from([ 1, -1,  1]),
  Vector.from([-1, -1,  1]),
  Vector.from([ 1,  1, -1]),
  Vector.from([-1,  1, -1]),
  Vector.from([ 1, -1, -1]),
  Vector.from([-1, -1, -1]),
]

seed(Math.random())

const campos = Vector.from([0, 10, 100])

const renderComparator = (a, b) => {
  const a0 = campos.subtract(a.center.transform(perspective))
  const b0 = campos.subtract(b.center.transform(perspective))

  if (a0.z < b0.z) return -1
  if (a0.z > b0.z) return 1
  if (a0.x < b0.x) return -1
  if (a0.x > b0.x) return 1
  if (a0.y < b0.y) return -1
  if (a0.y > b0.y) return 1
  return 0
}

const history = []
const start = Vector.from([-5, 0, 0])
const cube = CUBE_VERTICES.map(vertex => vertex.multiply(1.5).add(start))
const faces = CUBE_FACES.map(face => {
  const vertices = face.map(index => cube[index])
  const center = vertices[0].subtract(vertices[1]).divide(2).add(vertices[1])

  return {
    type: 'polygon',
    vertices,
    center,
    stroke: BLACK,
  }
})

const divider = {
  type: 'polygon',
  vertices: [
    Vector.from([-1,  10, 0]),
    Vector.from([ 1,  10, 0]),
    Vector.from([ 1, -10, 0]),
    Vector.from([-1, -10, 0]),
  ],
  center: Vector.zeroes(),
  stroke: WHITE,
  fill: WHITE,
}

const states = []
const by = 2
const degrees = 360 * by

for (let i = 0; i < degrees; i += 1/by) {
  const radians = angles.toRadians(i)

  states[i] = faces.map(face => ({
    ...face,
    vertices: face.vertices.map(vertex => vertex.rotateAround(Vector.zeroes(), Y_AXIS, radians)),
    center: face.center.rotateAround(Vector.zeroes(), Y_AXIS, radians)
  }))
}

context.lineCap = 'round'
context.lineJoin = 'round'
context.miterLimit = 0

const render = () => {
  context.clearRect(0, 0, canvas.width, canvas.height)

  if (time === degrees) time = 0

  stableSort(states[time].concat([divider]), renderComparator).forEach(face => {
    const projected = face.vertices.map(vertex => {
      return camera.project(vertex.transform(perspective))
    })

    renderPolygon(context, projected, face.stroke, face.fill, 3)
  })

  time += Δt
}

let prevTick = 0
let time = 0

const step = () => {
  window.requestAnimationFrame(step)

  const now = Math.round(FPS * Date.now() / 1000)
  if (now === prevTick) return
  prevTick = now

  render()
}

step()
