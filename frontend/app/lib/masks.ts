/** Mantém apenas dígitos. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function maskCep(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function maskCpfCnpj(value: string, tipo: 'FISICA' | 'JURIDICA' = 'FISICA'): string {
  const digits = onlyDigits(value).slice(0, tipo === 'JURIDICA' ? 14 : 11);
  if (tipo === 'JURIDICA') {
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    }
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function maskPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Ex.: 1.234,56 */
export function maskCurrency(value: string): string {
  const digits = onlyDigits(value);
  if (!digits) return '';
  const cents = Number(digits) / 100;
  return cents.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function parseCurrency(masked: string): number {
  const digits = onlyDigits(masked);
  if (!digits) return 0;
  return Number(digits) / 100;
}

/** Ex.: 120,50 m² */
export function maskArea(value: string): string {
  const normalized = value.replace(/[^\d,]/g, '').replace(',', '.');
  const parts = normalized.split('.');
  const intPart = (parts[0] ?? '').slice(0, 6);
  const decPart = (parts[1] ?? '').slice(0, 2);
  if (!intPart && !decPart) return '';
  if (!decPart) return intPart;
  return `${intPart},${decPart}`;
}

export function parseArea(masked: string): number {
  const normalized = masked.replace(/\./g, '').replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

/** DD/MM/AAAA */
export function maskDateBr(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** ISO yyyy-MM-dd → DD/MM/AAAA */
export function isoToDateBr(iso?: string | null): string {
  if (!iso) return '';
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return maskDateBr(iso);
  return `${match[3]}/${match[2]}/${match[1]}`;
}

/** DD/MM/AAAA → ISO yyyy-MM-dd (vazio se inválido) */
export function dateBrToIso(br: string): string {
  const digits = onlyDigits(br);
  if (digits.length !== 8) return '';
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900) return '';
  return `${year}-${month}-${day}`;
}

export function maskDayOfMonth(value: string): string {
  const digits = onlyDigits(value).slice(0, 2);
  if (!digits) return '';
  const n = Math.min(31, Math.max(1, Number(digits)));
  return String(n);
}

export type MaskType = 'cep' | 'cpf' | 'cnpj' | 'cpfCnpj' | 'phone' | 'currency' | 'area' | 'date' | 'day';

export function applyMask(type: MaskType, value: string, extra?: { tipoPessoa?: 'FISICA' | 'JURIDICA' }): string {
  switch (type) {
    case 'cep':
      return maskCep(value);
    case 'cpf':
      return maskCpfCnpj(value, 'FISICA');
    case 'cnpj':
      return maskCpfCnpj(value, 'JURIDICA');
    case 'cpfCnpj':
      return maskCpfCnpj(value, extra?.tipoPessoa ?? 'FISICA');
    case 'phone':
      return maskPhone(value);
    case 'currency':
      return maskCurrency(value);
    case 'area':
      return maskArea(value);
    case 'date':
      return maskDateBr(value);
    case 'day':
      return maskDayOfMonth(value);
    default:
      return value;
  }
}
