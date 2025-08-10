<template>
  <div class="search-form">
    <form @submit.prevent="handleSubmit" class="form">
      <div class="input-group">
        <input
          v-model="query"
          type="text"
          :placeholder="placeholder || 'Search for movies...'"
          class="search-input"
          :disabled="loading"
          ref="searchInput"
        />
        <button
          type="submit"
          class="search-button"
          :disabled="loading || !query.trim()"
        >
          <span v-if="loading">🔄</span>
          <span v-else>🔍</span>
          {{ loading ? 'Searching...' : 'Search' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

defineProps<{
  loading: boolean;
  placeholder?: string;
}>();

const emit = defineEmits<{
  search: [query: string];
}>();

const query = ref('');
const searchInput = ref<HTMLInputElement>();

const handleSubmit = () => {
  const trimmedQuery = query.value.trim();
  if (trimmedQuery) {
    emit('search', trimmedQuery);
  }
};

onMounted(() => {
  searchInput.value?.focus();
});
</script>

<style scoped>
.search-form {
  margin-bottom: 2rem;
}

.form {
  width: 100%;
}

.input-group {
  display: flex;
  gap: 0.5rem;
  max-width: 600px;
  margin: 0 auto;
}

.search-input {
  flex: 1;
  padding: 1rem 1.5rem;
  font-size: 1.1rem;
  border: none;
  border-radius: 50px;
  background: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  outline: none;
  transition: all 0.3s ease;
}

.search-input:focus {
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.search-input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.search-button {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.search-button:hover:not(:disabled) {
  background: #ff5252;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
}

.search-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 768px) {
  .input-group {
    flex-direction: column;
  }

  .search-input {
    font-size: 1rem;
    padding: 0.875rem 1.25rem;
  }

  .search-button {
    font-size: 1rem;
    padding: 0.875rem 1.5rem;
    justify-content: center;
  }
}
</style>
