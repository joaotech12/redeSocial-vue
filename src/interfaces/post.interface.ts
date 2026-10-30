/*
 * ============================================================
 *  INTERFACES DE PUBLICAÇÃO (fotos e vídeos)
 * ============================================================
 * Formato das publicações, das curtidas e da resposta do envio de arquivos.
 * "?" depois do nome do campo = campo opcional (pode não vir).
 */
import type { User } from './user.interface'
import type { Comment } from './comment.interface'

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

// Dados enviados para criar uma publicação
// ("Omit" = todos os campos de Post, menos os que o servidor cria ou traz junto)
export type CreatePost = Omit<Post, 'id' | 'user' | 'likes' | 'comments'>

// Uma curtida: liga um usuário a uma publicação
export interface Like {
  id: number
  postId: number // qual publicação foi curtida
  userId: number // quem curtiu
}

// Resposta da API depois de enviar um arquivo
export interface UploadResponse {
  url: string // onde o arquivo ficou salvo no servidor
  mediaType: MediaType // se o servidor reconheceu como foto ou vídeo
}
