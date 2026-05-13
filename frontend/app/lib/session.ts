'use client';

export const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000;

export function createSession() {
  localStorage.setItem('logado', 'true');
  localStorage.setItem('sessionExpiresAt', String(Date.now() + SESSION_TIMEOUT_MS));
}

export function clearSession() {
  localStorage.removeItem('logado');
  localStorage.removeItem('sessionExpiresAt');
}

export function isSessionValid() {
  const logged = localStorage.getItem('logado') === 'true';
  const expiresAt = Number(localStorage.getItem('sessionExpiresAt'));
  return logged && expiresAt > Date.now();
}

export function setupUnloadLogout() {
  const handler = () => {
    clearSession();
  };
  window.addEventListener('beforeunload', handler);
  return () => window.removeEventListener('beforeunload', handler);
}
