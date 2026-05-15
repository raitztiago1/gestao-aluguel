const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

const getFriendlyErrorMessage = async (res: Response): Promise<string> => {
  const bodyText = await res.text().catch(() => '');

  if (res.status === 500) {
    return bodyText
      ? `Erro interno no servidor. ${bodyText}`
      : 'Erro interno no servidor. Tente novamente mais tarde.';
  }

  if (res.status === 404) {
    return 'Recurso não encontrado. Verifique se os dados existem ou tente novamente mais tarde.';
  }

  if (res.status === 401) {
    return 'Não autorizado. Faça login novamente.';
  }

  if (res.status === 403) {
    return 'Acesso negado. Você não tem permissão para realizar esta operação.';
  }

  return bodyText ? `Erro ${res.status}: ${bodyText}` : `Erro ${res.status} ao carregar dados.`;
};

export async function fetchJson<T>(path: string): Promise<T[]> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(await getFriendlyErrorMessage(res));
  }
  return (await res.json()) as T[];
}

export async function requestJson<T>(path: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    throw new Error(await getFriendlyErrorMessage(res));
  }

  return (await res.json()) as T;
}
