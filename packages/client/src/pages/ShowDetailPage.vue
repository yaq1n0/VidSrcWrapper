<template>
  <div class="detail" v-if="state === 'loaded'">
    <div class="hero" :style="bgStyle"></div>
    <div class="card">
      <img v-if="show" :src="posterUrl" :alt="show?.name" class="poster" />
      <div class="info">
        <h2>{{ show?.name }}</h2>
        <p class="meta">
          <span v-if="show?.first_air_date">{{
            new Date(show.first_air_date).toLocaleDateString()
          }}</span>
          <span v-if="show?.vote_average"
            >· ⭐ {{ show.vote_average.toFixed(1) }}</span
          >
        </p>
        <p class="overview" v-if="show?.overview">{{ show.overview }}</p>
        <p v-else class="no-overview">No description available.</p>
      </div>
    </div>

    <div class="seasons" v-if="show?.seasons?.length">
      <h3>Seasons</h3>
      <div class="seasons-grid">
        <button
          class="season-card"
          v-for="s in show.seasons"
          :key="s.season_number"
          type="button"
          @click="selectSeason(s.season_number)"
          :class="{ active: selectedSeason === s.season_number }"
        >
          <div class="season-thumb">
            <img
              v-if="s.poster_path"
              :src="`https://image.tmdb.org/t/p/w342${s.poster_path}`"
              :alt="s.name"
            />
            <div v-else class="season-placeholder">S{{ s.season_number }}</div>
          </div>
          <div class="season-info">
            <strong>{{ s.name }}</strong>
            <span>{{ s.episode_count }} episodes</span>
            <span v-if="s.air_date"
              >· {{ new Date(s.air_date).getFullYear() }}</span
            >
          </div>
        </button>
      </div>
    </div>

    <div class="episodes" v-if="episodes.length">
      <h3>Season {{ selectedSeason }} Episodes</h3>

      <div v-if="selectedEpisode" class="episode-selected">
        <strong
          >{{ selectedEpisode.episode_number }}.
          {{ selectedEpisode.name }}</strong
        >
        <small v-if="selectedEpisode.air_date">{{
          ` ${new Date(selectedEpisode.air_date).toLocaleDateString()}`
        }}</small>
        <p v-if="selectedEpisode.overview">{{ selectedEpisode.overview }}</p>
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

      <div class="episodes-grid">
        <div
          class="episode-card"
          v-for="episode in episodes"
          :key="episode.id"
          :class="{ selected: selectedEpisode?.id === episode.id }"
          @click="selectEpisode(episode)"
          role="button"
          tabindex="0"
          @keydown.enter="selectEpisode(episode)"
        >
          <div class="episode-thumb">
            <img
              v-if="episode.still_path"
              :src="`https://image.tmdb.org/t/p/w300${episode.still_path}`"
              :alt="episode.name"
            />
            <div v-else class="episode-placeholder">
              {{ episode.episode_number }}
            </div>
          </div>
          <div class="episode-info">
            <strong>{{ episode.episode_number }}. {{ episode.name }}</strong>
            <small v-if="episode.air_date">{{
              new Date(episode.air_date).toLocaleDateString()
            }}</small>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="state === 'loading'" class="loading">Loading...</div>
  <div v-else class="error">Failed to load show.</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { ShowDetails, Episode } from '@vidsrc-wrapper/data';

type State = 'idle' | 'loading' | 'loaded' | 'error';

const route = useRoute();
const router = useRouter();
const show = ref<ShowDetails>();
const state = ref<State>('idle');
const selectedSeason = ref<number | null>(null);
const episodes = ref<Episode[]>([]);
const selectedEpisode = ref<Episode | null>(null);

const baseUrl = 'https://vidsrc.xyz/embed/tv/';
const embedUrl = ref<string>('');

const posterUrl = computed(() =>
  show.value?.poster_path
    ? `https://image.tmdb.org/t/p/w500${show.value.poster_path}`
    : ''
);

