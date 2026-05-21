'use client';

export const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 horas

interface UserSession {
  token: string;
  usuarioId: number;
  nomeCompleto: string;
  email: string;
}

export function createSession(userData: UserSession) {
  localStorage.setItem('token', userData.token);
  localStorage.setItem('usuarioId', String(userData.usuarioId));
  localStorage.setItem('nomeCompleto', userData.nomeCompleto);
  localStorage.setItem('email', userData.email);
  localStorage.setItem('sessionExpiresAt', String(Date.now() + SESSION_TIMEOUT_MS));
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuarioId');
  localStorage.removeItem('nomeCompleto');
  localStorage.removeItem('email');
  localStorage.removeItem('sessionExpiresAt');
}

export function isSessionValid() {
  const token = localStorage.getItem('token');
  const expiresAt = Number(localStorage.getItem('sessionExpiresAt'));
  return !!token && expiresAt > Date.now();
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function getUserData(): UserSession | null {
  const token = localStorage.getItem('token');
  const usuarioId = localStorage.getItem('usuarioId');
  const nomeCompleto = localStorage.getItem('nomeCompleto');
  const email = localStorage.getItem('email');

  if (!token || !usuarioId || !nomeCompleto || !email) {
    return null;
  }

  return {
    token,
    usuarioId: Number(usuarioId),
    nomeCompleto,
    email
  };
}

export function setupUnloadLogout() {
  const handler = () => {
    clearSession();
  };
  window.addEventListener('beforeunload', handler);
  return () => window.removeEventListener('beforeunload', handler);
}
