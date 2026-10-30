/*
 * ============================================================
 *  ESTADO DE LOGIN
 * ============================================================
 * Guarda quem está logado e oferece as funções de entrar, cadastrar e sair.
 *
 * A "sessão" (usuário + token) fica salva no navegador (localStorage),
 * então a pessoa continua logada mesmo depois de fechar e abrir a página.
 * O token vale 1 hora; depois disso o servidor recusa e a pessoa é deslogada.
 *
 * Como usar em qualquer tela:
 *   const { currentUser, login, logout } = useAuth()
 */
import { computed, ref } from 'vue'
import { userController } from '@/controller/user.controller'
import { configurarAutenticacao } from '@/controller/service.controller'
import type { AuthResponse, CreateUser, User } from '@/interfaces/user.interface'

// Nome usado para salvar a sessão no navegador
const STORAGE_KEY = 'redesocial:sessao'

// Formato simples de e-mail: algo@dominio.algo
const EMAIL_REGEX = /^[^\s@]+@[^\s@.]+\.[^\s@]+$/

// O que guardamos na sessão
interface Sessao {
  user: User // dados de quem está logado
  token: string // "crachá" enviado ao servidor em cada pedido
}

// Lê a sessão salva no navegador (se existir e estiver legível)
function carregarSessao(): Sessao | null {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY)
    return salvo ? (JSON.parse(salvo) as Sessao) : null
  } catch {
    // Navegador bloqueou o acesso ou o conteúdo está corrompido
    return null
  }
}

/*
 * Estado compartilhado: como estas variáveis ficam FORA da função useAuth,
 * existe uma cópia só, e todas as telas enxergam o mesmo usuário logado.
 * "ref" e "computed" são reativos: quando mudam, a tela se atualiza sozinha.
 */
const sessao = ref<Sessao | null>(carregarSessao())
const currentUser = computed(() => sessao.value?.user ?? null)

// Atualiza a sessão na memória e no navegador (null = deslogar)
function salvarSessao(nova: Sessao | null) {
  sessao.value = nova
  if (nova) localStorage.setItem(STORAGE_KEY, JSON.stringify(nova))
  else localStorage.removeItem(STORAGE_KEY)
}

// Guarda a resposta de login/cadastro como sessão atual
function iniciarSessao({ user, accessToken }: AuthResponse) {
  salvarSessao({ user, token: accessToken })
  return user
}

// Ensina o módulo de conexão (service.controller.ts) a mandar o token e a deslogar se ele expirar
configurarAutenticacao({
  obterToken: () => sessao.value?.token ?? null,
  aoExpirarSessao: () => salvarSessao(null),
})

export function useAuth() {
  // true se tem alguém logado
  const isLoggedIn = computed(() => currentUser.value !== null)

  // Entrar com e-mail e senha (o e-mail é comparado sempre em minúsculas)
  async function login(email: string, password: string) {
    return iniciarSessao(await userController.login({ email: email.trim().toLowerCase(), password }))
  }

  // Criar conta nova (e-mail obrigatório)
  async function register(dados: CreateUser) {
    // Remove espaços nas pontas e deixa tudo minúsculo
    const username = dados.username.trim().toLowerCase()
    const email = dados.email.trim().toLowerCase()

    if (!EMAIL_REGEX.test(email)) {
      throw new Error('Informe um e-mail válido')
    }
    // O e-mail repetido a própria API recusa; o nome de usuário verificamos aqui
    if (await userController.getByUsername(username)) {
      throw new Error('Esse nome de usuário já existe')
    }

    const resposta = await userController.register({
      username,
      email,
      name: dados.name.trim(),
      password: dados.password,
      avatar: '', // começa sem foto; o usuário pode enviar uma depois, no perfil
      bio: '',
    })
    return iniciarSessao(resposta)
  }

  // Sair da conta
  function logout() {
    salvarSessao(null)
  }

  // Atualiza os dados do usuário logado (ex.: depois de editar o perfil),
  // mantendo os campos que não mudaram (como o e-mail)
  function updateLocal(dados: Partial<User>) {
    if (sessao.value) {
      salvarSessao({ ...sessao.value, user: { ...sessao.value.user, ...dados } })
    }
  }

  return { currentUser, isLoggedIn, login, register, logout, updateLocal }
}
