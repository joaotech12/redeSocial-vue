<!--
  ============================================================
   FOTO DE PERFIL (redonda)
  ============================================================
  Mostra a foto que o usuário enviou para o nosso servidor.
  Se ele ainda não enviou nenhuma (ou a imagem não carregar),
  mostra um círculo colorido com as iniciais do nome.

  Uso: <UserAvatar :src="usuario.avatar" :name="usuario.name" :size="48" />
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { initials } from '@/utilitarios/format'

// Propriedades recebidas: endereço da foto, nome da pessoa e tamanho em pixels
const props = withDefaults(defineProps<{ src?: string; name?: string; size?: number }>(), {
  src: '',
  name: '',
  size: 48,
})

// Vira true se a imagem der erro ao carregar (ex.: arquivo apagado)
const falhou = ref(false)

// Se a foto mudar (ex.: usuário enviou outra), tenta carregar de novo
watch(
  () => props.src,
  () => (falhou.value = false),
)

// Mostra a foto só se existir um endereço e ela não tiver dado erro
const mostrarFoto = computed(() => !!props.src && !falhou.value)

/*
 * Escolhe uma cor de fundo a partir do nome, para cada pessoa
 * ter sempre a mesma cor. Soma os códigos das letras e transforma num tom (0 a 359).
 */
const corDeFundo = computed(() => {
  let soma = 0
  for (const letra of props.name) soma += letra.charCodeAt(0)
  return `hsl(${soma % 360} 55% 40%)`
})

// Tamanho do círculo e da letra, proporcionais ao "size"
const estilo = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  fontSize: `${Math.round(props.size * 0.4)}px`,
}))
</script>

<template>
  <!-- Com foto -->
  <img
    v-if="mostrarFoto"
    class="avatar"
    :src="src"
    :alt="name"
    :width="size"
    :height="size"
    :style="estilo"
    @error="falhou = true"
  />
  <!-- Sem foto: iniciais. role/aria-label ajudam leitores de tela (acessibilidade) -->
  <span
    v-else
    class="avatar avatar--initials"
    role="img"
    :aria-label="name"
    :style="{ ...estilo, background: corDeFundo }"
  >
    {{ initials(name) }}
  </span>
</template>

<style scoped>
/* Recorta a imagem em círculo */
.avatar {
  border-radius: 50%;
  object-fit: cover; /* preenche o círculo sem deformar a foto */
  background: var(--surface-2);
  flex-shrink: 0; /* não deixa o círculo "amassar" em linhas apertadas */
}

/* Círculo com as iniciais centralizadas */
.avatar--initials {
  display: inline-grid;
  place-items: center;
  font-weight: 700;
  color: #fff;
  user-select: none; /* não deixa selecionar as letras ao clicar */
}
</style>
