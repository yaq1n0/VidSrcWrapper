<template>
  <div class="show-list">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Searching for shows...</p>
    </div>

    <div v-else class="results" aria-live="polite">
      <p class="results-count">
        <template v-if="shows.length > 0">
          Found {{ shows.length }} shows
        </template>
        <template v-else>No shows found</template>
      </p>
      <div class="shows-grid">
        <ShowCard v-for="show in shows" :key="show.id" :show="show" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TV } from 'tmdb-ts';
import ShowCard from './ShowCard.vue';

defineProps<{
  shows: TV[];
  loading: boolean;
}>();
</script>

<style scoped>
.show-list {
  width: 100%;
}
.loading {
  text-align: center;
  padding: 4rem 2rem;
  color: white;
}
.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  margin: 0 auto 1rem;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.results-count {
  text-align: center;
  color: white;
  margin-bottom: 2rem;
  font-size: 1.1rem;
  opacity: 0.9;
}
.shows-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 0 1rem;
}
@media (max-width: 768px) {
  .shows-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
    padding: 0;
  }
  .empty-state {
    font-size: 1rem;
    padding: 3rem 1rem;
  }
}
</style>
