import { mostrarToast } from '../../utils/utils.js';
import { COR_CAT, LABEL_CAT, THUMB_CAT } from '../../data/category-data.js';
import { openModal, closeModal } from '../modals/modal-manager.js';
import { initializeRssNewsLoader } from '../rss-news/rss-news-loader.js'; // Importa o novo módulo

document.addEventListener('DOMContentLoaded', () => {

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

  // Inicializa o carregador de notícias RSS
  initializeRssNewsLoader();

});