const bgStyle = computed(() => ({
  backgroundImage: show.value?.backdrop_path
    ? `linear-gradient(rgba(0,0,0,.5), rgba(0,0,0,.7)), url(https://image.tmdb.org/t/p/w780${show.value.backdrop_path})`
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
    show.value = await getHttpClient().getJson(`/api/tv/${id}`);
    // pick first season with episodes by default
    const urlSeason = Number(route.query.season as string);
    const hasUrlSeason = Number.isFinite(urlSeason) && urlSeason > 0;
    const initial = hasUrlSeason
      ? urlSeason
      : (show.value?.seasons?.find(s => s.episode_count > 0)?.season_number ??
        null);
    selectedSeason.value = initial;
    episodes.value = [];
    selectedEpisode.value = null;
    if (initial !== null) await fetchEpisodes(id, initial);
    // If we computed an initial season, reflect it in the URL if not present
    if (!hasUrlSeason && initial !== null) {
      router.replace({
        query: { ...route.query, season: String(initial) },
      });
    }
    // If URL has an episode query, try to select it once episodes are loaded
    const urlEpisode = Number(route.query.episode as string);
    if (Number.isFinite(urlEpisode) && urlEpisode > 0) {
      const match = episodes.value.find(e => e.episode_number === urlEpisode);
      if (match) selectedEpisode.value = match;
    }
    if (selectedSeason.value && selectedEpisode.value) {
      embedUrl.value = `${baseUrl}${id}/${selectedSeason.value}-${selectedEpisode.value.episode_number}`;
    }
    state.value = 'loaded';
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    state.value = 'error';
  }
};

async function fetchEpisodes(id: number, seasonNumber: number) {
  const { getHttpClient } = await import('@vidsrc-wrapper/data');
  episodes.value = await getHttpClient().getJson(
    `/api/tv/${id}/season/${seasonNumber}`
  );
  selectedEpisode.value = null;
}

function selectSeason(seasonNumber: number) {
  if (!show.value) return;
  selectedSeason.value = seasonNumber;
  // Swallow fetch errors; page already shows error state on initial load
  fetchEpisodes(show.value.id, seasonNumber).catch(() => {});
  router.replace({
    query: { ...route.query, season: String(seasonNumber), episode: undefined },
  });
}

function selectEpisode(e: Episode) {
  selectedEpisode.value = e;
  router.replace({
    query: { ...route.query, episode: String(e.episode_number) },
  });
}

onMounted(load);
watch(
  () => [route.params.id, route.query.season, route.query.episode],
  async () => {
    // Handle back/forward navigation updating the query params
    if (!show.value) return;
    const id = Number(route.params.id as string);
    const seasonFromUrl = Number(route.query.season as string);
    const episodeFromUrl = Number(route.query.episode as string);
    const validSeason = Number.isFinite(seasonFromUrl) && seasonFromUrl > 0;
    const validEpisode = Number.isFinite(episodeFromUrl) && episodeFromUrl > 0;

    if (validSeason && selectedSeason.value !== seasonFromUrl) {
      selectedSeason.value = seasonFromUrl;
      await fetchEpisodes(id, seasonFromUrl);
    }
    if (validEpisode) {
      const match = episodes.value.find(
        e => e.episode_number === episodeFromUrl
      );
      selectedEpisode.value = match || null;
    }
  }
);
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
  z-index: 1;
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
.seasons {
  margin-top: 1rem;
  position: relative;
  z-index: 1;
}
.seasons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 0.75rem;
}
.season-card {
  background: rgba(255, 255, 255, 0.9);
  border: 0;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 0.5rem;
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 0.5rem;
  text-align: left;
  cursor: pointer;
}
.season-card.active {
  outline: 2px solid #ff6b6b;
}
.season-thumb {
  width: 80px;
  height: 120px;
  background: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
}
.season-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.season-placeholder {
  color: #666;
  font-weight: 700;
  font-size: 1.2rem;
}
.season-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: #333;
}
.episodes {
  margin-top: 1rem;
  position: relative;
  z-index: 1;
}
.episodes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
}
.episode-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: grid;
  grid-template-columns: 120px 1fr;
  cursor: pointer;
}
.episode-thumb {
  width: 120px;
  height: 90px;
  background: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
}
.episode-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.episode-placeholder {
  color: #666;
  font-weight: 700;
}
.episode-info {
  padding: 0.5rem 0.75rem;
  color: #333;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.episode-card.selected {
  outline: 2px solid #ff6b6b;
}
.episode-selected {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
}
.hero {
  z-index: 0;
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
  .episodes-grid {
    grid-template-columns: 1fr;
  }
}
</style>
