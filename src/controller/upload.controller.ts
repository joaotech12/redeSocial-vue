/*
 * ============================================================
 *  CONTROLLER DE ARQUIVOS (fotos e vídeos)
 * ============================================================
 * Toda foto e todo vídeo da rede social é enviado do aparelho do usuário
 * para o NOSSO servidor (pasta servidor/uploads). Nada vem de sites externos.
 *
 * Este arquivo também guarda as regras de tamanho e tipo de arquivo,
 * que são as mesmas conferidas pelo servidor (servidor/server.js).
 */
import { serviceController } from './service.controller'
import type { MediaType, UploadResponse } from '@/interfaces/post.interface'

// Tamanhos máximos em MB (iguais aos do servidor)
export const LIMITE_MB: Record<MediaType, number> = {
  image: 10,
  video: 100,
}

// Tipos de arquivo aceitos (iguais aos do servidor)
const TIPOS_ACEITOS: Record<string, MediaType> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/quicktime': 'video',
  'video/ogg': 'video',
}

// Texto para o seletor de arquivos (<input type="file" accept="...">)
export const ACEITA_FOTOS = 'image/jpeg,image/png,image/gif,image/webp'
export const ACEITA_FOTOS_E_VIDEOS = Object.keys(TIPOS_ACEITOS).join(',')

/**
 * Confere um arquivo ANTES de enviar, para avisar o usuário rapidinho.
 * Devolve uma mensagem de erro, ou null se estiver tudo certo.
 * (O servidor confere tudo de novo, por segurança.)
 */
export function validarArquivo(arquivo: File, somenteFotos = false): string | null {
  const tipo = TIPOS_ACEITOS[arquivo.type]
  if (!tipo || (somenteFotos && tipo !== 'image')) {
    return somenteFotos
      ? 'Escolha uma foto (JPG, PNG, GIF ou WEBP)'
      : 'Escolha uma foto (JPG, PNG, GIF, WEBP) ou vídeo (MP4, WEBM, MOV)'
  }
  // 1 MB = 1024 * 1024 bytes
  if (arquivo.size > LIMITE_MB[tipo] * 1024 * 1024) {
    const nome = tipo === 'image' ? 'A foto' : 'O vídeo'
    return `${nome} deve ter no máximo ${LIMITE_MB[tipo]} MB`
  }
  return null
}

// Diz se o arquivo é foto ou vídeo (usado para mostrar a pré-visualização certa)
export function tipoDoArquivo(arquivo: File): MediaType | null {
  return TIPOS_ACEITOS[arquivo.type] ?? null
}

/**
 * Envia o arquivo para o servidor.
 * Devolve o endereço onde ele ficou salvo e se é foto ou vídeo.
 * "aoProgredir" recebe a porcentagem já enviada (0 a 100).
 */
export function enviarArquivo(arquivo: File, aoProgredir?: (porcento: number) => void) {
  // FormData é o "envelope" usado para mandar arquivos pela internet
  const dados = new FormData()
  dados.append('arquivo', arquivo) // "arquivo" é o nome que o servidor espera
  return serviceController.enviarArquivo<UploadResponse>('/upload', dados, aoProgredir)
}
