<template>
  <div class="detail" v-if="state === 'loaded'">
    <div class="hero" :style="bgStyle"></div>
    <div class="card">
      <img v-if="movie" :src="posterUrl" :alt="movie?.title" class="poster" />
      <div class="info">
        <h2>{{ movie?.title }}</h2>
        <p class="meta">
          <span v-if="movie?.release_date">{{
            new Date(movie.release_date).toLocaleDateString()
          }}</span>
          <span v-if="movie?.vote_average"
            >· ⭐ {{ movie.vote_average.toFixed(1) }}</span
          >
        </p>
        <p class="overview" v-if="movie?.overview">{{ movie.overview }}</p>
        <p v-else class="no-overview">No description available.</p>
      </div>
    </div>

    <div class="player-wrapper" v-if="embedUrl">
      <iframe
        class="player"
        :src="embedUrl"
        frameborder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowfullscreen
        referrerpolicy="no-referrer"
      ></iframe>
    </div>
  </div>

  <div v-else-if="state === 'loading'" class="loading">Loading...</div>
  <div v-else class="error">Failed to load movie.</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { Movie } from '@vidsrc-wrapper/data';

type State = 'idle' | 'loading' | 'loaded' | 'error';

const route = useRoute();
const movie = ref<Movie>();
const state = ref<State>('idle');

const baseUrl = 'https://vidsrc.xyz/embed/movie/';
const embedUrl = ref<string>('');

const posterUrl = computed(() =>
  movie.value?.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.value.poster_path}`
    : ''
);

const bgStyle = computed(() => ({
  backgroundImage: movie.value?.backdrop_path
    ? `linear-gradient(rgba(0,0,0,.5), rgba(0,0,0,.7)), url(https://image.tmdb.org/t/p/w780${movie.value.backdrop_path})`
    : 'none',
}));

const load = async () => {
  const idParam = route.params.id as string;
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) {
    state.value = 'error';
    return;
  }
  state.value = 'loading';
  try {
    const { getHttpClient } = await import('@vidsrc-wrapper/data');
    movie.value = await getHttpClient().getJson(`/api/movies/${id}`);
    embedUrl.value = `${baseUrl}${id}`;
    state.value = 'loaded';
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    state.value = 'error';
  }
};

onMounted(load);
</script>

<style scoped>
.loading,
.error {
  color: #fff;
  text-align: center;
  padding: 2rem;
}
.back {
  margin: 0 0 1rem 0;
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.5);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
}
.detail {
  position: relative;
}
.hero {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  filter: blur(8px);
  opacity: 0.6;
}
.card {
  position: relative;
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1.5rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 1rem;
}
.poster {
  width: 100%;
  border-radius: 8px;
}
.info {
  display: flex;
  flex-direction: column;
}
.meta {
  color: #666;
  margin: 0.25rem 0 1rem;
}
.overview {
  color: #333;
  line-height: 1.6;
}
.no-overview {
  color: #777;
  font-style: italic;
}
.player-wrapper {
  position: relative;
  margin-top: 1rem;
  width: 100%;
  padding-top: 56.25%; /* 16:9 */
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}
.player {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  background: #000;
}

@media (max-width: 768px) {
  .card {
    grid-template-columns: 1fr;
  }
}
</style>
