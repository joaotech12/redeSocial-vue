/*
 * ============================================================
 *  INTERFACES DE COMENTÁRIO
 * ============================================================
 * Formato dos comentários feitos nas publicações.
 */
import type { User } from './user.interface'

// Um comentário em uma publicação
export interface Comment {
  id: number
  postId: number // em qual publicação
  userId: number // quem comentou
  text: string // o que foi escrito
  createdAt: string // quando foi escrito
  user?: User // dados de quem comentou (quando pedimos junto)
}

// Dados enviados para criar um comentário
export type CreateComment = Omit<Comment, 'id' | 'user'>
