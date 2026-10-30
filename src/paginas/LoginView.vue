<!--
  ============================================================
   PÁGINA DE LOGIN / CADASTRO (/login)
  ============================================================
  Um só formulário que alterna entre "Entrar" e "Criar conta".
   - Entrar: e-mail + senha.
   - Criar conta: e-mail (obrigatório), nome de usuário, nome e senha.
  A foto de perfil é escolhida depois, em "Editar perfil".
-->
<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/estado/useAuth'

const route = useRoute()
const router = useRouter()
const { login, register } = useAuth()

const mode = ref<'login' | 'register'>('login') // modo atual do formulário
const email = ref('')
const username = ref('')
const name = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

// Envia o formulário: entra ou cria a conta, depois volta para onde a pessoa queria ir
async function submit() {
  error.value = ''
  loading.value = true
  try {
    if (mode.value === 'login') {
      await login(email.value, password.value)
    } else {
      await register({
        email: email.value,
        username: username.value,
        name: name.value,
        password: password.value,
      })
    }
    // ?redirect= é preenchido pelo "porteiro" das rotas (ex.: veio de /upload)
    router.push(String(route.query.redirect ?? '/'))
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro inesperado'
  } finally {
    loading.value = false
  }
}

// Alterna entre "Entrar" e "Criar conta" (e limpa o erro anterior)
function toggleMode() {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  error.value = ''
}
</script>

<template>
  <div class="page auth">
    <h1>{{ mode === 'login' ? 'Entrar' : 'Criar conta' }}</h1>

    <form class="auth__form" @submit.prevent="submit">
      <!-- E-mail: obrigatório nos dois modos. "autocomplete" ajuda o navegador a preencher. -->
      <input v-model="email" type="email" placeholder="E-mail" autocomplete="email" required />

      <!-- Campos extras só no cadastro -->
      <template v-if="mode === 'register'">
        <input v-model="username" placeholder="Nome de usuário" autocomplete="username" required />
        <input v-model="name" placeholder="Seu nome" required />
      </template>

      <!-- Senha: mínimo de 4 caracteres (mesma regra do servidor) -->
      <input
        v-model="password"
        type="password"
        placeholder="Senha"
        :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
        minlength="4"
        required
      />
      <p v-if="error" class="error">{{ error }}</p>
      <button class="btn btn--primary" :disabled="loading">
        {{ mode === 'login' ? 'Entrar' : 'Cadastrar' }}
      </button>
    </form>

    <!-- Link para trocar de modo -->
    <p class="muted">
      {{ mode === 'login' ? 'Não tem conta?' : 'Já tem conta?' }}
      <button type="button" class="error" @click="toggleMode">
        {{ mode === 'login' ? 'Cadastre-se' : 'Entrar' }}
      </button>
    </p>
    <!-- Dica para testar -->
    <p v-if="mode === 'login'" class="muted hint">
      Teste com <b>joao@email.com</b> / <b>123456</b>
    </p>
  </div>
</template>

<style scoped>
/* Coluna estreita e centralizada */
.auth {
  max-width: 380px;
  text-align: center;
  padding-top: 64px;
}

.auth__form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 24px 0;
}

.hint {
  font-size: 0.85rem;
}
</style>
