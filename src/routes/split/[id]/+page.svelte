<script>
  import { page } from '$app/stores'
  import { onMount } from 'svelte';

  import '$lib/styles/split.scss';
  import { Pause, Play, Timer, TimerReset, Save } from 'lucide-svelte';

  let data;
  let splits = [];
  let current_split = 0;
  let timer;
  let time = 0;
  let ms = 0,
      sec = 0,
      min = 0;
  let finished = false;
  let id;
  
  $: milliseconds = ms.toString().padStart(3, "0").substring(0,2);
  $: seconds = sec.toString().padStart(2, "0");
  $: minutes = min.toString().padStart(2, "0");

  onMount(async () => {
    const response = await fetch(`../api/get_splits?id=${$page.params.id}`)
    data = await response.json()
    splits = Array.from(data.splits)

    id = $page.params.id
  })

  let running = false;
  function start() {
    timer = setInterval(() => {
      ms += 10
      time += 10

      if (ms >= 1000) {
        ms = 0;
        sec++
      }
      if (sec >= 60) {
        sec = 0;
        min++
      }
    }, 10)
    running = true;
  }

  function pause() {
    clearInterval(timer);
    running = false;
  }
  
  function split() {
    splits[current_split].time = `${minutes}:${seconds}.${milliseconds}`
    splits[current_split].end_ms = time
    splits[current_split].checked = true
    current_split++

    if (current_split >= splits.length) {
      pause()
      finished = true
    } else {
      splits[current_split].start_ms = time
    }
  }

  function reset() {
    clearInterval(timer);
    location.reload()
  }

  let light = false;
  function toggleLight() { 
    if (light) {
      splits[lastLightItem()].checked = true
      splits[lastLightItem()].time += ` - ${minutes}:${seconds}.${milliseconds}`
      splits[lastLightItem()].end_ms = time
      light = false;
    } else {
      light = `${minutes}:${seconds}.${milliseconds}`

      let new_splits = Array.from(splits)
      new_splits.splice(current_split, 0, {
        trip_id: data.trip_id,
        title: "Red Light",
        type: "light",
        time: `${minutes}:${seconds}.${milliseconds}`,
        start_ms: time,
        checked: false
      })

      splits = new_splits;

      current_split++
    }
  }
  function lastLightItem() {
    for (let i = splits.length - 1; i >= 0; i--) {
      if (splits[i].type === "light") {
        return i
      }
    }
    return null; // Return null if no matching item is found
  }

  async function save() {
    console.log(id)
    const response = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        splits,
        id
      }),
    })
  }
</script>

<main class="split-main">
  {#if data}
    <header>
      <h1>{data.title}</h1>
      <h2 class={light ? "light" : ""}>{minutes}:{seconds}<span class="milliseconds">.{milliseconds}</span></h2>
    </header>
    <div class="buttons">
      <div class="buttons-left">
        {#if running}
          <button on:click={toggleLight}>
            {#if light}
              <img src="/assets/light_green.svg" alt="green light"/>
            {:else}
              <img src="/assets/light_red.svg" alt="red light"/>
            {/if}
          </button>
        {:else if finished}
          <button on:click={save}>
            <Save/>
            Save
          </button>
        {:else}
          <button on:click={start}>
            <Play/>
            Start
          </button>
        {/if}
        <button on:click={pause} class={running ? "" : "hidden"} disabled={!running}>
          <Pause/>
        </button>
      </div>
      {#if running}
        <button on:click={split}>      
          <Timer/>
          Split
        </button>
      {:else}
        <button on:click={reset}>
          <TimerReset/>
          Reset   
        </button>
      {/if}
    </div>
    <div class="splits">
      {#each splits as split, i}
        <div class={split.checked ? `${split.type} split checked` : `${split.type} split`}>
          {#if split.type == 'light'}
            <h3>{split.title}</h3>
            {#if split.checked}
              <p>{split.time}</p>
            {:else}
              <p>{split.time} - {minutes}:{seconds}.{milliseconds}</p>
            {/if}
          {:else}
            <h3>{split.title}</h3>
            {#if i == current_split}
              <p>{minutes}:{seconds}.{milliseconds}</p>
            {:else}
              <p>{split.time}</p>
            {/if}
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</main>