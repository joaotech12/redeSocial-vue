<!--
  ============================================================
   PÁGINA 404 (não encontrada)
  ============================================================
  Aparece quando o endereço digitado não corresponde a nenhuma página
  (veja a última rota em routes/index.ts).
-->
<template>
  <div class="page notfound">
    <h1>404</h1>
    <p class="muted">Essa página não existe.</p>
    <RouterLink to="/" class="btn btn--primary">Voltar ao início</RouterLink>
  </div>
</template>

<style scoped>
/* Tudo centralizado */
.notfound {
  text-align: center;
  padding-top: 96px;
}

/* "404" bem grande */
.notfound h1 {
  font-size: 4rem;
  margin: 0;
}
</style>
