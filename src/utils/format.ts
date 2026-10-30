/*
 * ============================================================
 *  FUNÇÕES DE FORMATAÇÃO
 * ============================================================
 * Pequenas ajudas para mostrar números, datas e nomes de forma amigável.
 */

/**
 * Deixa números grandes mais curtos.
 * Exemplos: 999 -> "999", 1234 -> "1,2 mil", 1500000 -> "1,5 mi"
 */
export function formatCount(n: number): string {
  // toFixed(1) deixa 1 casa decimal; replace troca o ponto por vírgula (padrão brasileiro)
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} mi`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.', ',')} mil`
  return String(n)
}

/**
 * Diz há quanto tempo algo aconteceu.
 * Exemplos: "agora", "5 min", "3 h", "2 d"
 * ou a data completa (dd/mm/aaaa) se passou de uma semana.
 */
export function timeAgo(iso: string): string {
  // Diferença entre agora e a data, em segundos
  const segundos = (Date.now() - new Date(iso).getTime()) / 1000
  if (segundos < 60) return 'agora' // menos de 1 minuto
  if (segundos < 3600) return `${Math.floor(segundos / 60)} min` // menos de 1 hora
  if (segundos < 86400) return `${Math.floor(segundos / 3600)} h` // menos de 1 dia
  if (segundos < 604800) return `${Math.floor(segundos / 86400)} d` // menos de 1 semana
  return new Date(iso).toLocaleDateString('pt-BR')
}

/**
 * Pega as iniciais de um nome (usado quando a pessoa não tem foto).
 * Exemplos: "João Vitor" -> "JV", "maria" -> "M", "" -> "?"
 */
export function initials(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (!partes.length) return '?'
  // Primeira letra do primeiro nome + primeira letra do último nome (se houver)
  const primeira = partes[0]?.[0] ?? ''
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : ''
  return (primeira + ultima).toUpperCase()
}
