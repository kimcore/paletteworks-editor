<script lang="ts">
  import skillPNG from '$assets/skill.png'

  // Functions
  import { position, PositionManager } from '$lib/position'
  import { getContext } from 'svelte'

  // Types
  import type PIXI from 'pixi.js'

  // Contexts
  const PIXI = getContext<typeof import('pixi.js')>('PIXI')
  const mainContainer = getContext<PIXI.Container>('mainContainer')

  // Constants
  import { LANE_AREA_WIDTH, MARGIN } from '$lib/consts'
  const SKILL_GAP = 5
  const TEXTURE = PIXI.Texture.from(skillPNG)

  // Props
  export let skills: Set<number>

  // Variables
  let skillSprites: Map<number, PIXI.Sprite> = new Map()

  $: skills && drawSkills(skills, $position)

  function drawSkills(skills: Set<number>, position: PositionManager) {
    [...skillSprites.entries()].forEach(([skill, sprite]) => {
      if (!skills.has(skill)) {
        mainContainer.removeChild(sprite)
        skillSprites.delete(skill)
      }
    })

    skills.forEach((skill) => {
      const sprite = skillSprites.get(skill) ?? skillSprites.set(skill, new PIXI.Sprite(TEXTURE)).get(skill)!
      sprite.scale.set(0.5)
      sprite.anchor.set(0, 0.5)
      sprite.x = MARGIN + LANE_AREA_WIDTH + SKILL_GAP
      sprite.y = position.calcY(skill)
      mainContainer.addChild(sprite)
    })
  }
</script>
