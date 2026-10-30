<!--
  ============================================================
   PÁGINA DE UMA PUBLICAÇÃO SÓ (/post/:id)
  ============================================================
  Abre quando alguém clica numa miniatura ou recebe um link compartilhado.
-->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { postsApi } from '@/servicos'
import PostCard from '@/componentes/publicacao/PostCard.vue'
import type { Post } from '@/tipos'

// O id vem do endereço (configurado em rotas/index.ts)
const props = defineProps<{ id: number }>()

const router = useRouter()
const post = ref<Post | null>(null) // a publicação carregada
const notFound = ref(false) // true se não existir

// Busca a publicação na API; se não existir, mostra aviso
onMounted(async () => {
  try {
    post.value = await postsApi.getById(props.id)
  } catch {
    notFound.value = true
  }
})

// Se o dono apagar a publicação aqui, volta para o perfil dele
function onDeleted() {
  router.replace('/perfil')
}
</script>

<template>
  <div class="single">
    <!-- Volta para a página anterior do navegador -->
    <button class="single__back" @click="router.back()">← Voltar</button>
    <PostCard v-if="post" :post="post" @deleted="onDeleted" />
    <p v-else-if="notFound" class="muted single__status">Publicação não encontrada.</p>
  </div>
</template>

<style scoped>
.single {
  position: relative;
  height: 100%;
}

/* Botão "Voltar" flutuando no canto de cima */
.single__back {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.5);
  padding: 6px 12px;
  border-radius: 20px;
}

/* No celular a publicação ocupa a tela toda: desce o "Voltar" para não cobrir a lixeira */
@media (max-width: 768px) {
  .single__back {
    top: 60px;
  }
}

.single__status {
  text-align: center;
  padding-top: 80px;
}
</style>
