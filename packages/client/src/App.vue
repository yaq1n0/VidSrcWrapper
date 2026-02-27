<template>
  <div class="app">
    <header class="header">
      <h1>🎬 VidSrcWrapper</h1>
      <p>Search and watch movies and shows, locally hosted (ish)!</p>
    </header>

    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

// Known message shapes sent upward by the VidSrc/cloudnestra postMessage relay.
// Anything outside this set is unexpected and gets logged for visibility.
const KNOWN_EMBED_TYPES = new Set(['PLAYER_EVENT']);

function handleEmbedMessage(event: MessageEvent) {
  const data = event.data;
  if (data && typeof data === 'object' && KNOWN_EMBED_TYPES.has(data.type)) {
    return; // expected player event — ignore silently
  }
  // eslint-disable-next-line no-console
  console.warn('[embed] unexpected postMessage from', event.origin, ':', data);
}

onMounted(() => window.addEventListener('message', handleEmbedMessage));
onUnmounted(() => window.removeEventListener('message', handleEmbedMessage));
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 1rem;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
  color: white;
}

.header h1 {
  font-size: 3rem;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
}

.header p {
  font-size: 1.2rem;
  margin: 0;
  opacity: 0.9;
}

.main {
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .header h1 {
    font-size: 2rem;
  }

  .header p {
    font-size: 1rem;
  }

  .app {
    padding: 1rem 0.5rem;
  }
}
</style>
