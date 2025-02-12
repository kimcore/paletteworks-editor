<script lang="ts">
  import LL from '$i18n/i18n-svelte'
  import type { Metadata } from "$lib/score/beatmap"

  import { createEventDispatcher, tick } from "svelte"
  const dispatch = createEventDispatcher<{
    goto: void,
    undo: void,
    redo: void,
    skipstart: void,
    skipback: void,
  }>()

  // UI Components
  import Icon from '@iconify/svelte'
  import Button from "$lib/ui/Button.svelte"
  import ClickableIcon from '$lib/ui/ClickableIcon.svelte'
  import TextInput from "$lib/ui/TextInput.svelte"
  import Select from '$lib/ui/Select.svelte'
  import FileInput from '$lib/ui/FileInput.svelte'
  import Tooltip from '$lib/ui/Tooltip.svelte'
  import Tabs from '$lib/ui/Tabs.svelte'
  import TabItem from '$lib//ui/TabItem.svelte'
  import TabSelect from '$lib/ui/TabSelect.svelte'
  import TabContent from '$lib//ui/TabContent.svelte'

  import filesize from 'filesize'
  import { selectedNotes } from "$lib/editing/selection"
  import { mutationHistory } from "$lib/editing/history"

  import { KEYBOARD_SHORTCUTS } from "$lib/control/keyboard"

  import { SCROLL_MODES } from '$lib/editing/scrolling'
  import type { ScrollMode } from '$lib/editing/scrolling'

  export let currentMeasure: number
  export let statistics: Record<string, number>
  export let paused: boolean
  export let metadata: Metadata
  export let music: File | null
  export let scrollMode: ScrollMode
  export let visibility: Record<string, boolean>
  export let totalCombo: number
  export let volume: number
  export let sfxVolume: number
  export let bgmLoading: boolean
  export let musicDuration: number | undefined

  let historyDiv: HTMLDivElement
  

  $: if ($mutationHistory) {
    tick().then(() => {
      historyDiv.scrollTo(0, historyDiv.scrollHeight)
    })
  }

  $: scrollModes = SCROLL_MODES.map(mode => [mode, $LL.editor.scrollmode[mode]()]) as [ScrollMode, string][]

  function formatTime(time: number): string {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    const milliseconds = Math.floor((time % 1) * 1000)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`
  }
</script>
<div class="panel-container">
  <div class="panel">
    <h2>{$LL.editor.panel.control()}</h2>
      <div style="display: flex; gap: 0.5em;">
        <TextInput
          bind:value={currentMeasure}
        >
          <Icon icon="fontisto:hashtag" slot="head" style="flex-shrink: 0;"></Icon>
          <span style="white-space: nowrap;" slot="tail">{$LL.editor.panel.measure()}</span>
          <Button
            slot="action"
            class="action"
            icon="ph:arrow-bend-up-right-bold"
            width="1.8em"
            on:click={() => {dispatch('goto')}}
          ></Button>
        </TextInput>
      </div>
      <div style="text-align: center;">
        {musicDuration ? formatTime(musicDuration) : '--:--.---'}
      </div>
      <div class="control-buttons">
        <Tooltip
          placement="bottom"
          description={$LL.editor.panel.skipstart()}
          keys={KEYBOARD_SHORTCUTS.skipstart}
        >
          <ClickableIcon
            icon="fluent:previous-16-filled"
            width="2.5em"
            on:click={() => { dispatch('skipstart') }}
          />
        </Tooltip>
        <Tooltip
          placement="bottom"
          description={$LL.editor.panel.playpause()}
          keys={KEYBOARD_SHORTCUTS.playpause}
        >
          <ClickableIcon
            icon={paused ? 'carbon:play-filled-alt' : 'ph:pause-duotone'}
            width="4.5em"
            on:click={() => { paused = !paused }}
          />
        </Tooltip>
        <Tooltip
          placement="bottom"
          description={$LL.editor.panel.skipback()}
          keys={KEYBOARD_SHORTCUTS.skipback}
        >
          <ClickableIcon
            icon="ph:arrow-counter-clockwise-bold"
            width="2.5em"
            on:click={() => { dispatch('skipback') }}
          />
        </Tooltip>
      </div>
      <label for="scroll">
        {$LL.editor.panel.scrollmode()}
        <Select
          bind:value={scrollMode}
          options={scrollModes}
          name="scroll"
        />
      </label>
  </div>
  <div class="panel">
    <h2>{$LL.editor.panel.metadata()}</h2>
    <label>
      {$LL.editor.panel.title()}
      <input type="text" bind:value={metadata.title}>
    </label>
    <label>
      {$LL.editor.panel.artist()}
      <input type="text" bind:value={metadata.artist}>
    </label>
    <label>
      {$LL.editor.panel.author()}
      <input type="text" bind:value={metadata.author}>
    </label>
  </div>
  <div class="panel">
    <Tabs>
      <TabSelect>
        <TabItem><h2>{$LL.editor.panel.statistics()}</h2></TabItem>
        <TabItem><h2>{$LL.editor.panel.history()}</h2></TabItem>
      </TabSelect>
      <TabContent>
        <ul class="statistics">
          {#each Object.entries(statistics) as [ name, value ]}
            <li>
              <ClickableIcon
                icon={visibility[name] ? 'ic:baseline-visibility' : 'ic:baseline-visibility-off'}
                width="1.5em"
                on:click={() => {
                  visibility[name] = !visibility[name]
                  if (name === 'Total') {
                    Object.keys(visibility).forEach((key) => {
                      visibility[key] = visibility[name]
                    })
                  }
                }}
              />
              <span class="title">{name}</span><value>{value}</value>
            </li>
          {/each}
          <li><p>{$LL.editor.panel.totalcombo({ combo: totalCombo })}</p></li>
          <li><p>{$LL.editor.panel.totalselected({ selected: $selectedNotes.length })}</p></li>
        </ul>
      </TabContent>
      <TabContent class="history-tab">
        <div class="actions">
          <Tooltip
            placement="bottom"
            keys={KEYBOARD_SHORTCUTS.undo}
          > 
            <Button icon="ic:round-undo" on:click={() => dispatch('undo')} class="history-button">{$LL.editor.panel.undo()}</Button>
          </Tooltip>
          <Tooltip
            placement="bottom"
            keys={KEYBOARD_SHORTCUTS.redo}
          >
            <Button icon="ic:round-redo" on:click={() => dispatch('redo')} class="history-button">{$LL.editor.panel.redo()}</Button>
          </Tooltip>
        </div>
        <div class="history" bind:this={historyDiv}>
          {#each $mutationHistory as mutation, index}
            <span>{`#${index + 1} - ${mutation}`}</span>
          {/each}
        </div>
      </TabContent>
    </Tabs>
  </div>  
  <div class="panel">
    <h2>{$LL.editor.panel.music()}</h2>
    <label for="music">
      {$LL.editor.panel.musicfile()} {music ? filesize(music.size) : ''}
      <FileInput
        bind:file={music}
        accept="audio/*"
        name="music"
        openIcon="mdi:folder-music"
        fileIcon="mdi:file-music-outline"
        text={$LL.editor.panel.open()}
        loading={bgmLoading}
      />
    </label>
    <label>
      {$LL.editor.panel.master()}
      <input type="range" bind:value={volume} min=0 max=1 step=0.01 />
    </label>
    <label>
      {$LL.editor.panel.sfxvolume()}
      <input type="range" bind:value={sfxVolume} min=0 max=1 step=0.01 />
    </label>
  </div>
</div>

<style>
ul.statistics {
  width: auto;
  margin: 0 auto;
  padding: 0.5em;
  display: flex;
  flex-direction: column;
  list-style-type: none;
}

ul.statistics li {
  display: flex;
  gap: 1em;
}

ul .title {
  font-weight: bold;
  display: block;
  width: 5em;
}

.panel-container {
  display: grid;
  grid-template: repeat(2, 1fr) / repeat(2, 1fr);
  height: 100vh;
  padding: 0.85em;
  gap: 0.65em 0.85em;
  overflow-y: auto;
  overflow-x: hidden;
}

@media (max-width: 1280px) {
  .panel-container {
    grid-template: repeat(4, 1fr) / repeat(1, 1fr);
  }
}

.panel {
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 1px 1px 5px rgba(0, 0, 0, 0.5);
  border-radius: 0.5em;
  display: flex;
  flex-direction: column;
  gap: 1em;
  padding: 1em 1.5em;
  justify-content: start;
}

h2 {
  margin: 0;
}

label {
  display: grid;
}

.history {
  display: flex;
  flex-direction: column;

  overflow-y: scroll;
  height: 100%;
  max-height: 100%;
  flex-grow: 1;
}

:global(.history-tab) {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 1em;
}

:global(.history-tab) > .actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1em;
  font-size: 0.75em;
}

:global(.history-tab) :global(.history-button) {
  border-radius: 0.5em;
}

.control-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5em;
}
</style>