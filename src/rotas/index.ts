/*
 * ============================================================
 *  ROTAS (Vue Router)
 * ============================================================
 * Define qual página aparece para cada endereço do site. Exemplos:
 *   "/"           -> feed
 *   "/descobrir"  -> busca
 *   "/@joao"      -> perfil do joao
 *   "/post/3"     -> a publicação número 3
 */
import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/estado/useAuth'

const router = createRouter({
  // Usa endereços "limpos" (sem # na URL)
  history: createWebHistory(),
  routes: [
    {
      // Página inicial: feed de publicações
      path: '/',
      name: 'home',
      // "() => import(...)" carrega a página só quando ela for aberta (site mais rápido)
      component: () => import('@/paginas/HomeView.vue'),
    },
    {
      // Busca de usuários e publicações
      path: '/descobrir',
      name: 'discover',
      component: () => import('@/paginas/DiscoverView.vue'),
    },
    {
      // Uma publicação sozinha (link para compartilhar)
      // ":id" é uma parte variável do endereço (ex.: /post/7 -> id = 7)
      path: '/post/:id',
      name: 'post',
      component: () => import('@/paginas/PostView.vue'),
      // Converte o :id da URL (texto) em número e entrega para a página
      props: (route) => ({ id: Number(route.params.id) }),
    },
    {
      // Publicar foto ou vídeo: só para quem está logado
      path: '/upload',
      name: 'upload',
      component: () => import('@/paginas/UploadView.vue'),
      meta: { requiresAuth: true }, // marcação lida pelo "porteiro" lá embaixo
    },
    {
      // Atalho "Perfil": leva para o perfil de quem está logado
      path: '/perfil',
      name: 'me',
      redirect: () => {
        const { currentUser } = useAuth()
        return currentUser.value ? `/@${currentUser.value.username}` : '/login'
      },
    },
    {
      // Perfil de qualquer usuário: /@nome
      path: '/@:username',
      name: 'profile',
      component: () => import('@/paginas/ProfileView.vue'),
      props: true, // entrega o :username para a página
    },
    {
      // Entrar / criar conta: só para quem NÃO está logado
      path: '/login',
      name: 'login',
      component: () => import('@/paginas/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      // Qualquer outro endereço: página "não encontrada"
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/paginas/NotFoundView.vue'),
    },
  ],
})

/*
 * "Porteiro" das rotas: roda antes de cada troca de página.
 * - Se a página exige login e a pessoa não está logada, manda para /login
 *   (guardando em ?redirect= para onde ela queria ir).
 * - Se a pessoa já está logada, não deixa abrir a tela de login.
 * Não devolver nada = pode passar.
 */
router.beforeEach((to) => {
  const { isLoggedIn } = useAuth()
  if (to.meta.requiresAuth && !isLoggedIn.value) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && isLoggedIn.value) {
    return { name: 'home' }
  }
})

export default router
