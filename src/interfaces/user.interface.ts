/*
 * ============================================================
 *  INTERFACES DE USUÁRIO
 * ============================================================
 * Uma "interface" descreve o formato de uma informação,
 * como se fosse a ficha de cadastro dela.
 * Isso ajuda o editor de código a avisar quando usamos um campo
 * que não existe ou escrevemos um nome errado.
 *
 * "?" depois do nome do campo = campo opcional (pode não vir).
 */

// Um usuário da rede social
export interface User {
  id: number // número único de cada usuário (criado pelo servidor)
  username: string // nome de usuário, aparece como @nome
  name: string // nome de exibição
  email?: string // só vem preenchido para o próprio usuário logado
  avatar: string // endereço da foto de perfil no NOSSO servidor ("" = sem foto)
  bio: string // texto curto de apresentação
}

// Dados enviados para criar uma conta (e-mail obrigatório)
export interface CreateUser {
  username: string
  name: string
  email: string
  password: string
}

// Dados enviados para entrar na conta
export interface CreateLogin {
  email: string
  password: string
}

// Resposta da API ao fazer login ou cadastro
export interface AuthResponse {
  accessToken: string // "crachá" que prova que o usuário está logado (vale 1 hora)
  user: User // dados de quem entrou
}

// Um "seguir": o usuário userId segue o usuário followingId
export interface Follow {
  id: number
  userId: number // quem está seguindo
  followingId: number // quem está sendo seguido
}
