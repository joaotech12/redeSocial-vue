/*
 * ============================================================
 *  SERVIÇO DE COMENTÁRIOS
 * ============================================================
 * Funções para listar, escrever e apagar comentários de uma publicação.
 */
import { http } from './http'
import type { Comment } from '@/tipos'

export const commentsApi = {
  // Comentários de uma publicação, do mais novo para o mais antigo,
  // já trazendo os dados de quem escreveu (_expand=user)
  listByPost: (postId: number) =>
    http.get<Comment[]>(`/comments?postId=${postId}&_expand=user&_sort=createdAt&_order=desc`),

  // Escrever um comentário (o servidor confere se o userId é de quem está logado)
  create: (comentario: Omit<Comment, 'id' | 'user'>) =>
    http.post<Comment>('/comments', comentario),

  // Apagar um comentário (só quem escreveu consegue)
  remove: (id: number) => http.delete(`/comments/${id}`),
}
