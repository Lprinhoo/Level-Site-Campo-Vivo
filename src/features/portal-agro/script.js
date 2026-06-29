import { mostrarToast } from '../../utils/utils.js';
import { COR_CAT, LABEL_CAT, THUMB_CAT } from '../../data/category-data.js';
import { openModal, closeModal } from '../modals/modal-manager.js';
import { fetchRssNews } from '../rss-news/rss-news-loader.js';

document.addEventListener('DOMContentLoaded', () => {

  // ════════════════════════════════════════════════
  // ESTADO GLOBAL
  // ════════════════════════════════════════════════
  const state = {
    allNews:         [],
    currentCategory: 'Tudo',
    currentSearch:   '',
    currentSort:     'recente',
  };

  // ════════════════════════════════════════════════
  // 0. DARK MODE
  // ════════════════════════════════════════════════
  const btnDarkMode = document.getElementById('toggleDarkMode');

  function updateDarkModeIcon() {
    if (!btnDarkMode) return;
    const dark = document.body.classList.contains('dark-mode');
    btnDarkMode.setAttribute('aria-label', dark ? 'Alternar para tema claro' : 'Alternar para tema escuro');
    btnDarkMode.innerHTML = dark
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
           <circle cx="12" cy="12" r="5"/>
           <line x1="12" y1="1" x2="12" y2="3"/>
           <line x1="12" y1="21" x2="12" y2="23"/>
           <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
           <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
           <line x1="1" y1="12" x2="3" y2="12"/>
           <line x1="21" y1="12" x2="23" y2="12"/>
           <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
           <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
         </svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
           <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
         </svg>`;
  }

  updateDarkModeIcon();

  btnDarkMode?.addEventListener('click', () => {
    btnDarkMode.classList.add('theme-animating');
    setTimeout(() => btnDarkMode.classList.remove('theme-animating'), 450);
    document.body.classList.toggle('dark-mode');
    updateDarkModeIcon();
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
  });

  // ════════════════════════════════════════════════
  // 1. DATA NA TOPBAR
  // ════════════════════════════════════════════════
  const topbarTime = document.getElementById('topbar-data');
  if (topbarTime) {
    const d = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    topbarTime.textContent = d.charAt(0).toUpperCase() + d.slice(1);
    topbarTime.setAttribute('datetime', new Date().toISOString().split('T')[0]);
  }

  // ════════════════════════════════════════════════
  // 2. HEADER SCROLL
  // ════════════════════════════════════════════════
  const header = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    header?.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  // ════════════════════════════════════════════════
  // 3. BUSCA OVERLAY
  // ════════════════════════════════════════════════
  const buscaOverlay   = document.getElementById('buscaOverlay');
  const buscaInput     = document.getElementById('busca-input-field');
  const btnAbrirBusca  = document.getElementById('abrirBusca');
  const btnFecharBusca = document.getElementById('fecharBusca');

  function abrirBusca() {
    if (!buscaOverlay) return;
    openModal(buscaOverlay, btnAbrirBusca);
    btnAbrirBusca?.setAttribute('aria-expanded', 'true');
    setTimeout(() => buscaInput?.focus(), 100);
  }

  function fecharBusca() {
    if (!buscaOverlay) return;
    closeModal(buscaOverlay);
    btnAbrirBusca?.setAttribute('aria-expanded', 'false');
  }

  btnAbrirBusca?.addEventListener('click', abrirBusca);
  btnFecharBusca?.addEventListener('click', fecharBusca);
  buscaOverlay?.addEventListener('click', e => { if (e.target === buscaOverlay) fecharBusca(); });

  document.querySelectorAll('.busca-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      if (buscaInput) { buscaInput.value = tag.textContent; buscaInput.focus(); }
    });
  });

  // ════════════════════════════════════════════════
  // 4. FILTROS POR CATEGORIA
  // ════════════════════════════════════════════════
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => {
        t.classList.remove('ativo');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('ativo');
      tab.setAttribute('aria-selected', 'true');
      state.currentCategory = tab.dataset.cat || 'Tudo';
      applyFiltersAndRender();
    });
  });

  // ════════════════════════════════════════════════
  // 5. BUSCA POR PALAVRA-CHAVE
  // ════════════════════════════════════════════════
  let searchDebounce;

  function onSearchInput(val) {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      state.currentSearch = val.trim().toLowerCase();
      // Sincroniza os dois campos
      const inline = document.getElementById('busca-inline');
      const hdr    = document.getElementById('header-search-input');
      if (inline && document.activeElement !== inline) inline.value = val;
      if (hdr    && document.activeElement !== hdr)    hdr.value    = val;
      applyFiltersAndRender();
    }, 280);
  }

  document.getElementById('busca-inline')?.addEventListener('input', e => onSearchInput(e.target.value));
  document.getElementById('header-search-input')?.addEventListener('input', e => onSearchInput(e.target.value));

  // ════════════════════════════════════════════════
  // 6. ORDENAÇÃO
  // ════════════════════════════════════════════════
  document.getElementById('sort-select')?.addEventListener('change', e => {
    state.currentSort = e.target.value;
    applyFiltersAndRender();
  });

  // ════════════════════════════════════════════════
  // 7. LÓGICA DE FILTRO + SORT + BUSCA
  // ════════════════════════════════════════════════
  function applyFiltersAndRender() {
    let result = [...state.allNews];

    if (state.currentCategory !== 'Tudo') {
      result = result.filter(n => getCategoryInfo(n).category === state.currentCategory);
    }

    if (state.currentSearch) {
      result = result.filter(n => {
        const hay = `${n.title || ''} ${n.contentSnippet || ''} ${n.description || ''}`.toLowerCase();
        return hay.includes(state.currentSearch);
      });
    }

    result.sort((a, b) => {
      const da = a.date ? new Date(a.date) : new Date(0);
      const db = b.date ? new Date(b.date) : new Date(0);
      return state.currentSort === 'recente' ? db - da : da - db;
    });

    renderAllSections(result);
  }

  // ════════════════════════════════════════════════
  // 8. MODAL DE NOTÍCIA
  // ════════════════════════════════════════════════
  const modalNoticia         = document.getElementById('modalNoticia');
  const modalTitulo          = document.getElementById('modalTitulo');
  const modalTag             = document.getElementById('modalTag');
  const modalTexto           = document.getElementById('modalTexto');
  const modalData            = document.getElementById('modalData');
  const modalFonte           = document.getElementById('modalFonte');
  const modalAtribuicao      = document.getElementById('modalAtribuicao');
  const modalAtribuicaoTexto = document.getElementById('modalAtribuicaoTexto');
  const modalLinkOriginal    = document.getElementById('modalLinkOriginal');

  function abrirModalNoticia({ titulo, categoria, cor, texto, data, link, fonte }) {
    if (!modalNoticia) { console.warn('Modal #modalNoticia não encontrado no DOM'); return; }

    modalTitulo.textContent = titulo  || 'Sem título';
    modalTag.textContent    = categoria || 'Notícia';
    modalTag.style.background = cor || 'var(--verde)';
    modalData.textContent   = data   || '';
    modalFonte.textContent  = fonte  || '';
    modalTexto.textContent  = texto  || '';

    if (modalAtribuicaoTexto) {
      modalAtribuicaoTexto.textContent =
        `Esta notícia foi originalmente publicada por ${fonte}. Para ler a matéria completa com todas as imagens e atualizações, acesse o veículo oficial.`;
    }

    if (modalLinkOriginal) {
      modalLinkOriginal.href = link || '#';
      modalLinkOriginal.style.background = cor || 'var(--verde)';
      modalLinkOriginal.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
        Ler matéria completa em <strong>${fonte}</strong>
      `;
    }

    if (modalAtribuicao) modalAtribuicao.style.borderLeftColor = cor || 'var(--verde)';

    openModal(modalNoticia);
  }

  function fecharModalNoticia() {
    closeModal(modalNoticia);
  }

  document.getElementById('fecharModal')?.addEventListener('click', fecharModalNoticia);
  document.getElementById('btnVoltarModal')?.addEventListener('click', fecharModalNoticia);
  modalNoticia?.addEventListener('click', e => { if (e.target === modalNoticia) fecharModalNoticia(); });

  // ════════════════════════════════════════════════
  // 9. DELEGAÇÃO DE CLIQUES — CARDS DE NOTÍCIA
  //    Regra: .btn-ler-mais → abre link externo
  //           qualquer outra área do card → abre modal
  // ════════════════════════════════════════════════
  document.body.addEventListener('click', e => {
    // Botão "Ler matéria" — é um <a> com target=_blank, deixa o browser agir
    if (e.target.closest('.btn-ler-mais')) return;

    const card = e.target.closest('.noticia-clicavel');
    if (!card) return;

    const fonte = card.getAttribute('data-fonte') || 'Fonte Original';
    const data  = card.getAttribute('data-data')  || '';

    abrirModalNoticia({
      titulo:    card.getAttribute('data-titulo')    || '',
      categoria: card.getAttribute('data-categoria') || '',
      cor:       card.getAttribute('data-cor')       || 'var(--verde)',
      texto:     card.getAttribute('data-texto')     || '',
      data:      data ? `${data} · Via ${fonte}` : `Via ${fonte}`,
      link:      card.getAttribute('data-link')      || '#',
      fonte,
    });
  });

  // Suporte a teclado nos cards
  document.body.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.noticia-clicavel');
    if (!card || e.target.closest('.btn-ler-mais')) return;
    e.preventDefault();
    card.click();
  });

  // ════════════════════════════════════════════════
  // 10. NEWSLETTER
  // ════════════════════════════════════════════════
  document.getElementById('newsletterForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const form  = e.currentTarget;
    const email = form.querySelector('input[type="email"]').value;
    const btn   = form.querySelector('button[type="submit"]');
    const orig  = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    setTimeout(() => {
      mostrarToast(`E-mail ${email} cadastrado com sucesso!`, 'sucesso');
      btn.disabled = false;
      btn.textContent = orig;
      form.reset();
    }, 1000);
  });

  // ════════════════════════════════════════════════
  // 11. MODAL ADICIONAR NOTÍCIA
  // ════════════════════════════════════════════════
  const modalAdicionar = document.getElementById('modalAdicionarNoticia');
  document.getElementById('fecharAdicionarNoticia')?.addEventListener('click', () => closeModal(modalAdicionar));
  modalAdicionar?.addEventListener('click', e => { if (e.target === modalAdicionar) closeModal(modalAdicionar); });

  document.getElementById('formAdicionarNoticia')?.addEventListener('submit', e => {
    e.preventDefault();
    const titulo = document.getElementById('noticiaTitulo')?.value.trim();
    const cat    = document.getElementById('noticiaCategoria')?.value.trim();
    const texto  = document.getElementById('noticiaTexto')?.value.trim();
    if (!titulo || !cat || !texto) {
      mostrarToast('Preencha todos os campos obrigatórios.', 'erro');
      return;
    }
    mostrarToast('Notícia adicionada com sucesso!', 'sucesso');
    closeModal(modalAdicionar);
    e.target.reset();
  });

  // ════════════════════════════════════════════════
  // 12. PLAYER MULTIMÍDIA
  // ════════════════════════════════════════════════
  const multimidiaMain = document.querySelector('.multimidia-main');

  document.querySelectorAll('.multimidia-item').forEach(item => {
    const activate = () => {
      const novaImg   = item.getAttribute('data-img');
      const novoTitulo = item.getAttribute('data-titulo');
      const tipo      = item.getAttribute('data-tipo');
      const placeholder = multimidiaMain?.querySelector('.multimidia-video-placeholder');

      placeholder?.classList.add('fading');
      setTimeout(() => {
        const img   = multimidiaMain?.querySelector('img');
        const h3    = multimidiaMain?.querySelector('h3');
        const play  = multimidiaMain?.querySelector('.play-button');
        const tag   = multimidiaMain?.querySelector('.multimidia-tag');
        if (img)  img.src = novaImg;
        if (h3)   h3.textContent = novoTitulo;
        if (tag)  tag.textContent = tipo === 'video' ? 'Vídeo' : 'Galeria';
        if (play) play.style.display = tipo === 'video' ? 'flex' : 'none';
        placeholder?.classList.remove('fading');
      }, 300);

      multimidiaMain?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    item.addEventListener('click', activate);
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
    });
  });

  // ════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════
  function getCategoryInfo(newsItem) {
    const map = {
      Graos:        ['soja', 'milho', 'trigo', 'arroz', 'grãos', 'safra', 'cafeicultura', 'café'],
      Pecuaria:     ['pecuária', 'boi', 'gado', 'carne', 'leite', 'frango', 'suíno', 'tainha', 'pesca'],
      Tecnologia:   ['tecnologia', 'inovação', 'digital', 'drone', 'inteligência artificial', 'ia', 'software', 'biotecnologia', 'sustentabilidade', 'ambiental'],
      Clima:        ['clima', 'chuva', 'tempo', 'seca', 'fenômeno', 'el niño', 'la niña', 'geada', 'inmet'],
      Mercado:      ['mercado', 'preço', 'cotação', 'commodities', 'exportação', 'importação', 'economia', 'crédito rural', 'financiamento'],
      Politica:     ['política', 'governo', 'subsídio', 'plano safra', 'legislação', 'federal', 'estoque', 'liberação'],
      Credito:      ['crédito', 'banco', 'juros', 'financiamento'],
      Fruticultura: ['fruta', 'fruticultura', 'citrus', 'uva', 'maçã'],
    };

    const hay = `${newsItem.title || ''} ${newsItem.contentSnippet || ''} ${newsItem.description || ''}`.toLowerCase();
    let key = 'Outros';
    for (const [k, words] of Object.entries(map)) {
      if (words.some(w => hay.includes(w))) { key = k; break; }
    }
    return {
      category: LABEL_CAT[key] || 'Outros',
      color:    COR_CAT[key]   || 'var(--verde)',
      thumb:    THUMB_CAT[key] || { emoji: '📰', bg: 'linear-gradient(135deg,#EAF3DE,#c0dd97)' },
    };
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d) ? '' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }

  function setNewsAttrs(el, item, category, color) {
    el.setAttribute('data-titulo',    item.title  || '');
    el.setAttribute('data-categoria', category);
    el.setAttribute('data-cor',       color);
    el.setAttribute('data-texto',     item.contentSnippet || item.description || '');
    el.setAttribute('data-data',      formatDate(item.date));
    el.setAttribute('data-fonte',     item.source || 'Fonte');
    el.setAttribute('data-link',      item.link   || '#');
    el.setAttribute('data-region',    item.region || '');
  }

  // ════════════════════════════════════════════════
  // RENDERIZAÇÃO — HERO (DESTAQUES)
  // ════════════════════════════════════════════════
  function renderHero(newsData) {
    const heroGrid = document.getElementById('heroGrid');
    if (!heroGrid) return;
    heroGrid.innerHTML = '';
    if (!newsData.length) return;

    // Hero principal
    const main = newsData[0];
    const { category: cat0, color: col0 } = getCategoryInfo(main);
    const desc0  = (main.contentSnippet || main.description || '').substring(0, 200);
    const fonte0 = main.source || 'Fonte Externa';

    const heroPrincipal = document.createElement('article');
    heroPrincipal.className = 'hero-principal noticia-clicavel';
    heroPrincipal.setAttribute('tabindex', '0');
    setNewsAttrs(heroPrincipal, main, cat0, col0);

    heroPrincipal.innerHTML = `
      <div class="hero-img-box" style="background:linear-gradient(160deg,#0C1A02,${col0}cc)">
        <div class="hero-img-overlay"></div>
        <svg class="hero-img-deco" viewBox="0 0 200 200" fill="none" aria-hidden="true">
          <path d="M100 180 Q100 100 100 20" stroke="white" stroke-width="3"/>
          <path d="M100 140 Q80 120 60 130" stroke="white" stroke-width="2.5"/>
          <path d="M100 120 Q120 100 140 110" stroke="white" stroke-width="2.5"/>
          <path d="M100 100 Q78 80 58 90" stroke="white" stroke-width="2.5"/>
          <path d="M100 80 Q122 60 142 70" stroke="white" stroke-width="2.5"/>
          <ellipse cx="60" cy="130" rx="14" ry="8" fill="white" transform="rotate(-30 60 130)"/>
          <ellipse cx="140" cy="110" rx="14" ry="8" fill="white" transform="rotate(30 140 110)"/>
          <ellipse cx="58" cy="90" rx="14" ry="8" fill="white" transform="rotate(-30 58 90)"/>
          <ellipse cx="142" cy="70" rx="14" ry="8" fill="white" transform="rotate(30 142 70)"/>
        </svg>
        <div class="hero-content-overlay">
          <span class="hero-tag" style="background:${col0}">${cat0}</span>
          <h2 id="hero-title">${main.title}</h2>
        </div>
      </div>
      <div class="hero-principal-body">
        <p>${desc0}${desc0.length >= 200 ? '…' : ''}</p>
        <div class="hero-meta">
          <div class="hero-fonte-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/>
            </svg>
            Fonte: <strong>${fonte0}</strong>
          </div>
          <span aria-hidden="true">·</span>
          <time>${formatDate(main.date)}</time>
        </div>
      </div>
    `;
    heroGrid.appendChild(heroPrincipal);

    // Cards laterais
    for (let i = 1; i <= 2 && i < newsData.length; i++) {
      const item = newsData[i];
      const { category, color } = getCategoryInfo(item);
      const fonte = item.source || 'Fonte';

      const card = document.createElement('article');
      card.className = 'hero-card noticia-clicavel';
      card.setAttribute('tabindex', '0');
      setNewsAttrs(card, item, category, color);

      card.innerHTML = `
        <div>
          <span class="hero-card-tag" style="color:${color}">${category}</span>
          <h3>${item.title}</h3>
        </div>
        <div class="hero-card-meta">
          <span class="hero-card-fonte-pill">${fonte}</span>
          <span aria-hidden="true">·</span>
          <time>${formatDate(item.date)}</time>
        </div>
      `;
      heroGrid.appendChild(card);
    }
  }

  // ════════════════════════════════════════════════
  // RENDERIZAÇÃO — GRID DE NOTÍCIAS
  // ════════════════════════════════════════════════
  function renderNoticiasGrid(newsData) {
    const grid = document.getElementById('noticiasGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const badge = document.getElementById('noticias-count');
    if (badge) badge.textContent = newsData.length > 0 ? `${newsData.length} notícias` : '';

    if (!newsData.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <h3>Nenhuma notícia encontrada</h3>
          <p>Tente outro filtro ou palavra-chave.</p>
          <button class="btn-reset" id="btnResetFiltros">Limpar filtros</button>
        </div>`;
      document.getElementById('btnResetFiltros')?.addEventListener('click', resetFiltros);
      return;
    }

    newsData.forEach(item => {
      const { category, color, thumb } = getCategoryInfo(item);
      const fonte = item.source || 'Fonte';
      const desc  = (item.contentSnippet || item.description || '').substring(0, 120);
      const link  = item.link || '#';

      const card = document.createElement('article');
      card.className = 'noticia-card noticia-clicavel';
      card.setAttribute('tabindex', '0');
      setNewsAttrs(card, item, category, color);

      card.innerHTML = `
        <div class="noticia-thumb" style="background:${thumb.bg}" aria-hidden="true">
          ${thumb.emoji}
          <div class="fonte-original-flag">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/>
            </svg>
            Fonte original
          </div>
        </div>
        <div class="noticia-body">
          <div class="noticia-meta-top">
            <span class="noticia-cat" style="color:${color}">${category}</span>
          </div>
          <h3>${item.title}</h3>
          <p class="noticia-excerpt">${desc}${desc.length >= 120 ? '…' : ''}</p>
        </div>
        <div class="card-footer">
          <span class="card-fonte-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/>
            </svg>
            ${fonte}
          </span>
          <time class="card-date">${formatDate(item.date)}</time>
          <a href="${link}"
             target="_blank"
             rel="noopener noreferrer"
             class="btn-ler-mais"
             aria-label="Ler matéria completa em ${fonte}: ${item.title}">
            Ler matéria
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // ════════════════════════════════════════════════
  // RENDERIZAÇÃO — ANÁLISE DE MERCADO
  // ════════════════════════════════════════════════
  function renderAnalise(newsData) {
    const container = document.getElementById('analiseGridContainer');
    if (!container) return;
    container.innerHTML = '';

    newsData.slice(0, 4).forEach(item => {
      const { category, color } = getCategoryInfo(item);
      const fonte = item.source || 'Fonte';

      const card = document.createElement('article');
      card.className = 'analise-card noticia-clicavel';
      card.setAttribute('tabindex', '0');
      setNewsAttrs(card, item, category, color);

      card.innerHTML = `
        <div class="analise-icon" style="background:${color}1a;color:${color}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z"/>
          </svg>
        </div>
        <div class="analise-body">
          <span class="noticia-cat" style="color:${color}">${category}</span>
          <h3>${item.title}</h3>
          <p>Por ${fonte} · ${formatDate(item.date)}</p>
        </div>
      `;
      container.appendChild(card);
    });
  }

  // ════════════════════════════════════════════════
  // RENDERIZAÇÃO — EM ALTA AGORA
  // ════════════════════════════════════════════════
  function renderEmAlta(newsData) {
    const container = document.getElementById('listaNoticias');
    if (!container) return;
    container.innerHTML = '';

    newsData.slice(0, 5).forEach((item, i) => {
      const { category, color } = getCategoryInfo(item);
      const fonte = item.source || 'Fonte';

      const el = document.createElement('div');
      el.className = 'mais-lida-item noticia-clicavel';
      el.setAttribute('tabindex', '0');
      setNewsAttrs(el, item, category, color);

      el.innerHTML = `
        <span class="mais-lida-num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <div class="mais-lida-content">
          <div class="mais-lida-titulo">${item.title}</div>
          <div class="mais-lida-meta">
            <span class="mais-lida-fonte-pill">${fonte}</span>
            <span aria-hidden="true">·</span>
            <time>${formatDate(item.date)}</time>
          </div>
        </div>
        <button class="mais-lida-btn" aria-label="Ler: ${item.title}">
          Ler
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" aria-hidden="true">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      `;
      container.appendChild(el);
    });
  }

  // ════════════════════════════════════════════════
  // RENDERIZAÇÃO — MAIS LIDAS (SIDEBAR WIDGET)
  // ════════════════════════════════════════════════
  function renderMaisLidas(newsData) {
    const list = document.getElementById('maisLidasList');
    if (!list) return;
    list.innerHTML = '';

    newsData.slice(0, 5).forEach((item, i) => {
      const { category, color } = getCategoryInfo(item);
      const fonte = item.source || 'Fonte';

      const li = document.createElement('li');
      li.className = 'mais-lida-widget-item noticia-clicavel';
      li.setAttribute('tabindex', '0');
      setNewsAttrs(li, item, category, color);

      li.innerHTML = `
        <span class="mais-lida-widget-num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <div>
          <div class="mais-lida-widget-titulo">${item.title}</div>
          <div class="mais-lida-widget-meta">${fonte} · ${formatDate(item.date)}</div>
        </div>
      `;
      list.appendChild(li);
    });
  }

  // ════════════════════════════════════════════════
  // RENDERIZAÇÃO — WIDGET RSS (SIDEBAR)
  // ════════════════════════════════════════════════
  function renderRssWidget(newsData) {
    const container = document.getElementById('rssNewsContainer');
    if (!container) return;
    container.innerHTML = '';

    if (!newsData.length) {
      container.innerHTML = '<p style="color:var(--texto-3);font-size:13px;">Nenhuma notícia RSS adicional.</p>';
      return;
    }

    newsData.slice(0, 6).forEach(item => {
      const fonte = item.source || 'Fonte';
      const div = document.createElement('div');
      div.className = 'rss-news-item';
      div.innerHTML = `
        <h3>
          <a href="${item.link || '#'}" target="_blank" rel="noopener noreferrer">${item.title}</a>
        </h3>
        <p>${fonte} · ${formatDate(item.date)}</p>
      `;
      container.appendChild(div);
    });
  }

  // ════════════════════════════════════════════════
  // RENDERIZAÇÃO COMPLETA
  // ════════════════════════════════════════════════
  function renderAllSections(newsData) {
    // Seções principais recebem as notícias filtradas/ordenadas
    renderHero(newsData.slice(0, 3));
    renderNoticiasGrid(newsData.slice(3, 9));
    renderAnalise(newsData.slice(9, 13));
    renderEmAlta(newsData.slice(13, 18));
    // Widgets da sidebar usam sempre o topo do acervo completo (sem filtro de categoria)
    renderMaisLidas(state.allNews.slice(0, 5));
    renderRssWidget(state.allNews.slice(18, 24));
  }

  // ════════════════════════════════════════════════
  // RESET FILTROS
  // ════════════════════════════════════════════════
  function resetFiltros() {
    state.currentCategory = 'Tudo';
    state.currentSearch   = '';
    document.querySelectorAll('.filter-tab').forEach(t => {
      const isAll = t.dataset.cat === 'Tudo';
      t.classList.toggle('ativo', isAll);
      t.setAttribute('aria-selected', String(isAll));
    });
    const inline = document.getElementById('busca-inline');
    const hdr    = document.getElementById('header-search-input');
    if (inline) inline.value = '';
    if (hdr)    hdr.value    = '';
    applyFiltersAndRender();
  }

  // ════════════════════════════════════════════════
  // INIT
  // ════════════════════════════════════════════════
  async function init() {
    try {
      const news = await fetchRssNews();
      if (news && news.length > 0) {
        state.allNews = news;
        applyFiltersAndRender();
        mostrarToast(`${news.length} notícias carregadas`, 'sucesso');
      } else {
        ['heroGrid', 'noticiasGrid', 'analiseGridContainer', 'listaNoticias', 'maisLidasList'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.innerHTML = '';
        });
        const _rss = document.getElementById('rssNewsContainer');
        if (_rss) _rss.innerHTML =
          '<p style="color:var(--texto-3);font-size:13px;">Nenhuma notícia RSS disponível.</p>';
        const _grid = document.getElementById('noticiasGrid');
        if (_grid) _grid.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/>
              </svg>
            </div>
            <h3>Nenhuma notícia disponível no momento</h3>
            <p>O feed RSS pode estar temporariamente indisponível. Tente novamente em instantes.</p>
          </div>`;
        mostrarToast('Nenhuma notícia RSS disponível.', 'info');
      }
    } catch (err) {
      console.error('Erro ao inicializar portal:', err);
      mostrarToast('Falha ao carregar notícias. Verifique a conexão com o servidor.', 'erro');
    }
  }

  init();

}); // fim DOMContentLoaded
