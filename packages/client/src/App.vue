<template>
  <div class="app">
    <header class="header">
      <h1>🎬 Movie Search</h1>
      <p>Search movies using The Movie Database</p>
    </header>

    <main class="main">
      <SearchForm @search="handleSearch" :loading="loading" />
      <MovieList :movies="movies" :loading="loading" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Movie } from '@vidsrc-wrapper/data';
import SearchForm from './components/SearchForm.vue';
import MovieList from './components/MovieList.vue';

const movies = ref<Movie[]>([]);
const loading = ref(false);

const handleSearch = async (query: string) => {
  if (!query.trim()) {
    movies.value = [];
    return;
  }

  loading.value = true;
  try {
    const response = await fetch(
      `/api/movies?query=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    movies.value = data;
  } catch (error) {
    // might want some better logging here
    // eslint-disable-next-line no-console
    console.error('Error searching movies:', error);
    movies.value = [];
  } finally {
    loading.value = false;
  }
};
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
