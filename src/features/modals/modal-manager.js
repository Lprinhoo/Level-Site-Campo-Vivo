// ══════════════════════════════════════════════════════════════
//  modal-manager.js — Gerenciador de modais com classe .ativo
// ══════════════════════════════════════════════════════════════
let openModals = [];

function toggleBodyScroll(disable) {
  document.body.style.overflow = disable ? 'hidden' : '';
}

export function openModal(modalElement, triggerElement = null) {
  if (!modalElement) return;
  if (openModals.includes(modalElement)) return;

  // Usa .ativo — alinhado com o CSS do portal
  modalElement.classList.add('ativo');
  modalElement.removeAttribute('aria-hidden');
  modalElement.setAttribute('aria-hidden', 'false');
  toggleBodyScroll(true);

  modalElement._triggerElement = triggerElement || null;
  openModals.push(modalElement);

  // Foca no primeiro elemento focável
  requestAnimationFrame(() => {
    const focusable = modalElement.querySelector(
      'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable) focusable.focus();
    else modalElement.setAttribute('tabindex', '-1'), modalElement.focus();
  });
}

export function closeModal(modalElement) {
  if (!modalElement) return;
  if (!openModals.includes(modalElement)) return;

  modalElement.classList.remove('ativo');
  modalElement.setAttribute('aria-hidden', 'true');

  openModals = openModals.filter(m => m !== modalElement);

  if (openModals.length === 0) toggleBodyScroll(false);

  const trigger = modalElement._triggerElement;
  modalElement._triggerElement = null;
  if (trigger) trigger.focus();
}

// Fecha com ESC
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && openModals.length > 0) {
    e.preventDefault();
    closeModal(openModals[openModals.length - 1]);
  }
});
