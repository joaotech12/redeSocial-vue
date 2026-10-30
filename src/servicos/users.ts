/*
 * ============================================================
 *  SERVIÇO DE USUÁRIOS
 * ============================================================
 * Funções para entrar, cadastrar, buscar, editar e seguir usuários.
 */
import { http } from './http'
import type { AuthResponse, Follow, User } from '@/tipos'

export const usersApi = {
  // Entrar na conta com e-mail e senha. Devolve o token e os dados do usuário.
  login: (email: string, password: string) =>
    http.post<AuthResponse>('/login', { email, password }),

  // Criar uma conta nova. O servidor criptografa a senha antes de salvar.
  register: (dados: Omit<User, 'id'> & { email: string; password: string }) =>
    http.post<AuthResponse>('/register', dados),

  // Busca um usuário pelo nome de usuário (ex.: "joao"). Devolve null se não existir.
  getByUsername: async (username: string) => {
    const lista = await http.get<User[]>(`/users?username=${encodeURIComponent(username)}`)
    return lista[0] ?? null // "??" = se não tiver o primeiro item, usa null
  },

  // Pesquisa usuários por qualquer texto (nome, @, bio...)
  search: (texto: string) => http.get<User[]>(`/users?q=${encodeURIComponent(texto)}`),

  // Altera dados do perfil (o servidor só deixa o próprio usuário alterar)
  update: (id: number, dados: Partial<User>) => http.patch<User>(`/users/${id}`, dados),

  // Lista de quem segue este usuário
  followers: (userId: number) => http.get<Follow[]>(`/follows?followingId=${userId}`),

  // Lista de quem este usuário segue
  following: (userId: number) => http.get<Follow[]>(`/follows?userId=${userId}`),

  // Começar a seguir alguém: userId (eu) passa a seguir followingId (a outra pessoa)
  follow: (userId: number, followingId: number) =>
    http.post<Follow>('/follows', { userId, followingId }),

  // Deixar de seguir: apaga o registro de "seguir"
  unfollow: (followId: number) => http.delete(`/follows/${followId}`),
}
