document.addEventListener('DOMContentLoaded', () => {

  // ════════════════════════════════════════════════
  // CONSTANTES & MAPEAMENTOS
  // ════════════════════════════════════════════════

  const COR_CAT = {
    Graos:        'var(--verde)',
    Pecuaria:     'var(--terra)',
    Tecnologia:   '#185FA5',
    Clima:        '#533AB7',
    Mercado:      'var(--terra-escuro)',
    Politica:     '#993556',
    Credito:      'var(--terra)',
    Fruticultura: 'var(--verde-medio)',
  };

  const LABEL_CAT = {
    Graos:        'Grãos',
    Pecuaria:     'Pecuária',
    Tecnologia:   'Tecnologia',
    Clima:        'Clima',
    Mercado:      'Mercado',
    Politica:     'Política Agrícola',
    Credito:      'Crédito Rural',
    Fruticultura: 'Fruticultura',
  };

  const THUMB_CAT = {
    Graos:        { emoji: '🌱', bg: 'linear-gradient(135deg,#EAF3DE,#c0dd97)' },
    Pecuaria:     { emoji: '🐄', bg: 'linear-gradient(135deg,#FAEEDA,#FAC775)' },
    Tecnologia:   { emoji: '🤖', bg: 'linear-gradient(135deg,#E6F1FB,#B5D4F4)' },
    Clima:        { emoji: '🌦', bg: 'linear-gradient(135deg,#EEEDFE,#CECBF6)' },
    Mercado:      { emoji: '📈', bg: 'linear-gradient(135deg,#FAEEDA,#EF9F27 80%)' },
    Politica:     { emoji: '🏛',  bg: 'linear-gradient(135deg,#FBEAF0,#F4C0D1)' },
    Credito:      { emoji: '💰', bg: 'linear-gradient(135deg,#FAEEDA,#FAC775)' },
    Fruticultura: { emoji: '🍊', bg: 'linear-gradient(135deg,#EAF3DE,#97C459)' },
  };

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
    buscaOverlay?.classList.add('aberta');
    btnAbrirBusca?.setAttribute('aria-expanded', 'true');
    setTimeout(() => buscaInput?.focus(), 80);
  }

  function fecharBusca() {
    buscaOverlay?.classList.remove('aberta');
    btnAbrirBusca?.setAttribute('aria-expanded', 'false');
    btnAbrirBusca?.focus();
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

        // Lógica de filtragem no grid de notícias
        const cards = document.querySelectorAll('#noticiasGrid .noticia-card');
        cards.forEach(card => {
          const cardCat = card.getAttribute('data-categoria');
          if (categoriaSelecionada === 'Tudo' || cardCat === categoriaSelecionada) {
            card.style.display = ''; // Restaura o display original (flex) definido no CSS
          } else {
            card.style.display = 'none';
          }
        });

        // Lógica de filtragem na barra lateral (Em Alta Agora)
        const sidebarItems = document.querySelectorAll('#listaNoticias .lista-item');
        sidebarItems.forEach(item => {
          const itemCat = item.getAttribute('data-categoria');
          if (categoriaSelecionada === 'Tudo' || itemCat === categoriaSelecionada) {
            item.style.display = '';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  });

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
    modalNoticia.classList.add('aberto');
    document.body.style.overflow = 'hidden';
    modalNoticia.querySelector('.btn-fechar-modal')?.focus();
  }

  function fecharModalNoticia() {
    modalNoticia?.classList.remove('aberto');
    document.body.style.overflow = '';
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
      const data = card.querySelector('.hero-meta time')?.textContent || 'Agora mesmo';
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
    modalLogin?.classList.remove('aberto');
    document.body.style.overflow = '';
  }

  linkLogin?.addEventListener('click', e => {
    e.preventDefault();
    const target = linkLogin.getAttribute('data-target');
    if (target) {
      trocarView(target, linkLogin);
    } else {
      modalLogin?.classList.add('aberto');
      document.body.style.overflow = 'hidden';
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
  // 9. MODAL GERAR NOTÍCIA COM IA
  // ════════════════════════════════════════════════

  const modalAdicionar = document.getElementById('modalAdicionarNoticia');
  const btnAbrirAdicionar = document.getElementById('abrirAdicionarNoticia');

  // Variáveis de Controle (Escopo do Módulo)
  let tomSelecionado = 'informativo';
  let noticiaGerada = null;
  let stepTimer = null;
  let iaAbortController = null;

  // ── Funções de Apoio (Definidas antes do uso) ──

  function setLoadingIA(ativo) {
    const loadEl = modalAdicionar?.querySelector('#ia-loading');
    if (loadEl) loadEl.style.display = ativo ? 'flex' : 'none';
    
    const btnGerar = modalAdicionar?.querySelector('#ia-btn-gerar') || 
                     modalAdicionar?.querySelector('#ia-btn-regenerar');
    
    if (btnGerar) {
      btnGerar.disabled = ativo;
      btnGerar.style.opacity = ativo ? '0.55' : '1';
    }

    if (!ativo && stepTimer) {
      clearInterval(stepTimer);
      stepTimer = null;
    }
  }

  function resetIAForm() {
    if (iaAbortController) iaAbortController.abort();
    if (stepTimer) clearInterval(stepTimer);

    noticiaGerada = null;
    tomSelecionado = 'informativo';

    const fatos = modalAdicionar?.querySelector('#ia-fatos');
    const charEl = modalAdicionar?.querySelector('#ia-char');
    const formEl = modalAdicionar?.querySelector('#ia-form-step');
    const resEl = modalAdicionar?.querySelector('#ia-resultado');

    if (fatos) fatos.value = '';
    if (charEl) charEl.textContent = '0 / 800 caracteres';
    if (formEl) formEl.style.display = 'block';
    if (resEl) resEl.style.display = 'none';

    // Reseta chips visuais
    modalAdicionar?.querySelectorAll('.ia-chip').forEach(c => {
      c.classList.toggle('ia-chip-ativo', c.dataset.val === 'informativo');
    });

    setLoadingIA(false);
  }

  async function gerarComIA() {
    const fatos = modalAdicionar?.querySelector('#ia-fatos')?.value.trim();
    if (!fatos) { mostrarToast('Informe os fatos da notícia', 'erro'); return; }

    if (iaAbortController) iaAbortController.abort();
    iaAbortController = new AbortController();

    const catKey = modalAdicionar.querySelector('#ia-categoria')?.value || 'Graos';
    const catLabel = LABEL_CAT[catKey] || catKey;
    const regiao = modalAdicionar.querySelector('#ia-regiao')?.value || 'Brasil';

    setLoadingIA(true);

    const steps = [
      ['Analisando os fatos...', 'Identificando contexto e relevância'],
      ['Estruturando a notícia...', 'Criando título, subtítulo e corpo'],
      ['Revisando o texto...', 'Ajustando tom e linguagem'],
    ];

    let si = 0;
    stepTimer = setInterval(() => {
      const txtEl = modalAdicionar.querySelector('#ia-loading-txt');
      const subEl = modalAdicionar.querySelector('#ia-loading-sub');
      if (txtEl && si < steps.length) {
        txtEl.textContent = steps[si][0];
        subEl.textContent = steps[si][1];
        si++;
      }
    }, 2500);

    const prompt = `Você é um jornalista de agronegócio. Responda APENAS com um JSON puro:
    { "titulo": "...", "subtitulo": "...", "corpo": "...", "tempo_leitura": "..." }
    Fatos: ${fatos} (Tom: ${tomSelecionado}, Cat: ${catLabel})`;

    try {
      if (!window.API_CONFIG || !API_CONFIG.GROQ_KEY) throw new Error('API Groq não configurada');

      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        signal: iaAbortController.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_CONFIG.GROQ_KEY}`
        },
        body: JSON.stringify({
          model: API_CONFIG.MODEL,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!resp.ok) throw new Error(`Erro API: ${resp.status}`);
      const data = await resp.json();
      const raw = data.choices?.[0]?.message?.content || '';

      const clean = raw.replace(/```json|```/g, '').trim();
      const noticia = JSON.parse(clean);
      
      if (!noticia.titulo || !noticia.corpo) throw new Error("JSON incompleto");

      noticiaGerada = { ...noticia, catKey, catLabel, regiao };

      modalAdicionar.querySelector('#ia-prev-titulo').textContent = noticia.titulo;
      modalAdicionar.querySelector('#ia-prev-sub').textContent = noticia.subtitulo;
      modalAdicionar.querySelector('#ia-prev-corpo').textContent = noticia.corpo;

      modalAdicionar.querySelector('#ia-form-step').style.display = 'none';
      modalAdicionar.querySelector('#ia-resultado').style.display = 'block';
    } catch (err) {
      if (err.name !== 'AbortError') {
        mostrarToast(err.message, 'erro');
        console.error(err);
      }
    } finally {
      setLoadingIA(false);
    }
  }

  function publicarNoticia(n) {
    const cor      = COR_CAT[n.catKey] || 'var(--verde)';
    const thumb    = THUMB_CAT[n.catKey] || { emoji: '📰', bg: 'linear-gradient(135deg,#EAF3DE,#c0dd97)' };
    const agora    = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const resumo   = n.corpo.split('\n\n')[0].substring(0, 120) + '…';
    const textoCompleto = n.subtitulo + '\n\n' + n.corpo;
    const postId   = n.id || Date.now();

    const attrs = el => {
      el.setAttribute('data-post-id',    postId);
      el.setAttribute('data-titulo',     n.titulo);
      el.setAttribute('data-categoria',  n.catLabel);
      el.setAttribute('data-cor',        cor);
      el.setAttribute('data-texto',      textoCompleto);
    };

    // Grid de Últimas Notícias
    const noticiasGrid = document.getElementById('noticiasGrid');
    if (noticiasGrid) {
      const card = document.createElement('article');
      card.className = 'noticia-card noticia-clicavel new-card-animation'; // Adiciona classe para animação
      attrs(card);
      card.innerHTML = `
        <div class="noticia-thumb" style="background:${thumb.bg}" aria-hidden="true">${thumb.emoji}</div>
        <div class="noticia-body">
          <span class="noticia-cat" style="color:${cor}">${n.catLabel}</span>
          <h3>${n.titulo}</h3>
          <p>${resumo}</p>
          <div class="hero-meta"><time>Hoje, ${agora}</time></div>
        </div>`;

      // Verifica se a notícia deve ser exibida com base no filtro de categoria atual
      const activeTab = document.querySelector('.categorias-tabs .tab.ativo');
      const activeCat = activeTab ? activeTab.textContent.trim() : 'Tudo';
      if (activeCat !== 'Tudo' && n.catLabel !== activeCat) card.style.display = 'none';

      noticiasGrid.prepend(card);
    }

    // Lista Em Alta Agora (Barra Lateral)
    const listaNoticias = document.getElementById('listaNoticias');
    if (listaNoticias) {
      const item = document.createElement('article');
      item.className = 'lista-item noticia-clicavel';
      attrs(item);
      item.innerHTML = `
        <div class="lista-thumb" style="background:${thumb.bg}" aria-hidden="true">${thumb.emoji}</div>
        <div class="lista-body">
          <span class="noticia-cat" style="color:${cor}">${n.catLabel}</span>
          <h4>${n.titulo}</h4>
          <div class="hero-meta"><time>Agora mesmo</time></div>
        </div>`;

      const activeTab = document.querySelector('.categorias-tabs .tab.ativo');
      const activeCat = activeTab ? activeTab.textContent.trim() : 'Tudo';
      if (activeCat !== 'Tudo' && n.catLabel !== activeCat) item.style.display = 'none';

      listaNoticias.prepend(item);
    }
  }

  // ── Inicialização e Eventos ──

  // Injeção do Template (Apenas uma vez)
  const templateIA = document.getElementById('template-ia-form');
  const modalContentIA = modalAdicionar?.querySelector('.modal-content');
  if (modalContentIA && templateIA) {
    modalContentIA.innerHTML = '';
    modalContentIA.appendChild(templateIA.content.cloneNode(true));
  }

  function abrirModalAdicionar() {
    modalAdicionar?.classList.add('aberto');
    document.body.style.overflow = 'hidden';
    btnAbrirAdicionar?.setAttribute('aria-expanded', 'true');
  }

  function fecharModalAdicionar() {
    resetIAForm();
    modalAdicionar?.classList.remove('aberto');
    document.body.style.overflow = '';
    btnAbrirAdicionar?.setAttribute('aria-expanded', 'false');
  }

  if (modalAdicionar) {
    btnAbrirAdicionar?.addEventListener('click', abrirModalAdicionar);
    document.getElementById('admin-novo-post')?.addEventListener('click', abrirModalAdicionar);
    modalAdicionar.querySelector('#fecharAdicionarNoticia')?.addEventListener('click', fecharModalAdicionar);
    modalAdicionar.addEventListener('click', e => { if (e.target === modalAdicionar) fecharModalAdicionar(); });

    modalAdicionar.querySelector('#ia-fatos')?.addEventListener('input', function() {
      const charEl = modalAdicionar.querySelector('#ia-char');
      if (charEl) charEl.textContent = `${this.value.length} / 800 caracteres`;
    });

    modalAdicionar.querySelectorAll('.ia-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        modalAdicionar.querySelectorAll('.ia-chip').forEach(c => c.classList.remove('ia-chip-ativo'));
        chip.classList.add('ia-chip-ativo');
        tomSelecionado = chip.dataset.val;
      });
    });

    modalAdicionar.querySelector('#ia-btn-gerar')?.addEventListener('click', gerarComIA);
    modalAdicionar.querySelector('#ia-btn-regenerar')?.addEventListener('click', gerarComIA);

    modalAdicionar.querySelector('#ia-btn-publicar')?.addEventListener('click', () => {
      if (!noticiaGerada) return;
      publicarNoticia({ ...noticiaGerada, id: Date.now() });
      fecharModalAdicionar();
      mostrarToast('Notícia publicada!');
    });

    modalAdicionar.querySelector('#ia-btn-descartar')?.addEventListener('click', () => {
      resetIAForm();
    });
  }

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

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    fecharBusca(); fecharModalNoticia(); fecharModalAdicionar(); fecharLogin();
  });

  function mostrarToast(msg, tipo = 'sucesso') {
    let toast = document.getElementById('cv-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cv-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      Object.assign(toast.style, {
        position:   'fixed',
        bottom:     '24px',
        right:      '24px',
        padding:    '12px 20px',
        borderRadius: '10px',
        fontSize:   '13px',
        fontWeight: '600',
        zIndex:     '9999',
        transform:  'translateY(60px)',
        opacity:    '0',
        transition: 'all 0.3s',
        fontFamily: "'Inter', sans-serif",
        color:      '#fff',
        maxWidth:   '320px',
        boxShadow:  '0 4px 16px rgba(0,0,0,0.15)',
      });
      document.body.appendChild(toast);
    }
    toast.textContent    = msg;
    toast.style.background = tipo === 'erro' ? '#a32d2d' : 'var(--verde)';
    toast.style.transform  = 'translateY(0)';
    toast.style.opacity    = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.style.transform = 'translateY(60px)';
      toast.style.opacity   = '0';
    }, 3500);
  }

});