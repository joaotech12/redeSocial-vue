/*
 * ============================================================
 *  CONTROLLER DE USUÁRIOS
 * ============================================================
 * Funções para entrar, cadastrar, buscar, editar e seguir usuários.
 */
import { serviceController } from './service.controller'
import type { AuthResponse, CreateLogin, CreateUser, Follow, User } from '@/interfaces/user.interface'

export const userController = {
  // Entrar na conta com e-mail e senha. Devolve o token e os dados do usuário.
  login: (dados: CreateLogin) =>
    serviceController.post<AuthResponse>('/login', dados),

  // Criar uma conta nova. O servidor criptografa a senha antes de salvar.
  register: (dados: CreateUser & Pick<User, 'avatar' | 'bio'>) =>
    serviceController.post<AuthResponse>('/register', dados),

  // Busca um usuário pelo nome de usuário (ex.: "joao"). Devolve null se não existir.
  getByUsername: async (username: string) => {
    const lista = await serviceController.get<User[]>(`/users?username=${encodeURIComponent(username)}`)
    return lista[0] ?? null // "??" = se não tiver o primeiro item, usa null
  },

  // Pesquisa usuários por qualquer texto (nome, @, bio...)
  search: (texto: string) => serviceController.get<User[]>(`/users?q=${encodeURIComponent(texto)}`),

  // Altera dados do perfil (o servidor só deixa o próprio usuário alterar)
  update: (id: number, dados: Partial<User>) => serviceController.patch<User>(`/users/${id}`, dados),

  // Lista de quem segue este usuário
  followers: (userId: number) => serviceController.get<Follow[]>(`/follows?followingId=${userId}`),

  // Lista de quem este usuário segue
  following: (userId: number) => serviceController.get<Follow[]>(`/follows?userId=${userId}`),

  // Começar a seguir alguém: userId (eu) passa a seguir followingId (a outra pessoa)
  follow: (userId: number, followingId: number) =>
    serviceController.post<Follow>('/follows', { userId, followingId }),

  // Deixar de seguir: apaga o registro de "seguir"
  unfollow: (followId: number) => serviceController.delete(`/follows/${followId}`),
}
