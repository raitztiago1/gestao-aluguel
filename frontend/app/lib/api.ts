import {
  ApiError,
  createApiErrorFromResponse,
  getDefaultMessageForStatus,
  isNetworkError,
  safeJsonParse
} from './errors';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

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
  const res = await request(path);
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
  const res = await request(path, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  return handleResponse<T>(res);
}

export function getApiBaseUrl(): string {
  return API_BASE;
}

export { ApiError, getDefaultMessageForStatus };
