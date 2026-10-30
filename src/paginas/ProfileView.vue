<!--
  ============================================================
   PÁGINA DE PERFIL (/@nome-do-usuario)
  ============================================================
  Mostra os dados do usuário, os números (seguidores, seguindo, curtidas)
  e a grade com as publicações dele.
  - Perfil de outra pessoa: botão Seguir / Seguindo.
  - Próprio perfil: botão Editar (nome, bio e foto de perfil).
    A foto de perfil é ENVIADA do dispositivo para o nosso servidor.
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usersApi, postsApi } from '@/servicos'
import { ACEITA_FOTOS, LIMITE_MB, enviarArquivo, validarArquivo } from '@/servicos/uploads'
import { useAuth } from '@/estado/useAuth'
import ProfileHeader from '@/componentes/perfil/ProfileHeader.vue'
import PostGrid from '@/componentes/publicacao/PostGrid.vue'
import UserAvatar from '@/componentes/comuns/UserAvatar.vue'
import type { User, Post } from '@/tipos'

// Nome de usuário vem do endereço (/@joao -> "joao")
const props = defineProps<{ username: string }>()

const router = useRouter()
const { currentUser, updateLocal } = useAuth()

const user = ref<User | null>(null) // dono do perfil
const posts = ref<Post[]>([]) // publicações dele
const followers = ref(0) // quantos o seguem
const following = ref(0) // quantos ele segue
const followId = ref<number | null>(null) // id do "seguir" do usuário logado (se seguir)
const loading = ref(true)
const error = ref('')

// ----- Formulário de edição do perfil -----
const editing = ref(false) // formulário aberto?
const saving = ref(false) // salvando?
const form = ref({ name: '', bio: '' }) // campos de texto
const novaFoto = ref<File | null>(null) // foto nova escolhida (ainda não enviada)
const previewFoto = ref('') // pré-visualização da foto nova
const removerFoto = ref(false) // usuário pediu para ficar sem foto?

// É o perfil de quem está logado?
const isOwner = computed(() => currentUser.value?.id === user.value?.id)

// Soma as curtidas de todas as publicações do usuário
// (reduce = percorre a lista acumulando um total)
const totalLikes = computed(() =>
  posts.value.reduce((soma, p) => soma + (p.likes?.length ?? 0), 0),
)

// Foto mostrada no formulário de edição: a nova (se escolheu), nenhuma (se removeu) ou a atual
const fotoNoFormulario = computed(() => {
  if (previewFoto.value) return previewFoto.value
  if (removerFoto.value) return ''
  return user.value?.avatar ?? ''
})

// Busca tudo o que a página precisa
async function load() {
  loading.value = true
  user.value = await usersApi.getByUsername(props.username)
  if (user.value) {
    const id = user.value.id
    // Busca publicações, seguidores e seguindo ao mesmo tempo
    const [lista, seguidores, seguindo] = await Promise.all([
      postsApi.listByUser(id),
      usersApi.followers(id),
      usersApi.following(id),
    ])
    posts.value = lista
    followers.value = seguidores.length
    following.value = seguindo.length
    // Procura se o usuário logado está entre os seguidores
    followId.value = seguidores.find((f) => f.userId === currentUser.value?.id)?.id ?? null
  }
  loading.value = false
}

