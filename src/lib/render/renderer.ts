// Types
import type PIXI from 'pixi.js' 
import type { Slide, SlideEnd, SlideNote, SlideStart, SlideStep } from '$lib/score/beatmap'
import type { Mode } from '$lib/editing'

// Consts
import COLORS from '$lib/colors'
import {
  BEAT_IN_MEASURE,
  MARGIN_BOTTOM,
  LANE_WIDTH,
  LANE_COUNT,
  LANE_AREA_WIDTH,
  TEXT_MARGIN,
  MARGIN,
  FONT_FAMILY,
  NOTE_HEIGHT,
  NOTE_WIDTH,
  NOTE_PIVOT,
  DIAMOND_PIVOT,
  DIAMOND_HEIGHT,
  DIAMOND_WIDTH,
  MEASURE_HEIGHT,
} from '$lib/consts'
import { calcMidX, calcX, calcY } from '$lib/timing'
import { MODE_TEXTURES } from '$lib/editing'

// Drawing Functions
export function drawDashedLine(graphics: PIXI.Graphics, fromX: number, fromY: number, toX: number, toY: number, dash: number = 10, gap: number = 8) {
  graphics.moveTo(fromX, fromY);
  const currentPosition = {
    x: fromX,
    y: fromY
  }

  for (
    ;
    Math.abs(currentPosition.x) < toX ||
    Math.abs(currentPosition.y) < toY;
  ) {
    currentPosition.x =
      Math.abs(currentPosition.x + dash) < toX
        ? currentPosition.x + dash
        : toX;
    currentPosition.y =
      Math.abs(currentPosition.y + dash) < toY
        ? currentPosition.y + dash
        : toY;

    graphics.lineTo(currentPosition.x, currentPosition.y);

    currentPosition.x =
      Math.abs(currentPosition.x + gap) < toX
        ? currentPosition.x + gap
        : toX;
    currentPosition.y =
      Math.abs(currentPosition.y + gap) < toY
        ? currentPosition.y + gap
        : toY;

    graphics.moveTo(currentPosition.x, currentPosition.y);
  }
}

export function drawBackground(
  graphics: PIXI.Graphics, measureHeight: number, topY: number, maxMeasure: number, innerHeight: number
) {   
  graphics.clear()
  
  // Draw lanes
  for (let i = 1; i < 14; i++) {
    const x = i * LANE_WIDTH
    if (i % 2 != 0) {
      graphics.lineStyle(2, COLORS.COLOR_LANE_PRIMARY, 1, 0.5)
    } else {
      graphics.lineStyle(1, COLORS.COLOR_LANE_SECONDARY, 1, 0.5)
    }
    graphics.moveTo(x, innerHeight)
    graphics.lineTo(x, topY - MEASURE_HEIGHT / BEAT_IN_MEASURE)
  }

  // Draw bars
  for (let i = 0; i < maxMeasure * BEAT_IN_MEASURE + 1 ; i++) {
    const y = innerHeight - (MARGIN_BOTTOM + i * measureHeight / BEAT_IN_MEASURE)

    if (i % BEAT_IN_MEASURE == 0) {
      graphics.lineStyle(2, COLORS.COLOR_BAR_PRIMARY, 1, 0.5)
      graphics.moveTo(0, y)
      graphics.lineTo(LANE_AREA_WIDTH, y)
    } else {
      graphics.lineStyle(1, COLORS.COLOR_BAR_SECONDARY, 1, 0.5)
      graphics.moveTo(LANE_WIDTH, y)
      graphics.lineTo(LANE_AREA_WIDTH - LANE_WIDTH, y)
    }
  }
}


const EASE_RATIOS = {
  curved: 0.5,
  straight: 0
}
const SHRINK_WIDTH = LANE_WIDTH / 8

