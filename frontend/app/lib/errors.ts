export type ApiErrorBody = {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  details?: string[] | string;
};

export class ApiError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly details?: string[];

  constructor(message: string, options?: { status?: number; code?: string; details?: string[] }) {
    super(message);
    this.name = 'ApiError';
    this.status = options?.status;
    this.code = options?.code;
    this.details = options?.details;
  }
}

const NETWORK_ERROR_MESSAGE =
  'Não foi possível conectar ao servidor. Verifique se o backend está em execução e tente novamente.';

const DEFAULT_MESSAGES: Record<number, string> = {
  400: 'Os dados enviados são inválidos. Revise o formulário e tente novamente.',
  401: 'Sua sessão expirou ou você não está autenticado. Faça login novamente.',
  403: 'Você não tem permissão para realizar esta operação.',
  404: 'Registro não encontrado. Ele pode ter sido removido ou o endereço está incorreto.',
  409: 'Conflito ao salvar os dados. Verifique se o registro já existe.',
  422: 'Não foi possível processar os dados enviados.',
  429: 'Muitas requisições em sequência. Aguarde um momento e tente novamente.',
  500: 'Ocorreu um erro interno no servidor. Tente novamente em instantes.',
  502: 'O servidor está temporariamente indisponível. Tente novamente mais tarde.',
  503: 'O serviço está em manutenção ou indisponível no momento.',
  504: 'O servidor demorou para responder. Tente novamente.'
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function parseApiErrorBody(raw: string): ApiErrorBody | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (!isRecord(parsed)) {
      return null;
    }

    const details = parsed.details;
    return {
      timestamp: typeof parsed.timestamp === 'string' ? parsed.timestamp : undefined,
      status: typeof parsed.status === 'number' ? parsed.status : undefined,
      error: typeof parsed.error === 'string' ? parsed.error : undefined,
      message: typeof parsed.message === 'string' ? parsed.message : undefined,
      path: typeof parsed.path === 'string' ? parsed.path : undefined,
      details: Array.isArray(details)
        ? details.filter((item): item is string => typeof item === 'string')
        : typeof details === 'string'
          ? [details]
          : undefined
    };
  } catch {
    return null;
  }
}

function translateDatabaseMessage(message: string): string | null {
  const normalized = message.toLowerCase();

  if (normalized.includes('duplicate key') || normalized.includes('unique constraint') || normalized.includes('already exists')) {
    return 'Já existe um registro com esses dados. Verifique CPF/CNPJ, identificação ou outros campos únicos.';
  }

  if (normalized.includes('foreign key') || normalized.includes('violates foreign key')) {
    if (normalized.includes('delete') || normalized.includes('on delete')) {
      return 'Não é possível excluir este registro porque existem dados vinculados a ele.';
    }
    return 'Referência inválida: verifique se os itens selecionados (sala, locatário, terreno) existem.';
  }

  if (normalized.includes('valida_terreno_comercial') || normalized.includes('valida_terreno')) {
    return 'Dados do terreno inconsistentes com o tipo selecionado (comercial ou residencial).';
  }

  if (normalized.includes('valida_locatario')) {
    return 'Preencha os campos obrigatórios para pessoa física ou jurídica.';
  }

  if (normalized.includes('garantia_xor')) {
    return 'O contrato deve ter fiador ou caução — apenas uma das garantias.';
  }

  if (normalized.includes('not-null') || normalized.includes('null value')) {
    return 'Existem campos obrigatórios não preenchidos.';
  }

  if (normalized.includes('check constraint')) {
    return 'Alguns valores informados não atendem às regras do sistema.';
  }

  return null;
}

function humanizeTechnicalMessage(message: string): string {
  const fromDb = translateDatabaseMessage(message);
  if (fromDb) {
    return fromDb;
  }

  if (message.length > 220) {
    return 'Não foi possível concluir a operação. Verifique os dados e tente novamente.';
  }

  return message;
}

function buildMessageFromBody(body: ApiErrorBody, status: number): string {
  const parts: string[] = [];

  if (body.message) {
    parts.push(humanizeTechnicalMessage(body.message));
  } else if (body.error) {
    parts.push(body.error);
  }

  if (body.details && Array.isArray(body.details) && body.details.length) {
    const detailText = body.details
      .slice(0, 3)
      .map((detail) => humanizeTechnicalMessage(detail))
      .join(' ');
    if (detailText && !parts.some((part) => part.includes(detailText))) {
      parts.push(detailText);
    }
  }

  if (parts.length > 0) {
    return parts.join(' ');
  }

  return DEFAULT_MESSAGES[status] ?? `Não foi possível concluir a operação (código ${status}).`;
}

export function getDefaultMessageForStatus(status: number): string {
  return DEFAULT_MESSAGES[status] ?? `Não foi possível concluir a operação (código ${status}).`;
}

export async function createApiErrorFromResponse(res: Response): Promise<ApiError> {
  const bodyText = await res.text().catch(() => '');
  const parsed = bodyText ? parseApiErrorBody(bodyText) : null;

  if (parsed) {
    const details = Array.isArray(parsed.details) ? parsed.details : parsed.details ? [parsed.details] : undefined;
    return new ApiError(buildMessageFromBody(parsed, res.status), {
      status: res.status,
      code: parsed.error,
      details
    });
  }

  if (bodyText.trim()) {
    return new ApiError(humanizeTechnicalMessage(bodyText.trim()), { status: res.status });
  }

  return new ApiError(getDefaultMessageForStatus(res.status), { status: res.status });
}

export function getErrorMessage(error: unknown, fallback = 'Ocorreu um erro inesperado. Tente novamente.'): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      return NETWORK_ERROR_MESSAGE;
    }
    return error.message || fallback;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return fallback;
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return false;
  }
  if (error instanceof TypeError) {
    return true;
  }
  if (error instanceof Error) {
    return error.message === 'Failed to fetch';
  }
  return false;
}

export async function safeJsonParse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text.trim()) {
    throw new ApiError('O servidor retornou uma resposta vazia.', { status: response.status });
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError('O servidor retornou uma resposta em formato inválido.', { status: response.status });
  }
}
