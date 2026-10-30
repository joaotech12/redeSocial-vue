/*
 * ============================================================
 *  CONTROLLER DE COMENTÁRIOS
 * ============================================================
 * Funções para listar, escrever e apagar comentários de uma publicação.
 */
import { serviceController } from './service.controller'
import type { Comment, CreateComment } from '@/interfaces/comment.interface'

export const commentController = {
  // Comentários de uma publicação, do mais novo para o mais antigo,
  // já trazendo os dados de quem escreveu (_expand=user)
  listByPost: (postId: number) =>
    serviceController.get<Comment[]>(`/comments?postId=${postId}&_expand=user&_sort=createdAt&_order=desc`),

  // Escrever um comentário (o servidor confere se o userId é de quem está logado)
  create: (comentario: CreateComment) =>
    serviceController.post<Comment>('/comments', comentario),

  // Apagar um comentário (só quem escreveu consegue)
  remove: (id: number) => serviceController.delete(`/comments/${id}`),
}
