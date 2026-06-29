// src/features/rss-news/rss-news-loader.js
// Responsável por buscar as notícias da API e normalizar a resposta

import { API_URL } from '../../config/api-config.js';
import { mostrarToast } from '../../utils/utils.js';

/**
 * Busca as notícias da API Agro RSS.
 *
 * A API v2 retorna um envelope { total, count, news, _meta }.
 * Esta função extrai e retorna apenas o array `news` para manter
 * o restante do frontend inalterado.
 *
 * @param {{ region?: string, limit?: number, offset?: number }} [options]
 * @returns {Promise<Array>} Array de notícias normalizadas
 */
export async function fetchRssNews(options = {}) {
  try {
    // Monta query string com os filtros recebidos
    const params = new URLSearchParams();
    if (options.region) params.set('region', options.region);
    if (options.limit)  params.set('limit',  options.limit);
    if (options.offset) params.set('offset', options.offset);

    const qs  = params.toString() ? `?${params.toString()}` : '';
    const url = `${API_URL}/news${qs}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // API v2 retorna envelope { total, count, news, _meta }
    // API v1 retorna array diretamente — suporta ambos para compatibilidade
    if (Array.isArray(data)) {
      return data;
    }

    if (data && Array.isArray(data.news)) {
      return data.news;
    }

    console.warn('Resposta da API em formato inesperado:', data);
    return [];

  } catch (error) {
    console.error('Erro ao buscar notícias RSS:', error);
    mostrarToast(`Falha ao buscar notícias: ${error.message}`, 'erro');
    return [];
  }
}
