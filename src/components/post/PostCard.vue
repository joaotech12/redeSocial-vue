<!--
  ============================================================
   CARTÃO DE PUBLICAÇÃO (uma foto ou vídeo do feed, em tela cheia)
  ============================================================
  - VÍDEO: toca sozinho quando aparece na tela e pausa quando sai.
           Clique no vídeo para pausar/continuar; botão 🔇 liga o som.
  - FOTO: aparece inteira, sem cortes, sobre um fundo desfocado.
  - Nos dois casos: curtir, comentar, compartilhar e (para o dono) apagar.
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { postController } from '@/controller/post.controller'
import { useAuth } from '@/controller/auth.controller'
import PostActions from './PostActions.vue'
import CommentsDrawer from '@/components/CommentsDrawer.vue'
import type { Like, Post } from '@/interfaces/post.interface'

// A publicação a ser mostrada (recebida do feed ou da página da publicação)
const props = defineProps<{ post: Post }>()

// Aviso para a página quando a publicação for apagada (para tirá-la da lista)
const emit = defineEmits<{ deleted: [id: number] }>()

const router = useRouter()
const { currentUser } = useAuth()

// É vídeo? (se não for, é foto)
const isVideo = computed(() => props.post.mediaType === 'video')

// É publicação de quem está logado? (mostra o botão de apagar)
const isOwner = computed(() => currentUser.value?.id === props.post.userId)

// Referências aos elementos da tela (o cartão inteiro e o player de vídeo)
const root = ref<HTMLElement | null>(null)
const player = ref<HTMLVideoElement | null>(null)

// Estado do cartão
const likes = ref<Like[]>(props.post.likes ?? []) // curtidas da publicação
const commentCount = ref(props.post.comments?.length ?? 0) // total de comentários
const showComments = ref(false) // gaveta de comentários aberta?
const paused = ref(false) // vídeo pausado?
const muted = ref(true) // som desligado? (navegadores só tocam sozinho sem som)
const toast = ref('') // mensagem rápida no meio da tela
const busy = ref(false) // evita cliques duplos enquanto espera o servidor

// A curtida do usuário logado nesta publicação (undefined se ele não curtiu)
const myLike = computed(() => likes.value.find((l) => l.userId === currentUser.value?.id))

/*
 * Observador de visibilidade: avisa quando o cartão entra ou sai da tela.
 * Assim, ao rolar o feed, só o vídeo visível fica tocando.
 * (Fotos não precisam disso.)
 */
let observer: IntersectionObserver | null = null

onMounted(() => {
  if (!isVideo.value) return
  observer = new IntersectionObserver(
    ([entry]) => {
      if (!player.value || !entry) return
      if (entry.isIntersecting) {
        // Entrou na tela: volta ao início e toca
        player.value.currentTime = 0
        // Se o navegador bloquear o "tocar sozinho", mostra o ícone de play
        player.value.play().catch(() => (paused.value = true))
        paused.value = false
      } else {
        // Saiu da tela: pausa
        player.value.pause()
      }
    },
    { threshold: 0.7 }, // considera "visível" quando 70% do cartão aparece
  )
  if (root.value) observer.observe(root.value)
})

// Ao sair da página, para de observar (libera memória)
onBeforeUnmount(() => observer?.disconnect())

// Pausa ou continua o vídeo
function togglePlay() {
  if (!player.value) return
  if (player.value.paused) {
    player.value.play()
    paused.value = false
  } else {
    player.value.pause()
    paused.value = true
  }
}

// Manda para o login, lembrando de voltar para esta página depois
function irParaLogin() {
  router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
}

// Curte ou descurte. Se não estiver logado, manda para a tela de login.
async function toggleLike() {
  if (!currentUser.value) return irParaLogin()
  if (busy.value) return
  busy.value = true
  try {
    if (myLike.value) {
      // Já curtiu: apaga a curtida e tira da lista
      const id = myLike.value.id
      await postController.unlike(id)
      likes.value = likes.value.filter((l) => l.id !== id)
    } else {
      // Ainda não curtiu: cria a curtida e coloca na lista
      const nova = await postController.like(props.post.id, currentUser.value.id)
      likes.value = [...likes.value, nova]
    }
  } catch (e) {
    showToast(e instanceof Error ? e.message : 'Erro ao curtir')
  } finally {
    busy.value = false
  }
}

// Apaga a publicação (só o dono vê este botão), depois de pedir confirmação
async function removePost() {
  if (busy.value || !confirm('Apagar esta publicação?')) return
  busy.value = true
  try {
    await postController.remove(props.post.id)
    emit('deleted', props.post.id)
  } catch (e) {
    showToast(e instanceof Error ? e.message : 'Erro ao apagar')
  } finally {
    busy.value = false
  }
}

// Copia o link da publicação para a área de transferência
async function share() {
  const url = `${location.origin}/post/${props.post.id}`
  try {
    await navigator.clipboard.writeText(url)
    showToast('Link copiado!')
  } catch {
    // Se o navegador não deixar copiar, mostra o link na tela
    showToast(url)
  }
}

