<template>
  <div
    class="show-card"
    @click="goToDetail"
    role="button"
    tabindex="0"
    @keydown.enter="goToDetail"
  >
    <div class="poster-container">
      <img
        v-if="show.poster_path"
        :src="posterUrl"
        :alt="show.name"
        class="poster"
        loading="lazy"
        @error="handleImageError"
      />
      <div v-else class="poster-placeholder">
        <span>📺</span>
        <p>No Image</p>
      </div>
    </div>

    <div class="content">
      <h3 class="title">{{ show.name }}</h3>

      <div class="meta">
        <span v-if="show.first_air_date" class="year">
          {{ new Date(show.first_air_date).getFullYear() }}
        </span>
        <span v-if="show.vote_average > 0" class="rating">
          ⭐ {{ show.vote_average.toFixed(1) }}
        </span>
      </div>

      <p v-if="show.overview" class="overview">
        {{ truncatedOverview }}
      </p>
      <p v-else class="no-overview">No description available</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { Show } from '@vidsrc-wrapper/data';

const props = defineProps<{ show: Show }>();

const imageError = ref(false);
const router = useRouter();

const posterUrl = computed(() => {
  if (!props.show.poster_path || imageError.value) return '';
  return `https://image.tmdb.org/t/p/w500${props.show.poster_path}`;
});

const truncatedOverview = computed(() => {
  if (!props.show.overview) return '';
  return props.show.overview.length > 150
    ? props.show.overview.slice(0, 150) + '...'
    : props.show.overview;
});

const handleImageError = () => {
  imageError.value = true;
};

const goToDetail = () => {
  router.push({ name: 'tv-detail', params: { id: props.show.id } });
};
</script>

<style scoped>
.show-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}
.show-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
}
.poster-container {
  position: relative;
  background: #eee;
  aspect-ratio: 2/3;
}
.poster {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.poster-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  flex-direction: column;
  gap: 0.5rem;
}
.content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.title {
  margin: 0;
  font-size: 1.1rem;
  line-height: 1.4;
  color: #222;
}
.meta {
  color: #666;
  font-size: 0.9rem;
  display: flex;
  gap: 0.5rem;
}
.overview {
  color: #444;
  font-size: 0.95rem;
  line-height: 1.5;
}
.no-overview {
  color: #777;
  font-style: italic;
}
</style>
