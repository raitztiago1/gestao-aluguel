import {
    ApiError,
    createApiErrorFromResponse,
    getDefaultMessageForStatus,
    isNetworkError,
    safeJsonParse
} from './errors';
import { getToken } from './session';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

function getAuthHeaders(): Record<string, string> {
    if (typeof window === 'undefined') {
        return {};
    }

    const token = getToken();
    if (!token) {
        return {};
    }

    return {
        Authorization: `Bearer ${token}`
    };
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_BASE}${path}`, init);
  } catch (error) {
    if (isNetworkError(error)) {
      throw new ApiError(
        'Não foi possível conectar ao servidor. Verifique se o backend está em execução e tente novamente.'
      );
    }
    throw error;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw await createApiErrorFromResponse(res);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return safeJsonParse<T>(res);
}

export async function fetchJson<T>(path: string): Promise<T[]> {
  const res = await request(path, {
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders()
    }
  });
  const data = await handleResponse<T[] | T>(res);

  if (Array.isArray(data)) {
    return data;
  }

  if (data == null) {
    return [];
  }

  throw new ApiError('O servidor retornou um formato de lista inválido.', {
    status: res.status
  });
}

export async function requestJson<T>(path: string, method: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...getAuthHeaders()
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await request(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  return handleResponse<T>(res);
}

export async function deleteJson(path: string): Promise<void> {
  const res = await request(path, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders()
    }
  });

  await handleResponse<void>(res);
}

export async function login(email: string, senha: string): Promise<{ token: string; usuarioId: number; nomeCompleto: string; email: string }> {
  return requestJson('/api/auth/login', 'POST', { email, senha });
}

export async function register(email: string, senha: string, nomeCompleto: string): Promise<{ token: string; usuarioId: number; nomeCompleto: string; email: string }> {
  return requestJson('/api/auth/register', 'POST', { email, senha, nomeCompleto });
}

export async function forgotPassword(email: string): Promise<void> {
  return requestJson('/api/auth/forgot-password', 'POST', { email });
}

export async function resetPassword(token: string, novaSenha: string): Promise<void> {
  return requestJson('/api/auth/reset-password', 'POST', { token, novaSenha });
}

export function getApiBaseUrl(): string {
  return API_BASE;
}

export { ApiError, getDefaultMessageForStatus };