// Mostra uma mensagem rápida por 2 segundos
function showToast(msg: string) {
  toast.value = msg
  setTimeout(() => (toast.value = ''), 2000)
}
</script>

<template>
  <article ref="root" class="card">
    <div class="card__media">
      <!-- ========== VÍDEO ========== -->
      <template v-if="isVideo">
        <!-- loop = repete; playsinline = toca dentro da página no celular -->
        <video
          ref="player"
          class="card__video"
          :src="post.mediaUrl"
          :muted="muted"
          loop
          playsinline
          preload="metadata"
          @click="togglePlay"
        />
        <!-- Ícone de "play" quando pausado -->
        <span v-if="paused" class="card__play">▶</span>
        <!-- Botão de som -->
        <button
          class="card__corner"
          :aria-label="muted ? 'Ligar som' : 'Desligar som'"
          @click="muted = !muted"
        >
          {{ muted ? '🔇' : '🔊' }}
        </button>
      </template>

      <!-- ========== FOTO ========== -->
      <template v-else>
        <!-- A mesma foto, ampliada e desfocada, preenche o fundo -->
        <img class="card__blur" :src="post.mediaUrl" alt="" aria-hidden="true" />
        <!-- A foto de verdade, inteira e sem cortes -->
        <img class="card__image" :src="post.mediaUrl" :alt="post.description || 'Foto'" />
      </template>

      <!-- Botão de apagar: só para o dono da publicação -->
      <button
        v-if="isOwner"
        class="card__corner card__corner--left"
        aria-label="Apagar publicação"
        :disabled="busy"
        @click="removePost"
      >
        🗑
      </button>

      <!-- Informações na parte de baixo: autor, legenda e música -->
      <div class="card__info">
        <RouterLink v-if="post.user" :to="`/@${post.user.username}`" class="card__author">
          @{{ post.user.username }}
        </RouterLink>
        <p v-if="post.description" class="card__desc">{{ post.description }}</p>
        <p class="card__music">{{ isVideo ? '🎵' : '📷' }} {{ post.music }}</p>
      </div>

      <!-- Coluna de botões à direita -->
      <PostActions
        class="card__actions"
        :user="post.user"
        :liked="!!myLike"
        :like-count="likes.length"
        :comment-count="commentCount"
        @like="toggleLike"
        @comments="showComments = true"
        @share="share"
      />

      <!-- Mensagem rápida (ex.: "Link copiado!"). <Transition> anima a entrada/saída. -->
      <Transition name="fade">
        <div v-if="toast" class="card__toast">{{ toast }}</div>
      </Transition>
    </div>

    <!-- Gaveta de comentários (aparece ao clicar no 💬) -->
    <CommentsDrawer
      v-if="showComments"
      :post-id="post.id"
      @close="showComments = false"
      @changed="commentCount = $event"
    />
  </article>
</template>

<style scoped>
/* Cada cartão ocupa a altura toda e "gruda" no topo ao rolar o feed */
.card {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  padding: 12px 0;
}

/* Área da mídia no formato de celular em pé (9:16) */
.card__media {
  position: relative;
  height: 100%;
  aspect-ratio: 9 / 16;
  max-width: 100%;
  background: #111;
  border-radius: var(--radius);
  overflow: hidden; /* corta o que passar dos cantos arredondados */
}

/* Vídeo preenche toda a área */
.card__video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}

/* Fundo desfocado da foto */
.card__blur {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(24px) brightness(0.6);
  transform: scale(1.2); /* amplia para esconder as bordas do desfoque */
}

/* Foto de verdade: inteira ("contain" = cabe sem cortar) */
.card__image {
  position: relative;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Ícone grande de play no centro */
.card__play {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 80px;
  height: 80px;
  display: grid;
  place-items: center;
  font-size: 3rem;
  opacity: 0.8;
  pointer-events: none; /* deixa o clique passar para o vídeo */
}

/* Botões redondos nos cantos de cima (som à direita, lixeira à esquerda) */
.card__corner {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 1.2rem;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 50%;
  width: 36px;
  height: 36px;
}

.card__corner--left {
  right: auto;
  left: 12px;
}

/* Degradê escuro embaixo para o texto ficar legível */
.card__info {
  position: absolute;
  left: 0;
  right: 72px;
  bottom: 0;
  padding: 16px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}

.card__author {
  font-weight: 700;
}

.card__desc {
  margin: 6px 0;
  font-size: 0.95rem;
  overflow-wrap: anywhere; /* quebra palavras muito longas */
}

.card__music {
  margin: 0;
  font-size: 0.85rem;
}

/* Coluna de botões no canto inferior direito */
.card__actions {
  position: absolute;
  right: 10px;
  bottom: 24px;
}

/* Mensagem rápida no centro */
.card__toast {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  text-align: center;
}

/* Animação de aparecer/sumir da mensagem */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* No celular a mídia ocupa a tela toda, sem bordas */
@media (max-width: 768px) {
  .card {
    padding: 0;
  }
  .card__media {
    width: 100%;
    aspect-ratio: auto;
    border-radius: 0;
  }
}
</style>
