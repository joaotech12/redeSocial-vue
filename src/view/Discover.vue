









































<!--
  ============================================================
   PÁGINA DESCOBRIR (/descobrir)
  ============================================================
  Campo de busca de usuários e publicações.
  Sem nada digitado, mostra as publicações mais recentes ("Em alta").
-->
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { userController } from '@/controller/user.controller'
import { postController } from '@/controller/post.controller'
import UserAvatar from '@/components/UserAvatar.vue'
import PostGrid from '@/components/post/PostGrid.vue'
import type { User } from '@/interfaces/user.interface'
import type { Post } from '@/interfaces/post.interface'

const route = useRoute()
const router = useRouter()

// O texto da busca começa com o que estiver no endereço (?q=...)
const query = ref(String(route.query.q ?? ''))
const users = ref<User[]>([]) // usuários encontrados
const posts = ref<Post[]>([]) // publicações encontradas

// Faz a busca na API
async function search() {
  const q = query.value.trim()
  if (q) {
    // Promise.all = faz as duas buscas ao mesmo tempo (mais rápido)
    ;[users.value, posts.value] = await Promise.all([userController.search(q), postController.search(q)])
  } else {
    users.value = []
    posts.value = await postController.list()
  }
}

/*
 * "watch" observa o texto da busca. Toda vez que ele muda:
 *  - espera 300 ms sem digitação antes de buscar (evita uma busca por letra);
 *  - atualiza o ?q= no endereço, para poder compartilhar o link da busca.
 */
let timer: ReturnType<typeof setTimeout>
watch(query, (q) => {
  clearTimeout(timer) // cancela a espera anterior
  timer = setTimeout(() => {
    router.replace({ query: q.trim() ? { q: q.trim() } : {} })
    search()
  }, 300)
})

// Busca inicial ao abrir a página
onMounted(search)
</script>

<template>
  <div class="page">
    <!-- v-model liga o campo à variável "query" (o que digitar vai direto para ela) -->
    <input v-model="query" type="search" placeholder="🔍 Buscar usuários, publicações ou #hashtags" />

    <!-- Resultado: usuários (só aparece se encontrar algum) -->
    <section v-if="users.length" class="section">
      <h3>Usuários</h3>
      <RouterLink v-for="u in users" :key="u.id" :to="`/@${u.username}`" class="user-row">
        <UserAvatar :src="u.avatar" :name="u.name" :size="44" />
        <div>
          <strong>{{ u.username }}</strong>
          <div class="muted">{{ u.name }}</div>
        </div>
      </RouterLink>
    </section>

    <!-- Resultado: publicações -->
    <section class="section">
      <h3>{{ query.trim() ? 'Publicações' : 'Em alta' }}</h3>
      <PostGrid v-if="posts.length" :posts="posts" />
      <p v-else class="muted">Nenhuma publicação encontrada.</p>
    </section>
  </div>
</template>

<style scoped>
.section {
  margin-top: 24px;
}

/* Linha de usuário: foto + nome */
.user-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
}

.user-row:hover {
  background: var(--surface-2);
}
</style>
