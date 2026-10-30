<!--
  ============================================================
   PÁGINA PUBLICAR (/upload)
  ============================================================
  O usuário escolhe uma FOTO ou um VÍDEO do computador/celular,
  vê a pré-visualização, escreve a legenda e publica.

  Como funciona a publicação (2 etapas):
   1) o arquivo é enviado para o NOSSO servidor (rota /upload),
      que salva na pasta servidor/uploads e devolve o endereço dele;
   2) é criado o registro da publicação no banco (legenda, autor, tipo...)
      apontando para esse endereço.
  Não é possível publicar por link: só arquivos enviados daqui.
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { postController } from '@/controller/post.controller'
import {
  ACEITA_FOTOS_E_VIDEOS,
  LIMITE_MB,
  enviarArquivo,
  tipoDoArquivo,
  validarArquivo,
} from '@/controller/upload.controller'
import { useAuth } from '@/controller/auth.controller'

const router = useRouter()
const { currentUser } = useAuth()

const file = ref<File | null>(null) // arquivo escolhido
const previewUrl = ref('') // endereço temporário para pré-visualizar
const description = ref('') // legenda
const music = ref('') // nome da música
const error = ref('') // mensagem de erro
const progress = ref(0) // progresso do envio (0 a 100)
const sending = ref(false) // publicando?

// Tipo do arquivo escolhido: "image", "video" ou null (nenhum)
const tipo = computed(() => (file.value ? tipoDoArquivo(file.value) : null))

// Libera a pré-visualização anterior da memória do navegador
function limparPreview() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
}

// Chamado quando o usuário escolhe um arquivo
function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const escolhido = input.files?.[0] ?? null // pega o primeiro arquivo (só aceitamos um)
  error.value = ''
  limparPreview()
  file.value = null
  if (!escolhido) return

  // Confere tipo e tamanho antes de aceitar
  const problema = validarArquivo(escolhido)
  if (problema) {
    error.value = problema
    input.value = '' // limpa o seletor para poder escolher de novo
    return
  }

  file.value = escolhido
  // Cria um endereço temporário, só no navegador, para mostrar o arquivo antes de enviar
  previewUrl.value = URL.createObjectURL(escolhido)
}

// Envia o arquivo e cria a publicação
async function publish() {
  if (!currentUser.value || !file.value) return
  sending.value = true
  progress.value = 0
  error.value = ''
  try {
    // Etapa 1: envia o arquivo para o nosso servidor, acompanhando o progresso
    const { url, mediaType } = await enviarArquivo(file.value, (p) => (progress.value = p))

    // Etapa 2: cria a publicação com as informações digitadas
    const post = await postController.create({
      userId: currentUser.value.id,
      mediaUrl: url,
      mediaType,
      description: description.value.trim(),
      // Se não digitou música, usa "Som original - @usuario"
      music: music.value.trim() || `Som original - ${currentUser.value.username}`,
      createdAt: new Date().toISOString(),
    })

    // Abre a publicação recém-criada
    router.push(`/post/${post.id}`)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao publicar.'
  } finally {
    sending.value = false
  }
}

// Ao sair da página, libera a pré-visualização da memória
onBeforeUnmount(limparPreview)
</script>

<template>
  <div class="page">
    <h1>Nova publicação</h1>
    <p class="muted">
      Escolha uma foto (até {{ LIMITE_MB.image }} MB) ou um vídeo (até {{ LIMITE_MB.video }} MB) do
      seu dispositivo.
    </p>

    <div class="upload">
      <!-- ".prevent" impede o formulário de recarregar a página ao enviar -->
      <form class="upload__form" @submit.prevent="publish">
        <!-- Seletor de arquivo: aceita só os tipos de foto e vídeo permitidos -->
        <label>
          Foto ou vídeo
          <input
            type="file"
            :accept="ACEITA_FOTOS_E_VIDEOS"
            :disabled="sending"
            required
            @change="onFileChange"
          />
        </label>

        <label>
          Descrição
          <textarea
            v-model="description"
            rows="4"
            maxlength="200"
            placeholder="Conte algo sobre a publicação #hashtag"
          />
          <!-- Contador de caracteres -->
          <small class="muted">{{ description.length }}/200</small>
        </label>

        <label>
          Música
          <input v-model="music" placeholder="Som original" maxlength="80" />
        </label>

        <!-- Barra de progresso: aparece só durante o envio -->
        <div v-if="sending" class="progress">
          <div class="progress__bar" :style="{ width: `${progress}%` }" />
          <span>{{ progress < 100 ? `Enviando... ${progress}%` : 'Finalizando...' }}</span>
        </div>

        <p v-if="error" class="error">{{ error }}</p>
        <button class="btn btn--primary" :disabled="!file || sending">
          {{ sending ? 'Publicando...' : 'Publicar' }}
        </button>
      </form>

      <!-- Pré-visualização no formato de celular -->
      <div class="upload__preview">
        <video
          v-if="previewUrl && tipo === 'video'"
          :src="previewUrl"
          controls
          muted
          autoplay
          loop
          playsinline
        />
        <img v-else-if="previewUrl && tipo === 'image'" :src="previewUrl" alt="Pré-visualização" />
        <span v-else class="muted">Pré-visualização</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Formulário à esquerda, pré-visualização à direita */
.upload {
  display: flex;
  gap: 24px;
  margin-top: 24px;
}

.upload__form {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Texto do rótulo em cima, campo embaixo */
.upload__form label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 600;
}

/* Caixa tracejada da pré-visualização (formato 9:16) */
.upload__preview {
  width: 220px;
  aspect-ratio: 9 / 16;
  border: 2px dashed var(--border);
  border-radius: var(--radius);
  display: grid;
  place-items: center;
  overflow: hidden;
  background: #111;
}

/* Vídeo preenche a caixa; foto aparece inteira */
.upload__preview video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload__preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Barra de progresso: fundo cinza + faixa rosa que cresce */
.progress {
  position: relative;
  height: 28px;
  background: var(--surface-2);
  border-radius: 6px;
  overflow: hidden;
  display: grid;
  place-items: center;
  font-size: 0.85rem;
}

.progress__bar {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--primary);
  opacity: 0.6;
  transition: width 0.2s;
}

/* Texto por cima da faixa */
.progress span {
  position: relative;
}

/* Celular: pré-visualização em cima, formulário embaixo */
@media (max-width: 600px) {
  .upload {
    flex-direction: column-reverse;
  }
  .upload__preview {
    width: 160px;
    margin: 0 auto;
  }
}
</style>
