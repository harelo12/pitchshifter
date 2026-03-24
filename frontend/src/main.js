import './styles.css';

const AUTH_STATUS = document.getElementById('auth-status');
const PROCESS_STATUS = document.getElementById('process-status');
const LOGIN_BUTTON = document.getElementById('login-btn');
const LOGOUT_BUTTON = document.getElementById('logout-btn');
const PROCESS_FORM = document.getElementById('process-form');
const OUTPUT_FORMAT_SELECT = document.getElementById('output-format');

const API_BASE = '/api/v1';

const toFriendlyError = async (response) => {
  let message = `Error ${response.status}`;
  try {
    const payload = await response.json();
    if (payload.error) message = payload.error;
  } catch {
    message = response.statusText || message;
  }
  return message;
};

const setAuthUI = (user) => {
  if (user) {
    const email = user.emails?.[0]?.value || 'sin email';
    AUTH_STATUS.textContent = `Autenticado como ${user.displayName} (${email})`;
    PROCESS_FORM.querySelectorAll('input,select,button').forEach(node => { node.disabled = false; });
  } else {
    AUTH_STATUS.textContent = 'No autenticado. Debes entrar con Google para procesar.';
    PROCESS_FORM.querySelectorAll('input,select,button').forEach(node => {
      if (node.id !== 'process-btn') node.disabled = true;
    });
    document.getElementById('process-btn').disabled = true;
  }
};

const loadSession = async () => {
  const response = await fetch(`${API_BASE}/auth/me`, {
    credentials: 'include'
  });
  const payload = await response.json();
  setAuthUI(payload.user);
};

const loadProcessorConfig = async () => {
  const response = await fetch(`${API_BASE}/pitch/config`, {
    credentials: 'include'
  });

  if (!response.ok) {
    OUTPUT_FORMAT_SELECT.innerHTML = '<option value="wav">wav</option>';
    return;
  }

  const payload = await response.json();
  OUTPUT_FORMAT_SELECT.innerHTML = payload.allowedOutputFormats
    .map(format => `<option value="${format}" ${format === payload.defaultOutputFormat ? 'selected' : ''}>${format}</option>`)
    .join('');
};

const processAudio = async (event) => {
  event.preventDefault();
  PROCESS_STATUS.textContent = 'Procesando...';

  const formData = new FormData(PROCESS_FORM);

  const response = await fetch(`${API_BASE}/pitch/process`, {
    method: 'POST',
    body: formData,
    credentials: 'include'
  });

  if (!response.ok) {
    PROCESS_STATUS.textContent = await toFriendlyError(response);
    return;
  }

  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const disposition = response.headers.get('content-disposition') || '';
  const matched = disposition.match(/filename="?([^\"]+)"?/i);
  anchor.href = downloadUrl;
  anchor.download = matched?.[1] || 'pitch-shifted-audio';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(downloadUrl);
  PROCESS_STATUS.textContent = 'Archivo procesado correctamente.';
};

LOGIN_BUTTON.addEventListener('click', () => {
  window.location.href = `${window.location.origin}${API_BASE}/auth/google`;
});

LOGOUT_BUTTON.addEventListener('click', async () => {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  });
  await loadSession();
  PROCESS_STATUS.textContent = '';
});

PROCESS_FORM.addEventListener('submit', async (event) => {
  try {
    await processAudio(event);
  } catch (error) {
    PROCESS_STATUS.textContent = error.message || 'No se pudo procesar el audio.';
  }
});

const bootstrap = async () => {
  const isAuthSuccessRoute = window.location.pathname === '/auth/success';
  const isAuthErrorRoute = window.location.pathname === '/auth/error';

  if (isAuthSuccessRoute) {
    history.replaceState({}, '', '/');
  }

  if (isAuthErrorRoute) {
    PROCESS_STATUS.textContent = 'No se pudo completar la autenticación con Google.';
    history.replaceState({}, '', '/');
  }

  try {
    await loadSession();
    await loadProcessorConfig();
  } catch {
    AUTH_STATUS.textContent = 'No se pudo conectar con el backend.';
    PROCESS_STATUS.textContent = 'Revisa que backend y frontend estén levantados.';
  }
};

bootstrap();
