export function mostrarToast(msg, tipo = 'sucesso') {
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
  toast.style.background = tipo === 'erro' ? '#a32d2d' : tipo === 'info' ? '#185FA5' : 'var(--verde)';
  toast.style.transform  = 'translateY(0)';
  toast.style.opacity    = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.transform = 'translateY(60px)';
    toast.style.opacity   = '0';
  }, 3500);
}