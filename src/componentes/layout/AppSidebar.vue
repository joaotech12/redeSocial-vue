<!--
  ============================================================
   MENU LATERAL (computador)
  ============================================================
  De cima para baixo: logo, links de navegação e, no rodapé,
  o usuário logado (com botão Sair) ou o botão "Entrar".
-->
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuth } from '@/estado/useAuth'
import UserAvatar from '@/componentes/comuns/UserAvatar.vue'
import { navItems } from './navItems'

// currentUser = quem está logado (ou null); logout = função de sair
const { currentUser, logout } = useAuth()
const router = useRouter()

// Sai da conta e volta para a página inicial
function handleLogout() {
  logout()
  router.push('/')
}
</script>

<template>
  <aside class="sidebar">
    <!-- Logo: leva para a página inicial -->
    <RouterLink to="/" class="sidebar__logo">
      <span class="logo-mark">♪</span> RedeSocial
    </RouterLink>

    <!-- Links do menu: "v-for" repete o link para cada item de navItems.ts -->
    <nav class="sidebar__nav">
      <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="sidebar__link">
        <span class="sidebar__icon">{{ item.icon }}</span>
        {{ item.label }}
      </RouterLink>
    </nav>

    <div class="sidebar__footer">
      <!-- "v-if": este bloco só aparece se tiver alguém logado -->
      <template v-if="currentUser">
        <RouterLink :to="`/@${currentUser.username}`" class="sidebar__user">
          <UserAvatar :src="currentUser.avatar" :name="currentUser.name" :size="36" />
          <div>
            <strong>{{ currentUser.name }}</strong>
            <div class="muted">@{{ currentUser.username }}</div>
          </div>
        </RouterLink>
        <button class="btn" @click="handleLogout">Sair</button>
      </template>
      <!-- "v-else": aparece quando NÃO tem ninguém logado -->
      <RouterLink v-else to="/login" class="btn btn--primary">Entrar</RouterLink>
    </div>
  </aside>
</template>

<style scoped>
/* Coluna fixa de 240px com borda à direita */
.sidebar {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 20px 12px;
  border-right: 1px solid var(--border);
}

.sidebar__logo {
  font-size: 1.4rem;
  font-weight: 800;
  padding: 0 8px;
}

/* Nota musical azul com "sombra" rosa */
.logo-mark {
  color: var(--accent);
  text-shadow: 2px 2px var(--primary);
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar__link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
}

/* Fundo cinza ao passar o mouse */
.sidebar__link:hover {
  background: var(--surface-2);
}

/* O Vue Router coloca esta classe no link da página atual: deixa rosa */
.sidebar__link.router-link-exact-active {
  color: var(--primary);
}

.sidebar__icon {
  font-size: 1.2rem;
}

/* margin-top: auto empurra o rodapé para o fim do menu */
.sidebar__footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar__user {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
}
</style>
