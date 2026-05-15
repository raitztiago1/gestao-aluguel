import { maskCep, maskCpfCnpj, maskPhone, onlyDigits } from './masks';
import {
  labelStatusContrato,
  labelStatusSala,
  labelTipoPessoa,
  labelTipoTerreno
} from './labels';

type AddressParts = {
  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
};

export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  return iso;
}

export function formatCurrency(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return '—';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatArea(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m²`;
}

export function formatCepDisplay(cep?: string | null): string {
  if (!cep) return '';
  const digits = onlyDigits(cep);
  return digits ? maskCep(digits) : cep;
}

export function formatCpfCnpjDisplay(value?: string | null, tipo?: 'FISICA' | 'JURIDICA'): string {
  if (!value) return '—';
  const digits = onlyDigits(value);
  if (!digits) return value;
  const kind = tipo ?? (digits.length > 11 ? 'JURIDICA' : 'FISICA');
  return maskCpfCnpj(digits, kind);
}

export function formatPhoneDisplay(value?: string | null): string {
  if (!value) return '—';
  const digits = onlyDigits(value);
  return digits ? maskPhone(digits) : value;
}

/** Endereço em uma linha para tabelas e selects. */
export function formatAddressLine(parts: AddressParts): string {
  const street = [parts.endereco, parts.numero].filter(Boolean).join(', ');
  const cityState = [parts.cidade, parts.estado].filter(Boolean).join('/');
  const segments = [street, parts.bairro, cityState].filter((s) => s && String(s).trim());
  return segments.length > 0 ? segments.join(' · ') : 'Endereço não informado';
}

export function formatAddressShort(parts: AddressParts): string {
  const line = formatAddressLine(parts);
  if (parts.cep) {
    const cep = formatCepDisplay(parts.cep);
    return cep ? `${line} · CEP ${cep}` : line;
  }
  return line;
}

export function formatTerrenoOption(terreno: AddressParts & { tipo?: string | null }): string {
  const tipo = terreno.tipo ? labelTipoTerreno(terreno.tipo) : null;
  const addr = formatAddressLine(terreno);
  return tipo ? `${tipo} — ${addr}` : addr;
}

export function formatSalaOption(sala: {
  identificacao?: string | null;
  metragem?: number | null;
  terreno?: AddressParts | null;
}): string {
  const nome = sala.identificacao?.trim() || 'Sala sem nome';
  const area = sala.metragem != null ? ` (${formatArea(sala.metragem)})` : '';
  const local = sala.terreno ? ` — ${formatAddressLine(sala.terreno)}` : '';
  return `${nome}${area}${local}`;
}

export function formatLocatarioOption(loc: { nome?: string | null; cpfCnpj?: string | null; tipoPessoa?: string | null }): string {
  const nome = loc.nome?.trim() || 'Sem nome';
  const doc = loc.cpfCnpj ? ` · ${formatCpfCnpjDisplay(loc.cpfCnpj, loc.tipoPessoa as 'FISICA' | 'JURIDICA' | undefined)}` : '';
  return `${nome}${doc}`;
}

export { labelTipoPessoa, labelTipoTerreno, labelStatusSala, labelStatusContrato };
