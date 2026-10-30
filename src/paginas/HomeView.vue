<!--
  ============================================================
   PÁGINA INICIAL — FEED "PARA VOCÊ"
  ============================================================
  Lista de fotos e vídeos em tela cheia; rolar para baixo passa para o próximo.
-->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { postsApi } from '@/servicos'
import PostCard from '@/componentes/publicacao/PostCard.vue'
import type { Post } from '@/tipos'

const posts = ref<Post[]>([]) // publicações do feed
const loading = ref(true) // carregando?
const error = ref('') // mensagem de erro

// Ao abrir a página, busca as publicações na API
onMounted(async () => {
  try {
    posts.value = await postsApi.list()
  } catch {
    error.value = 'Não foi possível carregar o feed. O servidor está ligado? (npm run api)'
  } finally {
    loading.value = false
  }
})

// Quando o dono apaga uma publicação, ela some da lista
function removeFromList(id: number) {
  posts.value = posts.value.filter((p) => p.id !== id)
}
</script>

<template>
  <div class="feed">
    <!-- Mensagens de estado: só uma aparece por vez (v-if / v-else-if) -->
    <p v-if="loading" class="feed__status muted">Carregando...</p>
    <p v-else-if="error" class="feed__status error">{{ error }}</p>
    <div v-else-if="!posts.length" class="feed__status">
      <p class="muted">Nenhuma publicação ainda.</p>
      <RouterLink to="/upload" class="btn btn--primary">Publicar a primeira</RouterLink>
    </div>

    <!-- Um cartão para cada publicação -->
    <PostCard v-for="p in posts" :key="p.id" :post="p" @deleted="removeFromList" />
  </div>
</template>

<style scoped>
/* Cada PostCard ocupa a altura inteira e o scroll "gruda" em uma publicação por vez */
.feed {
  height: 100%;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
}

.feed__status {
  text-align: center;
  padding: 48px 16px;
}
</style>
