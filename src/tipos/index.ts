/*
 * ============================================================
 *  TIPOS
 * ============================================================
 * Aqui descrevemos o "formato" de cada informação do sistema,
 * como se fosse a ficha de cadastro de cada coisa.
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

// Os dois tipos de publicação possíveis
export type MediaType = 'image' | 'video'

// Uma publicação (post): pode ser uma foto ou um vídeo
export interface Post {
  id: number // número único da publicação
  userId: number // id de quem publicou
  mediaUrl: string // endereço do arquivo no NOSSO servidor (ex.: /uploads/123.jpg)
  mediaType: MediaType // "image" (foto) ou "video"
  description: string // legenda escrita pelo usuário
  music: string // nome da música/som
  createdAt: string // data e hora da publicação
  user?: User // dados de quem publicou (quando pedimos junto)
  likes?: Like[] // lista de curtidas (quando pedimos junto)
  comments?: Comment[] // lista de comentários (quando pedimos junto)
}

// Um comentário em uma publicação
export interface Comment {
  id: number
  postId: number // em qual publicação
  userId: number // quem comentou
  text: string // o que foi escrito
  createdAt: string // quando foi escrito
  user?: User // dados de quem comentou (quando pedimos junto)
}

// Uma curtida: liga um usuário a uma publicação
export interface Like {
  id: number
  postId: number // qual publicação foi curtida
  userId: number // quem curtiu
}

// Um "seguir": o usuário userId segue o usuário followingId
export interface Follow {
  id: number
  userId: number // quem está seguindo
  followingId: number // quem está sendo seguido
}

// Resposta da API ao fazer login ou cadastro
export interface AuthResponse {
  accessToken: string // "crachá" que prova que o usuário está logado (vale 1 hora)
  user: User // dados de quem entrou
}

// Resposta da API depois de enviar um arquivo
export interface UploadResponse {
  url: string // onde o arquivo ficou salvo no servidor
  mediaType: MediaType // se o servidor reconheceu como foto ou vídeo
}
