/*
 * ============================================================
 *  CONEXÃO COM A API
 * ============================================================
 * Todas as conversas entre o site e o servidor passam por este arquivo.
 * Ele:
 *  1. monta o pedido (endereço, tipo, conteúdo);
 *  2. anexa o "crachá" (token) de quem está logado;
 *  3. traduz as mensagens de erro do servidor para português.
 */

// Endereço base da API. O Vite redireciona /api para o servidor na porta 3001
// (veja vite.config.ts).
const BASE_URL = '/api'

/*
 * Estas duas funções começam "vazias" e são preenchidas pelo módulo
 * de login (estado/useAuth.ts). Fazemos assim para este arquivo não
 * precisar importar o módulo de login (evita um importar o outro em círculo).
 */
let obterToken: () => string | null = () => null
let aoExpirarSessao: () => void = () => {}

/**
 * Permite que o módulo de login informe qual é o token atual
 * e o que fazer quando a sessão expirar.
 */
export function configurarAutenticacao(opcoes: {
  obterToken: () => string | null
  aoExpirarSessao: () => void
}) {
  obterToken = opcoes.obterToken
  aoExpirarSessao = opcoes.aoExpirarSessao
}

// Mensagens de erro do json-server-auth (em inglês) traduzidas para português
const TRADUCOES: Record<string, string> = {
  'Email already exists': 'Esse e-mail já está cadastrado',
  'Email format is invalid': 'Informe um e-mail válido',
  'Email and password are required': 'Informe e-mail e senha',
  'Password is too short': 'A senha precisa ter pelo menos 4 caracteres',
  'Cannot find user': 'E-mail ou senha inválidos',
  'Incorrect password': 'E-mail ou senha inválidos',
  'jwt expired': 'Sua sessão expirou. Entre novamente.',
}

// Monta o cabeçalho de autorização ("Bearer <token>"), se o usuário estiver logado
function cabecalhoDeLogin(): Record<string, string> {
  const token = obterToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/*
 * Transforma a resposta de erro do servidor numa mensagem compreensível.
 * Códigos de erro mais comuns:
 *   400 = pedido com algum dado errado
 *   401 = não está logado (ou o login expirou)
 *   403 = está logado, mas não tem permissão (ex.: apagar algo de outra pessoa)
 */
function criarErro(status: number, corpo: unknown): Error {
  // Se tinha token e mesmo assim deu 401, o login expirou: desloga
  if (status === 401 && obterToken()) aoExpirarSessao()

  const mensagem = typeof corpo === 'string' ? corpo : ''
  if (TRADUCOES[mensagem]) return new Error(TRADUCOES[mensagem])
  if (status === 401) return new Error('Você precisa entrar na sua conta')
  if (status === 403) return new Error('Você não tem permissão para fazer isso')
  // Mensagens que o nosso servidor já manda em português aparecem como estão
  return new Error(mensagem || `Erro ${status} ao falar com o servidor`)
}

// Função principal que faz qualquer pedido de dados (texto/JSON) à API
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...cabecalhoDeLogin() },
  })
  // Tenta ler a resposta como JSON (se não der, fica null)
  const corpo = await res.json().catch(() => null)
  // res.ok é falso quando o servidor respondeu com erro (status 400 ou mais)
  if (!res.ok) throw criarErro(res.status, corpo)
  return corpo as T
}

// Atalhos para cada tipo de pedido
export const http = {
  // GET = buscar dados
  get: <T>(path: string) => request<T>(path),

  // POST = criar algo novo
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  // PATCH = alterar parte de algo que já existe
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),

  // DELETE = apagar
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),

  /**
   * Envia um arquivo (foto ou vídeo) e avisa o progresso de 0 a 100.
   * Usa XMLHttpRequest (jeito mais antigo de fazer pedidos) porque
   * o fetch não informa quanto do arquivo já foi enviado.
   */
  enviarArquivo<T>(path: string, dados: FormData, aoProgredir?: (porcento: number) => void) {
    return new Promise<T>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${BASE_URL}${path}`)

      // Anexa o token de login (o servidor só aceita arquivos de quem está logado)
      for (const [nome, valor] of Object.entries(cabecalhoDeLogin())) {
        xhr.setRequestHeader(nome, valor)
      }

      // Chamado várias vezes durante o envio: calcula a porcentagem enviada
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) aoProgredir?.(Math.round((e.loaded / e.total) * 100))
      }

      // Chamado quando o servidor responde
      xhr.onload = () => {
        let corpo: unknown = null
        try {
          corpo = JSON.parse(xhr.responseText)
        } catch {
          // resposta sem JSON: mantém corpo vazio
        }
        if (xhr.status >= 200 && xhr.status < 300) resolve(corpo as T)
        else reject(criarErro(xhr.status, corpo))
      }

      // Chamado se a conexão cair (ex.: servidor desligado)
      xhr.onerror = () => reject(new Error('Falha de conexão ao enviar o arquivo'))

      xhr.send(dados)
    })
  },
}