export function drawSlidePath(graphics: PIXI.Graphics, slideNotes: SlideNote[], critical: boolean, measureHeight: number) {
  graphics.clear()

  const pairs = slideNotes
    .reduce((acc: [SlideStart | SlideStep, SlideStep | SlideEnd][], ele: SlideNote, ind: number, arr: SlideNote[]) => {
      if (ind < arr.length - 1) {
        acc.push([arr[ind] as SlideStart | SlideStep, arr[ind + 1] as SlideStep | SlideEnd])
      }
      return acc
    }, [])
  console.log({pairs})

  // graphics.lineStyle(3, getRandomColor(), 1)

  pairs
    .forEach(([originNote, targetNote]) => {
      const originX = calcMidX(originNote.lane, originNote.width)
      const origin = {
        x: {
          left: originX - originNote.width * LANE_WIDTH / 2 + SHRINK_WIDTH,
          mid: originX,
          right: originX + originNote.width * LANE_WIDTH / 2 - SHRINK_WIDTH,
        },
        y: calcY(originNote.tick, measureHeight)
      }
      const targetX = calcMidX(targetNote.lane, targetNote.width)
      const target = {
        x: {
          left: targetX - targetNote.width * LANE_WIDTH / 2 + SHRINK_WIDTH,
          mid: targetX,
          right: targetX + targetNote.width * LANE_WIDTH / 2 - SHRINK_WIDTH,
        },
        y: calcY(targetNote.tick, measureHeight)
      }

      console.log(origin, target)
      graphics.beginFill(critical ? COLORS.COLOR_SLIDE_PATH : COLORS.COLOR_SLIDE_PATH_CRITICAL, COLORS.ALPHA_SLIDE_PATH)

      switch (originNote.easeType) {
        case 'easeOut':
          drawCurve(graphics, origin.x.left, origin.y, target.x.left, target.y, quadraticEaseIn)
          graphics.lineTo(target.x.right, target.y)
          drawCurve(graphics, target.x.right, target.y, origin.x.right, origin.y, quadraticEaseOut)
          graphics.lineTo(origin.x.left, origin.y)
          break
        case 'easeIn':
          drawCurve(graphics, origin.x.right, origin.y, target.x.right, target.y, quadraticEaseOut)
          graphics.lineTo(target.x.left, target.y)
          drawCurve(graphics, target.x.left, target.y, origin.x.left, origin.y, quadraticEaseIn)
          graphics.lineTo(origin.x.right, origin.y)
          break
        default:
          graphics.moveTo(origin.x.left, origin.y)
          graphics.lineTo(origin.x.right, origin.y)
          graphics.lineTo(target.x.right, target.y)
          graphics.lineTo(target.x.left, target.y)
          break
      }
      // graphics.closePath()
      graphics.endFill()
    })        
}

      
function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return parseInt(color, 16);
}

function lerp(v0: number, v1: number, t: number) {
  return (1 - t) * v0 + t * v1;
}

function quadraticEaseIn(t: number) {
  return t * t
}

function quadraticEaseOut(t: number) {
  return 1 - (1 - t) ** 2
}

function drawCurve(
  graphics: PIXI.Graphics,
  fromX: number, fromY: number,
  toX: number, toY: number,
  ease: (t: number) => number
) {
  graphics.moveTo(fromX, fromY)
  for (let i = 0; i <= 1; i += 0.1) {
    // console.log({
    //   i,
    //   fromX, fromY, toX, toY,
    //   lerpX: lerp(fromX, toX, i), lerpY: lerp(fromY, toY, ease(i))
    // })
    graphics.lineTo(
      lerp(fromX, toX, i),
      lerp(fromY, toY, ease(i))
    )
  }
}

export function drawBPMs(graphics: PIXI.Graphics, pixi, bpms: Map<number, number>, measureHeight: number) {
  graphics.clear()
  graphics.lineStyle(1, COLORS.COLOR_BPM, 1)
  graphics.removeChildren()

  // Draw BPMs
  bpms.forEach((bpm, tick) => {
    const newY = calcY(tick, measureHeight)

    // Draw BPM LINES
    graphics.moveTo(MARGIN, newY)
    graphics.lineTo(MARGIN + LANE_AREA_WIDTH, newY)

    // Draw BPM Texts
    const text: PIXI.Text = graphics.addChild(new pixi.Text(`𝅘𝅥=${bpm}`, {
        fill: COLORS.COLOR_BPM,
        fontSize: 20,
        fontFamily: FONT_FAMILY
      }))
    text.anchor.set(0.5, 0.5)

    text.setTransform(MARGIN + LANE_AREA_WIDTH + LANE_WIDTH + TEXT_MARGIN, newY)
  })
}

let lastText: PIXI.Text

export function drawSnappingElements(
  graphics: PIXI.Graphics, pixi, TEXTURES: Record<string, PIXI.Texture>,
  currentMode: Mode, x:number, y: number, hasBPM: boolean
) {
  graphics.clear()
  if (lastText && !lastText.destroyed) {
    lastText.destroy()
  }
  graphics.removeChildren()

  if (currentMode == 'select') {
    return
  }

  if (currentMode == 'bpm') {
    const text = new pixi.Text(hasBPM ? `↑ BPM` : `+ BPM`, {
      fill: COLORS.COLOR_BPM,
      fontSize: 20
    })
    text.anchor.set(0.5, 0.5)
    text.setTransform(MARGIN + LANE_AREA_WIDTH + 3 * TEXT_MARGIN, hasBPM ? y + 25 : y)
    lastText = graphics.addChild(text)
    
    if (!hasBPM) {
      graphics.lineStyle(2, COLORS.COLOR_BPM, 1)
      drawDashedLine(graphics, MARGIN, y, MARGIN + LANE_AREA_WIDTH, y)
    }
    return
  }

  if (currentMode === 'flick') {
    const flickArrow: PIXI.Sprite = new pixi.Sprite(
      TEXTURES['notes_flick_arrow_02.png']
    )
    flickArrow.anchor.set(0.5, 0.5)
    flickArrow.setTransform(x, y - 45)
    flickArrow.alpha = 0.5
    flickArrow.height = 0.75 * NOTE_HEIGHT
    flickArrow.width = NOTE_WIDTH
    graphics.addChild(flickArrow)
  }

  const floating: PIXI.Sprite = new pixi.Sprite(
    TEXTURES[currentMode === 'flick' ? 'noteF.png' : MODE_TEXTURES[currentMode]]
  )
  floating.anchor.set(0.5, 0.5)
  floating.setTransform(x, y)
  
  switch (currentMode) {
    case 'tap':
    case 'flick':
    case 'slide':
    case 'critical':
      const [NOTE_PIVOT_X, NOTE_PIVOT_Y] = NOTE_PIVOT
      floating.pivot.set(NOTE_PIVOT_X, NOTE_PIVOT_Y)
      floating.height = NOTE_HEIGHT
      floating.width = NOTE_WIDTH * 2
      break
    case 'mid':
      const [DIAMOND_PIVOT_X, DIAMOND_PIVOT_Y] = DIAMOND_PIVOT
      floating.pivot.set(DIAMOND_PIVOT_X, DIAMOND_PIVOT_Y)
      floating.height = DIAMOND_HEIGHT
      floating.width = DIAMOND_WIDTH
  }

  floating.alpha = 0.5
  graphics.addChild(floating)
  // floating.setTransform(MARGIN + LANE_AREA_WIDTH + 3 * TEXT_MARGIN, y)
}

