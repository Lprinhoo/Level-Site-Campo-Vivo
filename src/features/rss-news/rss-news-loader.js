import { mostrarToast } from '../../utils/utils.js';

export function initializeRssNewsLoader() {
  fetch("http://localhost:3000/news")
    .then(res => {
      if (!res.ok) {
        throw new Error(`Erro HTTP: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      const container = document.getElementById("rssNewsContainer");
      if (!container) {
        console.warn("Contêiner #rssNewsContainer não encontrado para notícias RSS.");
        return;
      }

      // Limpa o conteúdo existente antes de adicionar novas notícias
      container.innerHTML = '';

      if (data.length === 0) {
        container.innerHTML = '<p>Nenhuma notícia RSS disponível no momento.</p>';
        return;
      }

      data.forEach(n => {
        const item = document.createElement("div");
        item.className = "rss-news-item"; // Adiciona uma classe para estilização futura

        // Garante que a data seja formatada corretamente, mesmo se n.date for nulo ou inválido
        const formattedDate = n.date ? new Date(n.date).toLocaleDateString('pt-BR') : 'Data desconhecida';

        item.innerHTML = `
          <h3><a href="${n.link}" target="_blank" rel="noopener noreferrer">${n.title}</a></h3>
          <p>${n.source} • ${formattedDate}</p>
          <hr/>
        `;
        container.appendChild(item);
      });
      mostrarToast("Notícias RSS carregadas com sucesso!", "sucesso");
    })
    .catch(error => {
      console.error("Erro ao carregar notícias RSS:", error);
      mostrarToast(`Falha ao carregar notícias RSS: ${error.message}`, "erro");
    });
}
