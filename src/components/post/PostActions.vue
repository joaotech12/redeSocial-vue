<!--
  ============================================================
   BOTÕES DE AÇÃO DA PUBLICAÇÃO (coluna à direita)
  ============================================================
  Foto do autor, curtir, comentar e compartilhar.
  Este componente só DESENHA os botões; quem decide o que acontece
  quando são clicados é o PostCard (ele recebe os "avisos" via emit).
-->
<script setup lang="ts">
import { formatCount } from '@/utils/format'
import UserAvatar from '@/components/UserAvatar.vue'
import type { User } from '@/interfaces/user.interface'

// Informações recebidas do PostCard
defineProps<{
  user?: User // autor da publicação
  liked: boolean // se o usuário logado já curtiu
  likeCount: number // total de curtidas
  commentCount: number // total de comentários
}>()

// Avisos enviados ao PostCard quando um botão é clicado
const emit = defineEmits<{
  like: []
  comments: []
  share: []
}>()
</script>

<template>
  <div class="actions">
    <!-- Foto do autor: clicar abre o perfil dele -->
    <RouterLink v-if="user" :to="`/@${user.username}`" class="actions__avatar">
      <UserAvatar :src="user.avatar" :name="user.name" :size="48" />
    </RouterLink>

    <!-- Curtir: coração vermelho se já curtiu, branco se não -->
    <button
      class="actions__btn"
      :class="{ 'is-liked': liked }"
      :aria-label="liked ? 'Descurtir' : 'Curtir'"
      @click="emit('like')"
    >
      <span class="actions__icon">{{ liked ? '❤️' : '🤍' }}</span>
      <span>{{ formatCount(likeCount) }}</span>
    </button>

    <!-- Abrir comentários -->
    <button class="actions__btn" aria-label="Comentários" @click="emit('comments')">
      <span class="actions__icon">💬</span>
      <span>{{ formatCount(commentCount) }}</span>
    </button>

    <!-- Compartilhar (copiar link) -->
    <button class="actions__btn" @click="emit('share')">
      <span class="actions__icon">↗️</span>
      <span>Compartilhar</span>
    </button>
  </div>
</template>

<style scoped>
/* Botões empilhados na vertical */
.actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

/* Borda branca em volta da foto do autor */
.actions__avatar {
  border: 2px solid var(--text);
  border-radius: 50%;
  display: flex;
}

.actions__btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  /* Sombra no texto para ler bem por cima da foto/vídeo */
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}

/* Círculo semitransparente atrás de cada ícone */
.actions__icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  font-size: 1.5rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  transition: transform 0.15s; /* anima o "pulo" abaixo */
}

/* Pequeno "pulo" ao clicar ou quando está curtido */
.actions__btn:active .actions__icon,
.is-liked .actions__icon {
  transform: scale(1.1);
}
</style>