export function createGradientCanvas(width: number, height: number, colors: string[]) {
  const canvas = document.createElement('canvas')  
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createLinearGradient(0, 0, 0, height)

  canvas.setAttribute('width', `${width}px`)
  canvas.setAttribute('height', `${height}px`)

  colors.forEach((color, index) => {
    gradient.addColorStop(index / (color.length - 1), color)
  })

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  return canvas
}

import playheadImage from '$assets/playhead.png'
export function drawPlayhead(graphics: PIXI.Graphics, pixi, y: number) {
  graphics.clear()
  graphics.removeChildren()
  graphics.lineStyle(2, COLORS.COLOR_PLAYHEAD, 1)
  const playhead = pixi.Sprite.from(playheadImage)
  playhead.anchor.set(1, 0.5)
  playhead.setTransform(MARGIN, y)
  graphics.addChild(playhead)
  drawDashedLine(graphics, MARGIN, y, MARGIN + LANE_AREA_WIDTH, y, 2, 2)
  return 
}

function createDiamond(
  PIXI: typeof import('pixi.js'), TEXTURES: Record<string, PIXI.Texture>, x: number, y: number, critical: boolean
): PIXI.Sprite {
  const sprite = new PIXI.Sprite(TEXTURES[`notes_long_among${critical ? '_crtcl' : ''}.png`])
  sprite.x = x
  sprite.y = y
  sprite.anchor.x = 0.5 
  sprite.anchor.y = 0.5
  sprite.width = DIAMOND_WIDTH
  sprite.height = DIAMOND_HEIGHT
  return sprite
}

export function drawDiamonds(
  slide: Slide, measureHeight: number, container: PIXI.Container, PIXI: typeof import('pixi.js'), TEXTURES: Record<string, PIXI.Texture>
) {
  container.removeChildren()

  const { start, end, critical, steps } = slide

  let currentGroup: SlideNote[] = [start];
  const connectedGroups = [...steps, end]
    .reduce((acc: SlideNote[][], ele: SlideNote) => {
      currentGroup.push(ele)
      if (!('ignored' in ele) || !ele.ignored) {
        acc.push([...currentGroup])
        currentGroup = [ele]
      }
      return acc
    }, [])
    .filter((a: SlideNote[]) => a.length >= 3)

  connectedGroups
    .forEach((arr: SlideNote[]) => {
      const origin = arr.shift() as SlideStart | SlideStep
      const originX = calcMidX(origin.lane, origin.width)
      const originY = calcY(origin.tick, measureHeight)

      const target = arr.pop()
      const targetX = calcMidX(target.lane, target.width)
      const targetY = calcY(target.tick, measureHeight)

      if ('diamond' in origin && origin.diamond) {
        container.addChild(createDiamond(PIXI, TEXTURES, originX, originY, critical))
      }

      arr
        .filter((current: SlideStep) => current.diamond)
        .forEach((current) => {
          const sprite = new PIXI.Sprite(TEXTURES[`notes_long_among${critical ? '_crtcl' : ''}.png`])
          const currentY = calcY(current.tick, measureHeight)

          const a = (targetY - originY) / Math.pow(targetX - originX, 2)

          
          let currentX: number

          switch (origin.easeType) {
            case 'easeIn':
              currentX = (originX > targetX ? 1 : -1) * Math.abs(Math.sqrt((currentY - targetY) / -a)) + targetX
              break
            case 'easeOut':
              currentX = (originX > targetX ? -1 : 1) * Math.abs(Math.sqrt((currentY - originY) / a)) + originX
              break
            default:
              currentX = ((currentY - originY) / (targetY - originY)) * (targetX - originX) + originX
              break
          }
          container.addChild(createDiamond(PIXI, TEXTURES, currentX, currentY, critical))
        })
    })
}