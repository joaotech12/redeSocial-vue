<!--
  ============================================================
   GAVETA DE COMENTÁRIOS
  ============================================================
  Painel que sobe da parte de baixo da tela com os comentários
  de uma publicação. Quem está logado pode comentar e apagar
  os próprios comentários.
-->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { commentController } from '@/controller/comment.controller'
import { useAuth } from '@/controller/auth.controller'
import { timeAgo } from '@/utils/format'
import UserAvatar from '@/components/UserAvatar.vue'
import type { Comment } from '@/interfaces/comment.interface'

// Qual publicação está aberta
const props = defineProps<{ postId: number }>()

// Avisos para o PostCard: fechar a gaveta e nova contagem de comentários
const emit = defineEmits<{ close: []; changed: [count: number] }>()

const { currentUser } = useAuth()
const comments = ref<Comment[]>([]) // lista de comentários
const text = ref('') // texto que está sendo digitado
const loading = ref(true) // carregando a lista?
const sending = ref(false) // enviando um comentário?
const error = ref('') // mensagem de erro

// Busca os comentários na API
async function load() {
  loading.value = true
  try {
    comments.value = await commentController.listByPost(props.postId)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar comentários'
  } finally {
    // "finally" roda sempre, dando certo ou errado
    loading.value = false
  }
}

// Envia um comentário novo e coloca no topo da lista
async function send() {
  // Não envia se não estiver logado ou se o texto estiver vazio
  if (!currentUser.value || !text.value.trim()) return
  sending.value = true
  error.value = ''
  try {
    const created = await commentController.create({
      postId: props.postId,
      userId: currentUser.value.id,
      text: text.value.trim(),
      createdAt: new Date().toISOString(), // data/hora de agora
    })
    // unshift = coloca no começo da lista (mais novo primeiro)
    comments.value.unshift({ ...created, user: currentUser.value })
    text.value = '' // limpa o campo
    emit('changed', comments.value.length)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao comentar'
  } finally {
    sending.value = false
  }
}

// Apaga um comentário do próprio usuário
async function remove(comment: Comment) {
  try {
    await commentController.remove(comment.id)
    // filter = mantém todos, menos o que foi apagado
    comments.value = comments.value.filter((c) => c.id !== comment.id)
    emit('changed', comments.value.length)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao apagar comentário'
  }
}

// Carrega os comentários assim que a gaveta abre
onMounted(load)
</script>

<template>
  <!-- Fundo escuro: clicar fora da gaveta (.self = só no fundo) fecha -->
  <div class="overlay" @click.self="emit('close')">
    <section class="drawer">
      <header class="drawer__header">
        <strong>{{ comments.length }} comentários</strong>
        <button class="drawer__close" aria-label="Fechar" @click="emit('close')">✕</button>
      </header>

      <!-- Lista de comentários -->
      <ul class="drawer__list">
        <li v-if="loading" class="muted">Carregando...</li>
        <li v-else-if="!comments.length" class="muted">Seja o primeiro a comentar!</li>
        <li v-for="c in comments" :key="c.id" class="comment">
          <UserAvatar :src="c.user?.avatar" :name="c.user?.name" :size="36" />
          <div class="comment__body">
            <RouterLink :to="`/@${c.user?.username}`" class="muted">
              {{ c.user?.username }}
            </RouterLink>
            <p>{{ c.text }}</p>
            <small class="muted">{{ timeAgo(c.createdAt) }}</small>
          </div>
          <!-- Lixeira: só aparece nos comentários do próprio usuário -->
          <button
            v-if="currentUser?.id === c.userId"
            class="comment__delete muted"
            aria-label="Apagar comentário"
            @click="remove(c)"
          >
            🗑
          </button>
        </li>
      </ul>

      <p v-if="error" class="error drawer__error">{{ error }}</p>

      <!-- Campo para comentar (só para quem está logado). ".prevent" evita recarregar a página. -->
      <form v-if="currentUser" class="drawer__form" @submit.prevent="send">
        <input v-model="text" placeholder="Adicione um comentário..." maxlength="300" />
        <button class="btn btn--primary" :disabled="sending || !text.trim()">Enviar</button>
      </form>
      <p v-else class="drawer__login muted">
        <RouterLink to="/login" class="error">Entre</RouterLink> para comentar.
      </p>
    </section>
  </div>
</template>

<style scoped>
/* Fundo escuro cobrindo a tela toda, acima de tudo (z-index alto) */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end; /* gaveta encostada embaixo */
  justify-content: center;
}

/* A gaveta em si: 70% da altura da tela */
.drawer {
  width: 100%;
  max-width: 560px;
  height: 70dvh;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-radius: var(--radius) var(--radius) 0 0;
  animation: slide-up 0.2s ease-out;
}

/* Animação de subir: começa 100% abaixo e vai até a posição normal */
@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
}

.drawer__header {
  display: flex;
  justify-content: center;
  position: relative;
  padding: 16px;
  border-bottom: 1px solid var(--border);
}

.drawer__close {
  position: absolute;
  right: 16px;
}

/* Lista com rolagem própria (flex: 1 = ocupa o espaço que sobrar) */
.drawer__list {
  flex: 1;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Um comentário: foto à esquerda, texto ao lado */
.comment {
  display: flex;
  gap: 10px;
}

.comment__body {
  flex: 1;
  font-size: 0.9rem;
  overflow-wrap: anywhere;
}

.comment__body p {
  margin: 2px 0;
}

.drawer__error {
  margin: 0;
  padding: 0 16px 8px;
  font-size: 0.85rem;
}

/* Campo de texto + botão Enviar lado a lado */
.drawer__form {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--border);
}

.drawer__login {
  padding: 16px;
  text-align: center;
  border-top: 1px solid var(--border);
}
</style>
