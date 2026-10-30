<!--
  ============================================================
   GRADE DE PUBLICAÇÕES (miniaturas em 3 colunas)
  ============================================================
  Usada na página de perfil e na página Descobrir.
  Clicar numa miniatura abre a publicação.
  Vídeos ganham um ▶ no canto para diferenciar das fotos.
-->
<script setup lang="ts">
import { formatCount } from '@/utilitarios/format'
import type { Post } from '@/tipos'

// Lista de publicações a mostrar
defineProps<{ posts: Post[] }>()
</script>

<template>
  <div class="grid">
    <RouterLink v-for="p in posts" :key="p.id" :to="`/post/${p.id}`" class="grid__item">
      <!-- Vídeo: "#t=1" mostra o quadro do segundo 1 como miniatura -->
      <video v-if="p.mediaType === 'video'" :src="`${p.mediaUrl}#t=1`" muted preload="metadata" />
      <!-- Foto: loading="lazy" só carrega quando a miniatura aparece na tela -->
      <img v-else :src="p.mediaUrl" :alt="p.description || 'Foto'" loading="lazy" />

      <!-- Marcador de vídeo -->
      <span v-if="p.mediaType === 'video'" class="grid__type" aria-label="Vídeo">▶</span>

      <!-- Contador de curtidas -->
      <span class="grid__likes">❤️ {{ formatCount(p.likes?.length ?? 0) }}</span>
    </RouterLink>
  </div>
</template>

<style scoped>
/* 3 colunas do mesmo tamanho, com 4px de espaço entre elas */
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

/* Cada miniatura em formato retrato (3:4) */
.grid__item {
  position: relative;
  aspect-ratio: 3 / 4;
  background: var(--surface-2);
  overflow: hidden;
  border-radius: 4px;
}

/* Foto/vídeo preenchem a miniatura (cortando as sobras) */
.grid__item video,
.grid__item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none; /* o clique vai para o link, não para o vídeo */
}

/* Marcador ▶ no canto de cima */
.grid__type {
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 0.8rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

/* Curtidas no canto de baixo */
.grid__likes {
  position: absolute;
  left: 6px;
  bottom: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}
</style>
