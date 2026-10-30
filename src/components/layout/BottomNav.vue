<!--
  ============================================================
   BARRA DE NAVEGAÇÃO INFERIOR (celular)
  ============================================================
  Mostra os mesmos itens do menu lateral (navItems.ts),
  em formato de ícone com o texto embaixo.
-->
<script setup lang="ts">
import { navItems } from './navItems'
</script>

<template>
  <nav class="bottom-nav">
    <!-- Um link para cada item do menu -->
    <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="bottom-nav__link">
      <span class="bottom-nav__icon">{{ item.icon }}</span>
      <span>{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
/* Barra com altura fixa; os itens ficam distribuídos igualmente */
.bottom-nav {
  height: var(--nav-height);
  flex-shrink: 0;
  justify-content: space-around;
  align-items: center;
  background: var(--bg);
  border-top: 1px solid var(--border);
}

/* Ícone em cima, texto embaixo, em cinza */
.bottom-nav__link {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 0.7rem;
  color: var(--text-muted);
}

/* Item da página atual fica em branco */
.bottom-nav__link.router-link-exact-active {
  color: var(--text);
}

.bottom-nav__icon {
  font-size: 1.2rem;
}
</style>
