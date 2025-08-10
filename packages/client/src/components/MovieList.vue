<template>
  <div class="movie-list">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Searching for movies...</p>
    </div>

    <div v-else-if="movies.length === 0" class="empty-state">
      <p>🎬 Start typing to search for movies</p>
    </div>

    <div v-else class="results">
      <p class="results-count">Found {{ movies.length }} movies</p>
      <div class="movies-grid">
        <MovieCard v-for="movie in movies" :key="movie.id" :movie="movie" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Movie } from '@vidsrc-wrapper/data';
import MovieCard from './MovieCard.vue';

defineProps<{
  movies: Movie[];
  loading: boolean;
}>();
</script>

<style scoped>
.movie-list {
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

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: white;
  opacity: 0.8;
  font-size: 1.2rem;
}

.results-count {
  text-align: center;
  color: white;
  margin-bottom: 2rem;
  font-size: 1.1rem;
  opacity: 0.9;
}

.movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 0 1rem;
}

@media (max-width: 768px) {
  .movies-grid {
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
