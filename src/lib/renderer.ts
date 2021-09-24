// Types
import type { Graphics } from 'pixi.js' 
import type { BPM, SlideEnd, SlideStart, SlideStep } from '$lib/beatmap'

// Consts
import COLORS from '$lib/colors'
import {
  BEAT_IN_BAR,
  MARGIN_BOTTOM,
  LANE_WIDTH,
  LANE_COUNT,
  LANE_AREA_WIDTH,
  TEXT_MARGIN,
  MARGIN,
} from '$lib/consts'
import { calcX, calcY } from '$lib/timing'
import type { Mode } from '$lib/modes'

// Drawing Functions
export function drawDashedLine(graphics: Graphics, toX: number, toY: number, dash: number = 10, gap: number = 8) {
  const lastPosition = graphics.currentPath.points;

  const currentPosition = {
    x: lastPosition[lastPosition.length - 2] || 0,
    y: lastPosition[lastPosition.length - 1] || 0
  };

  const absValues = {
    toX: Math.abs(toX),
    toY: Math.abs(toY)
  };

  for (
    ;
    Math.abs(currentPosition.x) < absValues.toX ||
    Math.abs(currentPosition.y) < absValues.toY;
  ) {
    currentPosition.x =
      Math.abs(currentPosition.x + dash) < absValues.toX
        ? currentPosition.x + dash
        : toX;
    currentPosition.y =
      Math.abs(currentPosition.y + dash) < absValues.toY
        ? currentPosition.y + dash
        : toY;

    graphics.lineTo(currentPosition.x, currentPosition.y);

    currentPosition.x =
      Math.abs(currentPosition.x + gap) < absValues.toX
        ? currentPosition.x + gap
        : toX;
    currentPosition.y =
      Math.abs(currentPosition.y + gap) < absValues.toY
        ? currentPosition.y + gap
        : toY;

    graphics.moveTo(currentPosition.x, currentPosition.y);
  }
}

export function drawBackground(graphics: Graphics, measureHeight: number, fullHeight: number, maxMeasure: number) {   
  graphics.clear()
  
  // Draw lanes
  for (let i = 0; i < LANE_COUNT + 1; i++) {
    const x = i * LANE_WIDTH
    if (i <= 1 || i >= LANE_COUNT + 1 - 2) {
      continue
    }
    if (i % 2 == 0) {
      graphics.lineStyle(2, COLORS.COLOR_LANE_PRIMARY, 1, 0.5)
    } else {
      graphics.lineStyle(1, COLORS.COLOR_LANE_SECONDARY, 1, 0.5)
    }
    graphics.moveTo(x, innerHeight)
    graphics.lineTo(x, -fullHeight)
  }

  // Draw bars
  for (let i = 0; i < (maxMeasure + 2) * 3 + 2 ; i++) {
    const y = innerHeight - (MARGIN_BOTTOM + i * measureHeight / BEAT_IN_BAR)

    if (i % BEAT_IN_BAR == 0) {
      graphics.lineStyle(2, COLORS.COLOR_BAR_PRIMARY, 1, 0.5)
      graphics.moveTo(LANE_WIDTH, y)
      graphics.lineTo(LANE_AREA_WIDTH - LANE_WIDTH, y)
    } else {
      graphics.lineStyle(1, COLORS.COLOR_BAR_SECONDARY, 1, 0.5)
      graphics.moveTo(LANE_WIDTH + LANE_WIDTH, y)
      graphics.lineTo(LANE_AREA_WIDTH - 2 * LANE_WIDTH, y)
    }
  }
}


const EASE_RATIOS = {
  curved: 0.5,
  straight: 0
}
const SHRINK_WIDTH = LANE_WIDTH / 8
type SlideNode = SlideStart | SlideStep | SlideEnd
export function drawSlidePath(graphics: Graphics, slideNotes: SlideNode[], critical: boolean, measureHeight: number) {
  graphics.clear()
  slideNotes
  .reduce((acc: [SlideNode, SlideNode][], ele: SlideNode, ind: number, arr: SlideNode[]) => {
      if (ind < arr.length - 1) {
        acc.push([arr[ind], arr[ind + 1]])
      }
      return acc
    }, [] as [SlideNode, SlideNode][])
    .forEach(([origin, target]) => {
      const easeInRatio = 'easeType' in origin && origin.easeType === 'easeIn' ? 0.5 : 0
      const easeOutRatio = 'easeType' in origin && origin.easeType === 'easeOut' ? 0.5 : 0

      const origin_x_left = calcX(origin.lane) + SHRINK_WIDTH
      const origin_x_right = calcX(origin.lane) + origin.width * LANE_WIDTH - SHRINK_WIDTH
      const origin_y = calcY(origin.tick, measureHeight) 
      
      const target_x_left = calcX(target.lane) + SHRINK_WIDTH
      const target_x_right = calcX(target.lane) + target.width * LANE_WIDTH - SHRINK_WIDTH
      const target_y = calcY(target.tick, measureHeight)

      graphics.beginFill(critical ? COLORS.COLOR_SLIDE_PATH : COLORS.COLOR_SLIDE_PATH_CRITICAL, COLORS.ALPHA_SLIDE_PATH)
      graphics.moveTo(origin_x_left, origin_y)
      graphics.bezierCurveTo(origin_x_left, origin_y - (origin_y - target_y) * easeInRatio, target_x_left, target_y + (origin_y - target_y) * easeOutRatio, target_x_left, target_y)
      // graphics.moveTo(target_x_left, target_y)
      graphics.lineTo(target_x_right, target_y)
      graphics.bezierCurveTo(target_x_right, target_y + (origin_y - target_y) * easeOutRatio, origin_x_right, origin_y - (origin_y - target_y) * easeInRatio, origin_x_right, origin_y)
      graphics.closePath()
      graphics.endFill()
      // graphics.lineTo(origin_x_right, origin_y)
      // graphics.moveTo(origin_x_right, origin_y)
    })    
}

const BPMTexts = new Map<number, PIXI.Text>()
export function drawBPMs(graphics: PIXI.Graphics, pixi, bpms: Map<number, number>, measureHeight: number) {
  graphics.clear()
  graphics.lineStyle(1, COLORS.COLOR_BPM, 1)

  // (Deleted) Destroy child if child are in BPMTexts but not in bpms
  BPMTexts.forEach((text, tick) => {
    if (!bpms.has(tick)) {
      graphics.removeChild(text)
    }
  })

  // Draw BPMs
  bpms.forEach((bpm, tick) => {
    const newY = calcY(tick, measureHeight)

    // Draw BPM LINES
    graphics.moveTo(LANE_WIDTH, newY)
    graphics.lineTo(LANE_AREA_WIDTH - LANE_WIDTH, newY)

    // Draw BPM Texts
    const text: PIXI.Text = BPMTexts.has(tick) ? BPMTexts.get(tick) : graphics.addChild(new pixi.Text(`${bpm} BPM`, {
      fill: COLORS.COLOR_BPM,
      fontSize: 20
    }))
    text.anchor.set(0.5, 0.5)

    text.setTransform(MARGIN + LANE_AREA_WIDTH + 3 * TEXT_MARGIN, newY)
    BPMTexts.set(tick, text)
  })
}

  // (Deleted) Destroy child if child are in BPMTexts but not in bpms
  BPMTexts.forEach((text, tick) => {
    if (!bpms.has(tick)) {
      graphics.removeChild(text)
    }
  })
}
