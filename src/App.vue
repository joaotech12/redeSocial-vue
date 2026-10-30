<!--
  ============================================================
   COMPONENTE PRINCIPAL (a "moldura" do site)
  ============================================================
  Tudo o que aparece no site fica dentro deste componente:
   - à esquerda, o menu lateral (só no computador);
   - no meio, a página do endereço atual (feed, perfil, busca...);
   - embaixo, a barra de navegação (só no celular).
-->
<script setup lang="ts">
// Importa as peças do layout para usar no <template> abaixo
import AppSidebar from '@/componentes/layout/AppSidebar.vue'
import BottomNav from '@/componentes/layout/BottomNav.vue'
</script>

<template>
  <div class="app">
    <!-- Menu lateral: aparece só em telas grandes -->
    <AppSidebar class="app__sidebar" />

    <!-- Aqui o Vue Router coloca a página do endereço atual.
         O :key faz a página recarregar ao trocar de endereço (ex.: de um perfil para outro). -->
    <main class="app__main">
      <RouterView :key="$route.fullPath" />
    </main>

    <!-- Barra inferior: aparece só no celular -->
    <BottomNav class="app__bottom" />
  </div>
</template>

<style scoped>
/* "scoped" = estes estilos valem só para este componente */

/* Ocupa a tela inteira (100dvh = altura visível da tela), menu ao lado do conteúdo */
.app {
  display: flex;
  height: 100dvh;
}

/* Área da página: ocupa o espaço que sobra e tem rolagem própria */
.app__main {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
}

/* No computador a barra inferior fica escondida */
.app__bottom {
  display: none;
}

/* Telas pequenas (até 768px, celular): esconde o menu lateral e mostra a barra inferior */
@media (max-width: 768px) {
  .app {
    flex-direction: column;
  }
  .app__sidebar {
    display: none;
  }
  .app__bottom {
    display: flex;
  }
}
</style>
