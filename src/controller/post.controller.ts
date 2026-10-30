/*
 * ============================================================
 *  CONTROLLER DE PUBLICAÇÕES (fotos e vídeos postados)
 * ============================================================
 * Funções para listar, pesquisar, criar e curtir publicações.
 * Cada função faz um pedido ao servidor e devolve a resposta.
 */
import { serviceController } from './service.controller'
import type { CreatePost, Like, Post } from '@/interfaces/post.interface'

/*
 * Parâmetros extras pedidos à API em toda listagem
 * (são recursos prontos do json-server):
 *  _expand=user     -> traz junto os dados de quem publicou
 *  _embed=likes     -> traz junto a lista de curtidas
 *  _embed=comments  -> traz junto a lista de comentários (para mostrar a contagem)
 */
const JUNTO = '_expand=user&_embed=likes&_embed=comments'

// Ordena do mais novo para o mais antigo (pela data de criação)
const MAIS_NOVOS = '_sort=createdAt&_order=desc'

export const postController = {
  // Todas as publicações (feed "Para você")
  list: () => serviceController.get<Post[]>(`/posts?${JUNTO}&${MAIS_NOVOS}`),

  // Publicações de um usuário específico (página de perfil)
  listByUser: (userId: number) =>
    serviceController.get<Post[]>(`/posts?userId=${userId}&${JUNTO}&${MAIS_NOVOS}`),

  // Pesquisa por texto (legenda, música, #hashtag...). "q" busca em todos os campos.
  // encodeURIComponent protege caracteres especiais como # e espaços.
  search: (texto: string) =>
    serviceController.get<Post[]>(`/posts?q=${encodeURIComponent(texto)}&${JUNTO}&${MAIS_NOVOS}`),

  // Uma publicação só, pelo número (id)
  getById: (id: number) => serviceController.get<Post>(`/posts/${id}?${JUNTO}`),

  /**
   * Cria a publicação. O arquivo precisa ter sido enviado ANTES
   * (veja controller/upload.controller.ts), pois aqui só vai o endereço dele.
   * CreatePost = os campos que nós mandamos (veja interfaces/post.interface.ts).
   */
  create: (post: CreatePost) =>
    serviceController.post<Post>('/posts', post),

  // Apaga uma publicação (o servidor só deixa o dono apagar)
  remove: (id: number) => serviceController.delete(`/posts/${id}`),

  // Curtir: cria um registro de curtida ligando o usuário à publicação
  like: (postId: number, userId: number) => serviceController.post<Like>('/likes', { postId, userId }),

  // Descurtir: apaga o registro de curtida
  unlike: (likeId: number) => serviceController.delete(`/likes/${likeId}`),
}