// Seguir / deixar de seguir. Se não estiver logado, vai para o login.
async function toggleFollow() {
  if (!user.value) return
  if (!currentUser.value) {
    router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
    return
  }
  error.value = ''
  try {
    if (followId.value) {
      await usersApi.unfollow(followId.value)
      followId.value = null
      followers.value--
    } else {
      const criado = await usersApi.follow(currentUser.value.id, user.value.id)
      followId.value = criado.id
      followers.value++
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao seguir'
  }
}

// Descarta a foto nova escolhida (e libera a pré-visualização da memória)
function limparFotoNova() {
  if (previewFoto.value) URL.revokeObjectURL(previewFoto.value)
  previewFoto.value = ''
  novaFoto.value = null
}

// Abre o formulário de edição já preenchido com os dados atuais
function startEdit() {
  if (!user.value) return
  form.value = { name: user.value.name, bio: user.value.bio }
  limparFotoNova()
  removerFoto.value = false
  error.value = ''
  editing.value = true
}

// Fecha o formulário sem salvar
function cancelEdit() {
  limparFotoNova()
  editing.value = false
}

// Chamado quando o usuário escolhe uma foto nova de perfil
function onFotoChange(event: Event) {
  const input = event.target as HTMLInputElement
  const escolhida = input.files?.[0]
  input.value = '' // permite escolher o mesmo arquivo de novo depois
  if (!escolhida) return

  // Só aceita fotos (true = "somente fotos"), dentro do limite de tamanho
  const problema = validarArquivo(escolhida, true)
  if (problema) {
    error.value = problema
    return
  }
  error.value = ''
  limparFotoNova()
  novaFoto.value = escolhida
  previewFoto.value = URL.createObjectURL(escolhida)
  removerFoto.value = false
}

// Botão "Remover foto": volta a mostrar as iniciais
function onRemoverFoto() {
  limparFotoNova()
  removerFoto.value = true
}

// Salva as alterações: envia a foto nova (se houver) e depois atualiza o perfil
async function saveEdit() {
  if (!user.value) return
  saving.value = true
  error.value = ''
  try {
    const dados: Partial<User> = { name: form.value.name.trim(), bio: form.value.bio.trim() }

    if (novaFoto.value) {
      // Envia a foto para o nosso servidor e guarda o endereço dela no perfil
      const { url } = await enviarArquivo(novaFoto.value)
      dados.avatar = url
    } else if (removerFoto.value) {
      dados.avatar = '' // sem foto
    }

    user.value = await usersApi.update(user.value.id, dados)
    updateLocal(user.value) // atualiza também o menu lateral
    limparFotoNova()
    editing.value = false
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao salvar'
  } finally {
    saving.value = false
  }
}

onMounted(load)
// Ao sair da página, libera a pré-visualização da memória
onBeforeUnmount(limparFotoNova)
</script>

<template>
  <div class="page">
    <p v-if="loading" class="muted">Carregando...</p>
    <p v-else-if="!user" class="muted">Usuário @{{ username }} não encontrado.</p>

    <template v-else>
      <ProfileHeader
        :user="user"
        :stats="{ following, followers, likes: totalLikes }"
        :is-owner="isOwner"
        :is-following="followId !== null"
        @follow="toggleFollow"
        @edit="startEdit"
      />

      <p v-if="error" class="error">{{ error }}</p>

      <!-- Formulário de edição (só aparece ao clicar em "Editar perfil") -->
      <form v-if="editing" class="edit" @submit.prevent="saveEdit">
        <!-- Foto de perfil: escolher do dispositivo ou remover -->
        <div class="edit__photo">
          <UserAvatar :src="fotoNoFormulario" :name="form.name" :size="72" />
          <div class="edit__photo-actions">
            <!-- O <input> fica escondido; o <label> com cara de botão abre o seletor -->
            <label class="btn">
              📷 Escolher foto
              <input
                type="file"
                :accept="ACEITA_FOTOS"
                class="visually-hidden"
                :disabled="saving"
                @change="onFotoChange"
              />
            </label>
            <button
              v-if="fotoNoFormulario"
              type="button"
              class="btn"
              :disabled="saving"
              @click="onRemoverFoto"
            >
              Remover foto
            </button>
            <small class="muted">JPG, PNG, GIF ou WEBP, até {{ LIMITE_MB.image }} MB</small>
          </div>
        </div>

        <input v-model="form.name" placeholder="Nome" maxlength="50" required />
        <textarea v-model="form.bio" placeholder="Bio" rows="2" maxlength="80" />

        <div class="edit__actions">
          <button type="button" class="btn" :disabled="saving" @click="cancelEdit">Cancelar</button>
          <button class="btn btn--primary" :disabled="saving">
            {{ saving ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </form>

      <!-- Publicações do usuário -->
      <h3 class="tab">Publicações</h3>
      <PostGrid v-if="posts.length" :posts="posts" />
      <p v-else class="muted">Nenhuma publicação ainda.</p>
    </template>
  </div>
</template>

<style scoped>
/* Caixa do formulário de edição */
.edit {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  margin-bottom: 24px;
  background: var(--surface);
  border-radius: var(--radius);
}

/* Foto à esquerda, botões à direita */
.edit__photo {
  display: flex;
  align-items: center;
  gap: 16px;
}

.edit__photo-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.edit__photo-actions small {
  width: 100%;
}

/* Esconde o <input type="file"> mas mantém acessível para leitores de tela */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

/* Botões Cancelar/Salvar alinhados à direita */
.edit__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* Título "Publicações" com sublinhado, parecendo uma aba */
.tab {
  border-bottom: 2px solid var(--text);
  display: inline-block;
  padding-bottom: 8px;
}
</style>
