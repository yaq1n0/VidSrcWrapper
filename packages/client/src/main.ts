import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import './style.css';
import HomePage from './pages/HomePage.vue';
import MovieDetailPage from './pages/MovieDetailPage.vue';
import ShowDetailPage from './pages/ShowDetailPage.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/movie/:id', name: 'movie-detail', component: MovieDetailPage },
    { path: '/tv/:id', name: 'tv-detail', component: ShowDetailPage },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

createApp(App).use(router).mount('#app');
