<!--
  ============================================================
   CABEÇALHO DO PERFIL
  ============================================================
  Foto, nome, botão Seguir (ou Editar perfil, se for o próprio usuário),
  números de seguidores/seguindo/curtidas e a bio.
  Este componente só mostra as informações; as ações ficam na página view/Profile.vue.
-->
<script setup lang="ts">
import { formatCount } from '@/utils/format'
import UserAvatar from '@/components/UserAvatar.vue'
import type { User } from '@/interfaces/user.interface'

// Informações recebidas da página de perfil
defineProps<{
  user: User
  stats: { following: number; followers: number; likes: number }
  isOwner: boolean // é o perfil de quem está logado?
  isFollowing: boolean // quem está logado já segue este perfil?
}>()

// Avisos para a página: clicou em Seguir ou em Editar
const emit = defineEmits<{ follow: []; edit: [] }>()
</script>

<template>
  <header class="profile">
    <UserAvatar :src="user.avatar" :name="user.name" :size="96" />
    <div class="profile__info">
      <h1>{{ user.username }}</h1>
      <h2 class="muted">{{ user.name }}</h2>

      <!-- Próprio perfil: Editar. Perfil de outra pessoa: Seguir / Seguindo -->
      <button v-if="isOwner" class="btn" @click="emit('edit')">Editar perfil</button>
      <button
        v-else
        class="btn"
        :class="{ 'btn--primary': !isFollowing }"
        @click="emit('follow')"
      >
        {{ isFollowing ? 'Seguindo' : 'Seguir' }}
      </button>

      <!-- Números do perfil (formatCount deixa "1,2 mil" em vez de "1200") -->
      <ul class="profile__stats">
        <li><strong>{{ formatCount(stats.following) }}</strong> <span class="muted">Seguindo</span></li>
        <li><strong>{{ formatCount(stats.followers) }}</strong> <span class="muted">Seguidores</span></li>
        <li><strong>{{ formatCount(stats.likes) }}</strong> <span class="muted">Curtidas</span></li>
      </ul>

      <!-- Bio (fica vazia se o usuário não escreveu nada) -->
      <p>{{ user.bio || '' }}</p>
    </div>
  </header>
</template>

<style scoped>
/* Foto à esquerda, informações à direita */
.profile {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  margin-bottom: 24px;
}

.profile__info h1 {
  margin: 0;
  font-size: 1.6rem;
}

.profile__info h2 {
  margin: 4px 0 12px;
  font-size: 1rem;
  font-weight: 500;
}

/* Os três números lado a lado, sem marcadores de lista */
.profile__stats {
  display: flex;
  gap: 20px;
  list-style: none;
  padding: 0;
  margin: 16px 0 8px;
}

/* Celular: tudo centralizado, um embaixo do outro */
@media (max-width: 480px) {
  .profile {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .profile__stats {
    justify-content: center;
  }
}
</style>
