/*
 * ============================================================
 *  SERVIÇO DE PUBLICAÇÕES (fotos e vídeos postados)
 * ============================================================
 * Funções para listar, pesquisar, criar e curtir publicações.
 * Cada função faz um pedido ao servidor e devolve a resposta.
 */
import { http } from './http'
import type { Like, Post } from '@/tipos'

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

export const postsApi = {
  // Todas as publicações (feed "Para você")
  list: () => http.get<Post[]>(`/posts?${JUNTO}&${MAIS_NOVOS}`),

  // Publicações de um usuário específico (página de perfil)
  listByUser: (userId: number) =>
    http.get<Post[]>(`/posts?userId=${userId}&${JUNTO}&${MAIS_NOVOS}`),

  // Pesquisa por texto (legenda, música, #hashtag...). "q" busca em todos os campos.
  // encodeURIComponent protege caracteres especiais como # e espaços.
  search: (texto: string) =>
    http.get<Post[]>(`/posts?q=${encodeURIComponent(texto)}&${JUNTO}&${MAIS_NOVOS}`),

  // Uma publicação só, pelo número (id)
  getById: (id: number) => http.get<Post>(`/posts/${id}?${JUNTO}`),

  /**
   * Cria a publicação. O arquivo precisa ter sido enviado ANTES
   * (veja servicos/uploads.ts), pois aqui só vai o endereço dele.
   * "Omit" = todos os campos de Post, menos os que o servidor cria ou traz junto.
   */
  create: (post: Omit<Post, 'id' | 'user' | 'likes' | 'comments'>) =>
    http.post<Post>('/posts', post),

  // Apaga uma publicação (o servidor só deixa o dono apagar)
  remove: (id: number) => http.delete(`/posts/${id}`),

  // Curtir: cria um registro de curtida ligando o usuário à publicação
  like: (postId: number, userId: number) => http.post<Like>('/likes', { postId, userId }),

  // Descurtir: apaga o registro de curtida
  unlike: (likeId: number) => http.delete(`/likes/${likeId}`),
}
