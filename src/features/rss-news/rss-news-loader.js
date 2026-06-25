import { mostrarToast } from '../../utils/utils.js';

export async function fetchRssNews() {
  try {
    const response = await fetch("http://localhost:3000/news");
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao buscar notícias RSS:", error);
    mostrarToast(`Falha ao buscar notícias RSS: ${error.message}`, "erro");
    return []; // Retorna um array vazio em caso de erro
  }
}