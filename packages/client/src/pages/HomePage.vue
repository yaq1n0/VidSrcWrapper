<template>
  <div>
    <SearchForm @search="handleSearch" :loading="loading" />
    <MovieList :movies="movies" :loading="loading" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Movie } from '@vidsrc-wrapper/data';
import SearchForm from '../components/SearchForm.vue';
import MovieList from '../components/MovieList.vue';

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
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    movies.value = data;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error searching movies:', error);
    movies.value = [];
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped></style>
