const TIPO_PESSOA: Record<string, string> = {
  FISICA: 'Pessoa física',
  JURIDICA: 'Pessoa jurídica'
};

const TIPO_TERRENO: Record<string, string> = {
  COMERCIAL: 'Comercial',
  RESIDENCIAL: 'Residencial'
};

const STATUS_SALA: Record<string, string> = {
  DISPONIVEL: 'Disponível',
  LOCADA: 'Locada',
  MANUTENCAO: 'Em manutenção'
};

const STATUS_CONTRATO: Record<string, string> = {
  ATIVO: 'Ativo',
  ENCERRADO: 'Encerrado',
  RENOVACAO: 'Em renovação',
  CANCELADO: 'Cancelado'
};

function lookup(map: Record<string, string>, key?: string | null, fallback = '—'): string {
  if (!key) return fallback;
  return map[key] ?? key.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export function labelTipoPessoa(key?: string | null): string {
  return lookup(TIPO_PESSOA, key);
}

export function labelTipoTerreno(key?: string | null): string {
  return lookup(TIPO_TERRENO, key);
}

export function labelStatusSala(key?: string | null): string {
  return lookup(STATUS_SALA, key);
}

export function labelStatusContrato(key?: string | null): string {
  return lookup(STATUS_CONTRATO, key);
}

export function badgeClassForStatus(key?: string | null): string {
  switch (key) {
    case 'ATIVO':
    case 'DISPONIVEL':
      return 'badge badge-success';
    case 'LOCADA':
    case 'RENOVACAO':
      return 'badge badge-warning';
    case 'ENCERRADO':
    case 'CANCELADO':
    case 'MANUTENCAO':
      return 'badge badge-danger';
    default:
      return 'badge';
  }
}
