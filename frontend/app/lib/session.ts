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

function getSessionToken(): string | null {
  return localStorage.getItem('token') || getCookie(AUTH_COOKIE_NAME);
}

function getSessionExpiry(): number {
  const fromStorage = Number(localStorage.getItem('sessionExpiresAt') || 0);
  const fromCookie = Number(getCookie(AUTH_EXPIRES_COOKIE_NAME) || 0);
  return Math.max(fromStorage, fromCookie);
}

/** Mantém localStorage e cookies alinhados para sobreviver ao F5 e ao middleware. */
export function syncSession() {
  if (typeof window === 'undefined') {
    return;
  }

  const token = getSessionToken();
  const expiresAt = getSessionExpiry();

  if (!token || !expiresAt || expiresAt <= Date.now()) {
    return;
  }

  const remainingSeconds = Math.max(Math.floor((expiresAt - Date.now()) / 1000), 0);

  if (!localStorage.getItem('token')) {
    localStorage.setItem('token', token);
  }
  if (!localStorage.getItem('sessionExpiresAt')) {
    localStorage.setItem('sessionExpiresAt', String(expiresAt));
  }

  if (getCookie(AUTH_COOKIE_NAME) !== token) {
    setCookie(AUTH_COOKIE_NAME, token, remainingSeconds);
  }
  if (getCookie(AUTH_EXPIRES_COOKIE_NAME) !== String(expiresAt)) {
    setCookie(AUTH_EXPIRES_COOKIE_NAME, String(expiresAt), remainingSeconds);
  }
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
  if (typeof window === 'undefined') {
    return false;
  }

  syncSession();

  const token = getSessionToken();
  const expiresAt = getSessionExpiry();
  return !!token && expiresAt > Date.now();
}

export function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  syncSession();
  return getSessionToken();
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
  return () => {};
}
