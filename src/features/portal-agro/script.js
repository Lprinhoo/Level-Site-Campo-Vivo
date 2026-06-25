import { mostrarToast } from '../../utils/utils.js';
import { COR_CAT, LABEL_CAT, THUMB_CAT } from '../../data/category-data.js';
import { openModal, closeModal } from '../modals/modal-manager.js';
import { fetchRssNews } from '../rss-news/rss-news-loader.js'; // Importa a função para buscar notícias RSS

document.addEventListener('DOMContentLoaded', () => {

  // ════════════════════════════════════════════════
  // VARIÁVEIS GLOBAIS DO MÓDULO
  // ════════════════════════════════════════════════
  let allNews = []; // Armazena todas as notícias RSS carregadas

  // ════════════════════════════════════════════════
  // 0. DARK MODE
  // ════════════════════════════════════════════════

  const btnDarkMode = document.getElementById('toggleDarkMode');

  function updateDarkModeIcon() {
    if (btnDarkMode) {
      btnDarkMode.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
    }
  }

  // O tema inicial agora é aplicado no topo do body no HTML para evitar flashes.
  // Aqui apenas sincronizamos o ícone correto.
  updateDarkModeIcon();

  btnDarkMode?.addEventListener('click', () => {
    // Dispara a animação adicionando a classe e removendo após o término (450ms)
    btnDarkMode.classList.add('theme-animating');
    setTimeout(() => btnDarkMode.classList.remove('theme-animating'), 450);

    document.body.classList.toggle('dark-mode');
    updateDarkModeIcon();
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
  });

  // ════════════════════════════════════════════════
  // 1. DATA AUTOMÁTICA NA TOPBAR
  // ════════════════════════════════════════════════

  const topbarTime = document.querySelector('.topbar time');
  if (topbarTime) {
    const d = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    topbarTime.textContent = d.charAt(0).toUpperCase() + d.slice(1);
    topbarTime.setAttribute('datetime', new Date().toISOString().split('T')[0]);
  }

  // ════════════════════════════════════════════════
  // 2. EFEITO HEADER AO ROLAR
  // ════════════════════════════════════════════════

  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    if (!header) return;
    if (window.scrollY > 50) {
      header.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
    } else {
      header.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
    }
  }, { passive: true });

  // ════════════════════════════════════════════════
  // 3. BUSCA OVERLAY
  // ════════════════════════════════════════════════

  const buscaOverlay = document.getElementById('buscaOverlay');
  const buscaInput   = document.getElementById('busca-input-field');
  const btnAbrirBusca  = document.getElementById('abrirBusca');
  const btnFecharBusca = document.getElementById('fecharBusca');

  function abrirBusca() {
    if (!buscaOverlay) return;
    openModal(buscaOverlay, btnAbrirBusca);
    btnAbrirBusca?.setAttribute('aria-expanded', 'true');
    setTimeout(() => buscaInput?.focus(), 80);
  }

  function fecharBusca() {
    if (!buscaOverlay) return;
    closeModal(buscaOverlay);
    btnAbrirBusca?.setAttribute('aria-expanded', 'false');
  }

  btnAbrirBusca?.addEventListener('click', abrirBusca);
  btnFecharBusca?.addEventListener('click', fecharBusca);
  buscaOverlay?.addEventListener('click', e => { if (e.target === buscaOverlay) fecharBusca(); });

  // Sugestões de busca via teclado
  document.querySelectorAll('.busca-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      if (buscaInput) buscaInput.value = tag.textContent;
      buscaInput?.focus();
    });
  });

  // ════════════════════════════════════════════════
  // 4. TABS DE CATEGORIAS
  // ════════════════════════════════════════════════

  document.querySelectorAll('.categorias-tabs').forEach(container => {
    container.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const categoriaSelecionada = tab.textContent.trim();

        container.querySelectorAll('.tab').forEach(t => {
          t.classList.remove('ativo');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('ativo');
        tab.setAttribute('aria-selected', 'true');

        filterAndRenderNews(categoriaSelecionada);
      });
    });
  });

  function filterAndRenderNews(selectedCategory) {
    // Limpa todos os contêineres antes de renderizar
    document.getElementById('heroPrincipalContainer').innerHTML = '';
    document.getElementById('heroSidebarContainer').innerHTML = '';
    document.getElementById('noticiasGrid').innerHTML = '';
    document.getElementById('analiseGridContainer').innerHTML = '';
    document.getElementById('listaNoticias').innerHTML = '';
    document.getElementById('maisLidasList').innerHTML = '';
    document.getElementById('rssNewsContainer').innerHTML = ''; // Limpa também o contêiner RSS

    const filteredNews = allNews.filter(newsItem => {
      // Normaliza a categoria da notícia para comparação
      const newsCategory = newsItem.category ? newsItem.category.trim() : 'Outros';
      // Normaliza a categoria selecionada para comparação
      const normalizedSelectedCategory = selectedCategory.trim();

      // Verifica se a categoria da notícia corresponde à categoria selecionada
      // ou se a categoria selecionada é "Tudo"
      return normalizedSelectedCategory === 'Tudo' || newsCategory === normalizedSelectedCategory;
    });

    // Renderiza as notícias filtradas
    renderNewsSections(filteredNews);
  }

  // ════════════════════════════════════════════════
  // 5. MODAL DE LEITURA DE NOTÍCIA
  // ════════════════════════════════════════════════

  const modalNoticia  = document.getElementById('modalNoticia');
  const modalTitulo   = document.getElementById('modalTitulo');
  const modalTag      = document.getElementById('modalTag');
  const modalTexto    = document.getElementById('modalTexto');
  const modalData     = document.getElementById('modalData');

  function abrirModalNoticia(titulo, categoria, cor, texto, data) {
    if (!modalNoticia) return;
    modalTitulo.textContent = titulo;
    modalTag.textContent    = categoria;
    modalTag.style.backgroundColor = cor || 'var(--verde)';
    modalTexto.textContent  = texto;
    modalData.textContent   = data || 'Agora mesmo';
    openModal(modalNoticia);
  }

  function fecharModalNoticia() {
    if (!modalNoticia) return;
    closeModal(modalNoticia);
  }

  document.getElementById('fecharModal')?.addEventListener('click', fecharModalNoticia);
  document.getElementById('btnVoltarModal')?.addEventListener('click', fecharModalNoticia);
  modalNoticia?.addEventListener('click', e => { if (e.target === modalNoticia) fecharModalNoticia(); });

  // ════════════════════════════════════════════════
  // 6. DELEGAÇÃO DE EVENTOS: CLIQUE EM CARDS
  // ════════════════════════════════════════════════

  document.body.addEventListener('click', e => {
    // Abrir modal de leitura
    const card = e.target.closest('.noticia-clicavel');
    if (card) {
      const data = card.getAttribute('data-data') || 'Agora mesmo'; // Usar data do atributo
      abrirModalNoticia(
        card.getAttribute('data-titulo'),
        card.getAttribute('data-categoria'),
        card.getAttribute('data-cor'),
        card.getAttribute('data-texto'),
        data,
      );
    }
  });

  // ════════════════════════════════════════════════
  // 7. NAVEGAÇÃO DE VIEWS (HOME / ADMIN)
  // ════════════════════════════════════════════════

  const modalLogin    = document.getElementById('modalLogin');
  const linkLogin     = document.getElementById('linkLogin');
  const btnFecharLogin = document.getElementById('fecharLogin');
  const formLogin     = document.getElementById('formLogin');

  function trocarView(targetId, activeLink) {
    document.querySelectorAll('.nav-link, #linkLogin').forEach(l => l.classList.remove('ativo'));
    activeLink.classList.add('ativo');
    document.querySelectorAll('.view-section').forEach(v => {
      v.id === targetId ? v.classList.remove('hidden') : v.classList.add('hidden');
    });
    document.body.classList.toggle('admin-mode', targetId === 'admin-view');
  }

  function fecharLogin() {
    if (!modalLogin) return;
    closeModal(modalLogin);
  }

  linkLogin?.addEventListener('click', e => {
    e.preventDefault();
    const target = linkLogin.getAttribute('data-target');
    if (target) {
      trocarView(target, linkLogin);
    } else {
      if (!modalLogin) return;
      openModal(modalLogin, linkLogin);
    }
  });

  btnFecharLogin?.addEventListener('click', fecharLogin);
  modalLogin?.addEventListener('click', e => { if (e.target === modalLogin) fecharLogin(); });

  formLogin?.addEventListener('submit', e => {
    e.preventDefault();
    const user = document.getElementById('loginUser')?.value;
    const pass = document.getElementById('loginPass')?.value;

    if (user === 'admin' && pass === '1234') {
      fecharLogin();
      mostrarToast('Acesso concedido. Bem-vindo, Editor!');
      linkLogin.textContent = '⚙️ Painel Admin';
      linkLogin.setAttribute('data-target', 'admin-view');
      linkLogin.style.color = 'var(--terra)';
      linkLogin.classList.add('nav-link');
      trocarView('admin-view', linkLogin);
    } else {
      mostrarToast('Usuário ou senha incorretos', 'erro');
    }
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      trocarView(link.getAttribute('data-target'), link);
    });
  });

  // ════════════════════════════════════════════════
  // 8. NEWSLETTER
  // ════════════════════════════════════════════════

  const newsForm = document.querySelector('.newsletter-form');
  newsForm?.addEventListener('submit', e => {
    e.preventDefault();
    const email  = newsForm.querySelector('input[type="email"]').value;
    const btn    = newsForm.querySelector('button');
    const orig   = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    setTimeout(() => {
      alert(`Obrigado! O e-mail ${email} foi cadastrado.`);
      btn.disabled   = false;
      btn.textContent = orig;
      newsForm.reset();
    }, 1000);
  });

  // ════════════════════════════════════════════════
  // 9. MODAL GERAR NOTÍCIA COM IA (REMOVIDO)
  // ════════════════════════════════════════════════

  // A funcionalidade de IA foi removida.
  // Os elementos e eventos relacionados a ela não são mais necessários.

  // ════════════════════════════════════════════════
  // FUNÇÕES DE RENDERIZAÇÃO DE NOTÍCIAS RSS
  // ════════════════════════════════════════════════

  function getCategoryInfo(newsItem) {
    // Tenta mapear a categoria da notícia RSS para uma das categorias predefinidas
    const itemCategory = newsItem.category || newsItem.source; // Usa source como fallback
    let categoryKey = 'Outros'; // Categoria padrão

    // Tenta encontrar uma correspondência flexível
    for (const key in LABEL_CAT) {
      if (newsItem.title.toLowerCase().includes(LABEL_CAT[key].toLowerCase()) ||
          itemCategory.toLowerCase().includes(LABEL_CAT[key].toLowerCase())) {
        categoryKey = key;
        break;
      }
    }
    // Se a fonte for "Conexão Agro" ou "Agro2", tenta inferir a categoria do título
    if (newsItem.source.toLowerCase().includes('conexão agro') || newsItem.source.toLowerCase().includes('agro2')) {
      if (newsItem.title.toLowerCase().includes('soja') || newsItem.title.toLowerCase().includes('milho') || newsItem.title.toLowerCase().includes('grãos')) {
        categoryKey = 'Graos';
      } else if (newsItem.title.toLowerCase().includes('pecuária') || newsItem.title.toLowerCase().includes('boi') || newsItem.title.toLowerCase().includes('carne')) {
        categoryKey = 'Pecuaria';
      } else if (newsItem.title.toLowerCase().includes('tecnologia') || newsItem.title.toLowerCase().includes('inovação') || newsItem.title.toLowerCase().includes('digital')) {
        categoryKey = 'Tecnologia';
      } else if (newsItem.title.toLowerCase().includes('clima') || newsItem.title.toLowerCase().includes('chuva') || newsItem.title.toLowerCase().includes('tempo')) {
        categoryKey = 'Clima';
      } else if (newsItem.title.toLowerCase().includes('mercado') || newsItem.title.toLowerCase().includes('preço') || newsItem.title.toLowerCase().includes('cotação')) {
        categoryKey = 'Mercado';
      } else if (newsItem.title.toLowerCase().includes('política') || newsItem.title.toLowerCase().includes('governo') || newsItem.title.toLowerCase().includes('safra')) {
        categoryKey = 'Politica';
      }
    }


    return {
      category: LABEL_CAT[categoryKey] || 'Outros',
      color: COR_CAT[categoryKey] || 'var(--verde)',
      thumb: THUMB_CAT[categoryKey] || { emoji: '📰', bg: 'linear-gradient(135deg,#EAF3DE,#c0dd97)' }
    };
  }

  function renderHeroPrincipal(newsItem) {
    const container = document.getElementById('heroPrincipalContainer');
    if (!container || !newsItem) return;

    const { category, color, thumb } = getCategoryInfo(newsItem);
    const formattedDate = newsItem.date ? new Date(newsItem.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Agora mesmo';
    const description = newsItem.contentSnippet || newsItem.description || '';

    container.innerHTML = `
      <article class="hero-principal noticia-clicavel"
               data-titulo="${newsItem.title}"
               data-categoria="${category}"
               data-cor="${color}"
               data-texto="${description}"
               data-data="${formattedDate}"
               data-link="${newsItem.link}">
        <div class="hero-img-box">
          ${thumb ? `<svg class="hero-deco" viewBox="0 0 200 200" fill="none" aria-hidden="true">
            <path d="M100 180 Q100 100 100 20" stroke="white" stroke-width="3"/>
            <path d="M100 140 Q80 120 60 130" stroke="white" stroke-width="2.5"/>
            <path d="M100 120 Q120 100 140 110" stroke="white" stroke-width="2.5"/>
            <path d="M100 100 Q78 80 58 90" stroke="white" stroke-width="2.5"/>
            <path d="M100 80 Q122 60 142 70" stroke="white" stroke-width="2.5"/>
            <ellipse cx="60" cy="130" rx="14" ry="8" fill="white" transform="rotate(-30 60 130)"/>
            <ellipse cx="140" cy="110" rx="14" ry="8" fill="white" transform="rotate(30 140 110)"/>
            <ellipse cx="58" cy="90" rx="14" ry="8" fill="white" transform="rotate(-30 58 90)"/>
            <ellipse cx="142" cy="70" rx="14" ry="8" fill="white" transform="rotate(30 142 70)"/>
          </svg>` : ''}
          <div class="hero-content-overlay">
            <span class="hero-tag" style="background:${color}">${category}</span>
            <h2 id="hero-title">${newsItem.title}</h2>
          </div>
        </div>
        <div class="hero-principal-body">
          <p>${description.substring(0, 200)}...</p>
          <div class="hero-meta">
            <span class="autor">${newsItem.source}</span>
            <span aria-hidden="true">•</span>
            <time>${formattedDate}</time>
            <span aria-hidden="true">•</span>
            <span>Leia mais</span>
          </div>
        </div>
      </article>
    `;
  }

  function renderHeroSidebarCard(newsItem, container) {
    if (!container || !newsItem) return;

    const { category, color } = getCategoryInfo(newsItem);
    const description = newsItem.contentSnippet || newsItem.description || '';

    const card = document.createElement('article');
    card.className = 'hero-card noticia-clicavel';
    card.setAttribute('data-titulo', newsItem.title);
    card.setAttribute('data-categoria', category);
    card.setAttribute('data-cor', color);
    card.setAttribute('data-texto', description);
    card.setAttribute('data-data', newsItem.date ? new Date(newsItem.date).toLocaleDateString('pt-BR') : 'Agora mesmo');
    card.setAttribute('data-link', newsItem.link);

    card.innerHTML = `
      <span class="hero-card-tag" style="color:${color}">${category}</span>
      <h3>${newsItem.title}</h3>
    `;
    container.appendChild(card);
  }

  function renderNoticiaCard(newsItem, container) {
    const { category, color, thumb } = getCategoryInfo(newsItem);
    const formattedDate = newsItem.date ? new Date(newsItem.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'Agora mesmo';
    const description = newsItem.contentSnippet || newsItem.description || '';

    const card = document.createElement('article');
    card.className = 'noticia-card noticia-clicavel';
    card.setAttribute('data-post-id', newsItem.link); // Usar link como ID único
    card.setAttribute('data-titulo', newsItem.title);
    card.setAttribute('data-categoria', category);
    card.setAttribute('data-cor', color);
    card.setAttribute('data-texto', description);
    card.setAttribute('data-data', formattedDate);
    card.setAttribute('data-link', newsItem.link);

    card.innerHTML = `
      <div class="noticia-thumb" style="background:${thumb.bg}" aria-hidden="true">${thumb.emoji}</div>
      <div class="noticia-body">
        <span class="noticia-cat" style="color:${color}">${category}</span>
        <h3>${newsItem.title}</h3>
        <p>${description.substring(0, 120)}...</p>
        <div class="hero-meta"><time>${formattedDate}</time></div>
      </div>
    `;
    container.appendChild(card);
  }

  function renderAnaliseCard(newsItem, container) {
    const { category, color } = getCategoryInfo(newsItem);
    const description = newsItem.contentSnippet || newsItem.description || '';

    const card = document.createElement('article');
    card.className = 'analise-card noticia-clicavel';
    card.setAttribute('data-titulo', newsItem.title);
    card.setAttribute('data-categoria', category);
    card.setAttribute('data-cor', color);
    card.setAttribute('data-texto', description);
    card.setAttribute('data-data', newsItem.date ? new Date(newsItem.date).toLocaleDateString('pt-BR') : 'Agora mesmo');
    card.setAttribute('data-link', newsItem.link);

    card.innerHTML = `
      <div class="analise-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z"/></svg>
      </div>
      <div class="analise-body">
        <span class="noticia-cat" style="color:${color}">${category}</span>
        <h3>${newsItem.title}</h3>
        <p>Por ${newsItem.source} — ${category}</p>
      </div>
    `;
    container.appendChild(card);
  }

  function renderMaisLidaItem(newsItem, container, index) {
    const { category, color } = getCategoryInfo(newsItem);
    const formattedDate = newsItem.date ? new Date(newsItem.date).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Agora mesmo';
    const description = newsItem.contentSnippet || newsItem.description || '';

    const item = document.createElement('li');
    item.className = 'mais-lida-item noticia-clicavel';
    item.setAttribute('data-titulo', newsItem.title);
    item.setAttribute('data-categoria', category);
    item.setAttribute('data-cor', color);
    item.setAttribute('data-texto', description);
    item.setAttribute('data-data', newsItem.date ? new Date(newsItem.date).toLocaleDateString('pt-BR') : 'Agora mesmo');
    item.setAttribute('data-link', newsItem.link);

    item.innerHTML = `
      <span class="mais-lida-num">${String(index + 1).padStart(2, '0')}</span>
      <div class="mais-lida-content">
        <div class="mais-lida-titulo">${newsItem.title}</div>
        <div class="mais-lida-meta">${newsItem.source} • ${formattedDate}</div>
      </div>
    `;
    container.appendChild(item);
  }

  function renderRssNewsItem(newsItem, container) {
    if (!container || !newsItem) return;

    const formattedDate = newsItem.date ? new Date(newsItem.date).toLocaleDateString('pt-BR') : 'Data desconhecida';

    const item = document.createElement("div");
    item.className = "rss-news-item"; // Adiciona uma classe para estilização futura

    item.innerHTML = `
      <h3><a href="${newsItem.link}" target="_blank" rel="noopener noreferrer">${newsItem.title}</a></h3>
      <p>${newsItem.source} • ${formattedDate}</p>
      <hr/>
    `;
    container.appendChild(item);
  }

  function renderNewsSections(newsData) {
    const heroPrincipalContainer = document.getElementById('heroPrincipalContainer');
    const heroSidebarContainer = document.getElementById('heroSidebarContainer');
    const noticiasGrid = document.getElementById('noticiasGrid');
    const analiseGridContainer = document.getElementById('analiseGridContainer');
    const maisLidasList = document.getElementById('maisLidasList');
    const rssNewsContainer = document.getElementById('rssNewsContainer');

    // Limpa os contêineres antes de renderizar
    heroPrincipalContainer.innerHTML = '';
    heroSidebarContainer.innerHTML = '';
    noticiasGrid.innerHTML = '';
    analiseGridContainer.innerHTML = '';
    maisLidasList.innerHTML = '';
    rssNewsContainer.innerHTML = '';

    if (newsData.length === 0) {
      noticiasGrid.innerHTML = '<p>Nenhuma notícia encontrada para esta categoria.</p>';
      rssNewsContainer.innerHTML = '<p>Nenhuma notícia RSS disponível no momento.</p>';
      return;
    }

    let newsIndex = 0;

    // Hero Principal (1ª notícia)
    if (newsData[newsIndex]) {
      renderHeroPrincipal(newsData[newsIndex]);
      newsIndex++;
    }

    // Hero Sidebar (2ª e 3ª notícias)
    for (let i = 0; i < 2 && newsData[newsIndex]; i++) {
      renderHeroSidebarCard(newsData[newsIndex], heroSidebarContainer);
      newsIndex++;
    }

    // Últimas Notícias (a partir da próxima notícia disponível, 3 cards)
    for (let i = 0; i < 3 && newsData[newsIndex]; i++) {
      renderNoticiaCard(newsData[newsIndex], noticiasGrid);
      newsIndex++;
    }

    // Análise de Mercado (2 cards)
    for (let i = 0; i < 2 && newsData[newsIndex]; i++) {
      renderAnaliseCard(newsData[newsIndex], analiseGridContainer);
      newsIndex++;
    }

    // Em Alta Agora (3 itens)
    for (let i = 0; i < 3 && newsData[newsIndex]; i++) {
      renderMaisLidaItem(newsData[newsIndex], maisLidasList, i);
      newsIndex++;
    }

    // Notícias RSS (os próximos 5 itens restantes, se houver)
    for (let i = 0; i < 5 && newsData[newsIndex]; i++) {
      renderRssNewsItem(newsData[newsIndex], rssNewsContainer);
      newsIndex++;
    }
    
    // Se não houver notícias para o contêiner RSS, exibe mensagem
    if (rssNewsContainer.innerHTML === '') {
      rssNewsContainer.innerHTML = '<p>Nenhuma notícia RSS disponível no momento.</p>';
    }

    mostrarToast("Notícias RSS carregadas com sucesso!", "sucesso");
  }

  // ════════════════════════════════════════════════
  // Inicialização do Carregador de Notícias RSS
  // ════════════════════════════════════════════════

  // Função de inicialização principal
  async function initNewsLoading() {
    try {
      const news = await fetchRssNews(); // Chama a função para buscar os dados
      if (news && news.length > 0) {
        allNews = news; // Armazena todas as notícias
        renderNewsSections(allNews); // Renderiza as seções iniciais
      } else {
        mostrarToast("Nenhuma notícia RSS disponível.", "info");
      }
    } catch (error) {
      console.error("Erro na inicialização do carregador RSS:", error);
      mostrarToast("Falha ao carregar notícias RSS.", "erro");
    }
  }

  initNewsLoading(); // Chama a função de inicialização

  // ════════════════════════════════════════════════
  // 11. PLAYER MULTIMÍDIA
  // ════════════════════════════════════════════════

  const multimidiaMain = document.querySelector('.multimidia-main');
  const multimidiaItems = document.querySelectorAll('.multimidia-item');

  multimidiaItems.forEach(item => {
    item.addEventListener('click', () => {
      const novaImg = item.getAttribute('data-img');
      const novoTitulo = item.getAttribute('data-titulo');
      const tipo = item.getAttribute('data-tipo');

      const placeholder = multimidiaMain.querySelector('.multimidia-video-placeholder');
      const playerImg = multimidiaMain.querySelector('img');
      const playerTitle = multimidiaMain.querySelector('h3');
      const playBtn = multimidiaMain.querySelector('.play-button');
      const tag = multimidiaMain.querySelector('.multimidia-tag');

      // 1. Inicia o Fade Out
      placeholder?.classList.add('fading');

      // 2. Aguarda a transição (300ms) antes de trocar o conteúdo
      setTimeout(() => {
        if (playerImg) playerImg.src = novaImg;
        if (playerTitle) playerTitle.textContent = novoTitulo;
        if (tag) tag.textContent = tipo === 'video' ? 'Vídeo' : 'Galeria';
        if (playBtn) playBtn.style.display = tipo === 'video' ? 'flex' : 'none';

        // 3. Inicia o Fade In
        placeholder?.classList.remove('fading');
      }, 300);
      
      multimidiaMain.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });

  // ════════════════════════════════════════════════
  // 10. FUNÇÕES GLOBAIS E AUXILIARES
  // ════════════════════════════════════════════════

  // O listener global de keydown para 'Escape' foi movido para modal-manager.js

});