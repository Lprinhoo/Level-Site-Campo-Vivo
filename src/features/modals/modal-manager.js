let openModals = []; // Pilha de modais abertos

function toggleBodyScroll(disable) {
  if (disable) {
    document.body.style.overflow = 'hidden';
  } else {
    // Só reabilita o scroll se não houver outros modais abertos
    if (openModals.length === 0) {
      document.body.style.overflow = '';
    }
  }
}

export function openModal(modalElement, triggerElement = null) {
  if (!modalElement) return;

  // Se o modal já está aberto, não faz nada
  if (openModals.includes(modalElement)) return;

  modalElement.classList.add('aberto');
  modalElement.setAttribute('aria-hidden', 'false');
  toggleBodyScroll(true);

  // Armazena o elemento que abriu o modal para focar nele ao fechar
  modalElement._triggerElement = triggerElement;
  openModals.push(modalElement);

  // Foca no primeiro elemento focável dentro do modal ou no próprio modal
  setTimeout(() => {
    const focusableElement = modalElement.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusableElement) {
      focusableElement.focus();
    } else {
      modalElement.focus(); // Garante que o modal seja focável
    }
  }, 80);
}

export function closeModal(modalElement) {
  if (!modalElement || !openModals.includes(modalElement)) return;

  modalElement.classList.remove('aberto');
  modalElement.setAttribute('aria-hidden', 'true');

  // Remove o modal da pilha
  openModals = openModals.filter(modal => modal !== modalElement);

  toggleBodyScroll(false);

  // Retorna o foco para o elemento que abriu o modal, se houver
  if (modalElement._triggerElement) {
    modalElement._triggerElement.focus();
    modalElement._triggerElement = null; // Limpa a referência
  } else if (openModals.length > 0) {
    // Se houver outro modal aberto, foca no último modal da pilha
    const lastOpenModal = openModals[openModals.length - 1];
    lastOpenModal.focus();
  }
}

// Listener global para fechar o modal com a tecla ESC
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && openModals.length > 0) {
    e.preventDefault(); // Previne o comportamento padrão do navegador
    const topModal = openModals[openModals.length - 1];
    closeModal(topModal);
  }
});