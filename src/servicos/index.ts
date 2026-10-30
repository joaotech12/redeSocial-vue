/*
 * Ponto único de importação dos serviços.
 * Assim, em outros arquivos basta escrever, por exemplo:
 *   import { postsApi, usersApi } from '@/servicos'
 * em vez de importar cada arquivo separadamente.
 */
export { usersApi } from './users'
export { postsApi } from './posts'
export { commentsApi } from './comments'
