<template>
  <div>
    <div class="mode-toggle" role="tablist" aria-label="Content type">
      <button
        role="tab"
        :aria-selected="mode === 'movies'"
        class="mode-btn"
        :class="{ active: mode === 'movies' }"
        @click="setMode('movies')"
      >
        Movies
      </button>
      <button
        role="tab"
        :aria-selected="mode === 'tv'"
        class="mode-btn"
        :class="{ active: mode === 'tv' }"
        @click="setMode('tv')"
      >
        Shows
      </button>
    </div>

    <SearchForm
      @search="handleSearch"
      :loading="loading"
      :placeholder="
        mode === 'movies' ? 'Search for movies...' : 'Search for shows...'
      "
    />

    <MovieList v-if="mode === 'movies'" :movies="movies" :loading="loading" />
    <ShowList v-else :shows="shows" :loading="loading" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Movie, TV as Show } from 'tmdb-ts';
import SearchForm from '../components/SearchForm.vue';
import MovieList from '../components/MovieList.vue';
import ShowList from '../components/ShowList.vue';

type Mode = 'movies' | 'tv';
const mode = ref<Mode>('movies');
const movies = ref<Movie[]>([]);
const shows = ref<Show[]>([]);
const loading = ref(false);

const setMode = (next: Mode) => {
  if (mode.value === next) return;
  mode.value = next;
  movies.value = [];
  shows.value = [];
};

const handleSearch = async (query: string) => {
  const trimmed = query.trim();
  if (!trimmed) {
    movies.value = [];
    shows.value = [];
    return;
  }

  loading.value = true;
  try {
    const endpoint = mode.value === 'movies' ? '/api/movies' : '/api/tv';
    const url = `${endpoint}?query=${encodeURIComponent(trimmed)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (mode.value === 'movies') {
      movies.value = data;
    } else {
      shows.value = data;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error searching:', error);
    movies.value = [];
    shows.value = [];
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.mode-toggle {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.mode-btn {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.4);
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  cursor: pointer;
}
.mode-btn.active {
  background: #ff6b6b;
  border-color: #ff6b6b;
}
</style>
