<template>
  <div class="movie-card">
    <div class="poster-container">
      <img
        v-if="movie.poster_path"
        :src="posterUrl"
        :alt="movie.title"
        class="poster"
        loading="lazy"
        @error="handleImageError"
      />
      <div v-else class="poster-placeholder">
        <span>🎬</span>
        <p>No Image</p>
      </div>
    </div>

    <div class="content">
      <h3 class="title">{{ movie.title }}</h3>

      <div class="meta">
        <span v-if="movie.release_date" class="year">
          {{ new Date(movie.release_date).getFullYear() }}
        </span>
        <span v-if="movie.vote_average > 0" class="rating">
          ⭐ {{ movie.vote_average.toFixed(1) }}
        </span>
      </div>

      <p v-if="movie.overview" class="overview">
        {{ truncatedOverview }}
      </p>
      <p v-else class="no-overview">No description available</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Movie } from '@vidsrc-wrapper/data';

const props = defineProps<{
  movie: Movie;
}>();

const imageError = ref(false);

const posterUrl = computed(() => {
  if (!props.movie.poster_path || imageError.value) return '';
  return `https://image.tmdb.org/t/p/w500${props.movie.poster_path}`;
});

const truncatedOverview = computed(() => {
  if (!props.movie.overview) return '';
  return props.movie.overview.length > 150
    ? props.movie.overview.slice(0, 150) + '...'
    : props.movie.overview;
});

const handleImageError = () => {
  imageError.value = true;
};
</script>

<style scoped>
.movie-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.movie-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.poster-container {
  aspect-ratio: 2/3;
  overflow: hidden;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.poster {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.poster-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 3rem;
}

.poster-placeholder p {
  margin: 0.5rem 0 0 0;
  font-size: 0.9rem;
}

.content {
  padding: 1.25rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: #333;
  line-height: 1.3;
}

.meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.year {
  color: #666;
  font-weight: 500;
}

.rating {
  color: #ff6b6b;
  font-weight: 600;
}

.overview {
  font-size: 0.9rem;
  line-height: 1.5;
  color: #555;
  margin: 0;
  flex-grow: 1;
}

.no-overview {
  font-size: 0.9rem;
  color: #999;
  font-style: italic;
  margin: 0;
}

@media (max-width: 768px) {
  .content {
    padding: 1rem;
  }

  .title {
    font-size: 1rem;
  }

  .overview {
    font-size: 0.85rem;
  }
}
</style>
