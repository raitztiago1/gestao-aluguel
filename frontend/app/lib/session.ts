'use client';

export const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 horas
export const AUTH_COOKIE_NAME = 'auth-token';
export const AUTH_EXPIRES_COOKIE_NAME = 'auth-session-expires-at';

interface UserSession {
  token: string;
  usuarioId: number;
  nomeCompleto: string;
  email: string;
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const parts = document.cookie.split('; ').find((entry) => entry.startsWith(`${name}=`));
  return parts ? decodeURIComponent(parts.split('=').slice(1).join('=')) : null;
}

export function createSession(userData: UserSession) {
  const expiresAt = String(Date.now() + SESSION_TIMEOUT_MS);
  localStorage.setItem('token', userData.token);
  localStorage.setItem('usuarioId', String(userData.usuarioId));
  localStorage.setItem('nomeCompleto', userData.nomeCompleto);
  localStorage.setItem('email', userData.email);
  localStorage.setItem('sessionExpiresAt', expiresAt);
  setCookie(AUTH_COOKIE_NAME, userData.token, Math.floor(SESSION_TIMEOUT_MS / 1000));
  setCookie(AUTH_EXPIRES_COOKIE_NAME, expiresAt, Math.floor(SESSION_TIMEOUT_MS / 1000));
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuarioId');
  localStorage.removeItem('nomeCompleto');
  localStorage.removeItem('email');
  localStorage.removeItem('sessionExpiresAt');
  deleteCookie(AUTH_COOKIE_NAME);
  deleteCookie(AUTH_EXPIRES_COOKIE_NAME);
}

export function isSessionValid() {
  const token = localStorage.getItem('token') || getCookie(AUTH_COOKIE_NAME);
  const expiresAt = Number(localStorage.getItem('sessionExpiresAt') || getCookie(AUTH_EXPIRES_COOKIE_NAME));
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
