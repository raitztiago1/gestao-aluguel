'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { clearSession, isSessionValid, setupUnloadLogout } from '../lib/session';

type TipoTerreno = 'COMERCIAL' | 'RESIDENCIAL';

type Terreno = {
  id: number;
  tipo: TipoTerreno;
  endereco: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade: string;
  estado: string;
  cep?: string;
  metragemTotal: number;
  vagasGaragem?: number;
  quantidadeSalas?: number;
  metragemSalas?: number;
  metragemCasa?: number;
  observacoes?: string;
};

type Sala = { id: number; identificacao?: string; metragem?: number; status?: string };
type Locatario = { id: number; nome: string; email: string; telefone?: string };
type Contrato = { id: number; valorAluguel?: number; dataInicio?: string; dataTermino?: string; status?: string };

type TerrenoForm = {
  id?: number;
  tipo: TipoTerreno;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  metragemTotal: string;
  vagasGaragem: string;
  quantidadeSalas: string;
  metragemSalas: string;
  metragemCasa: string;
  observacoes: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

const fetchJson = async <T,>(path: string): Promise<T[]> => {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Erro: ${res.status}`);
  return (await res.json()) as T[];
};

async function requestJson<T>(path: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return (await res.json()) as T;
}

const defaultTerrenoForm: TerrenoForm = {
  tipo: 'RESIDENCIAL',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
  metragemTotal: '',
  vagasGaragem: '',
  quantidadeSalas: '',
  metragemSalas: '',
  metragemCasa: '',
  observacoes: ''
};

function formatTerrenoForm(form: TerrenoForm) {
  const payload: Record<string, unknown> = {
    tipo: form.tipo,
    endereco: form.endereco,
    numero: form.numero || undefined,
    complemento: form.complemento || undefined,
    bairro: form.bairro || undefined,
    cidade: form.cidade,
    estado: form.estado,
    cep: form.cep || undefined,
    metragemTotal: form.metragemTotal ? Number(form.metragemTotal) : undefined,
    vagasGaragem: form.vagasGaragem ? Number(form.vagasGaragem) : undefined,
    quantidadeSalas: form.quantidadeSalas ? Number(form.quantidadeSalas) : undefined,
    metragemSalas: form.metragemSalas ? Number(form.metragemSalas) : undefined,
    metragemCasa: form.metragemCasa ? Number(form.metragemCasa) : undefined,
    observacoes: form.observacoes || undefined
  };
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

export default function CRUD() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [terrenos, setTerrenos] = useState<Terreno[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [locatarios, setLocatarios] = useState<Locatario[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);

  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [formTerreno, setFormTerreno] = useState<TerrenoForm>(defaultTerrenoForm);
  const [modoEdicao, setModoEdicao] = useState(false);

  useEffect(() => {
    if (!isSessionValid()) {
      clearSession();
      router.push('/login');
      return;
    }

    setIsLoggedIn(true);
    carregarDados();
    const cleanup = setupUnloadLogout();
    return cleanup;
  }, [router]);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const [t, s, l, c] = await Promise.all([
        fetchJson<Terreno>('/api/terrenos'),
        fetchJson<Sala>('/api/salas'),
        fetchJson<Locatario>('/api/locatarios'),
        fetchJson<Contrato>('/api/contratos')
      ]);
      setTerrenos(t);
      setSalas(s);
      setLocatarios(l);
      setContratos(c);
      setErro(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setCarregando(false);
    }
  };

  const salvarTerreno = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const payload = formatTerrenoForm(formTerreno);
      if (modoEdicao && formTerreno.id) {
        await requestJson<Terreno>(`/api/terrenos/${formTerreno.id}`, 'PUT', payload);
      } else {
        await requestJson<Terreno>('/api/terrenos', 'POST', payload);
      }
      setFormTerreno(defaultTerrenoForm);
      setModoEdicao(false);
      await carregarDados();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao salvar terreno');
    }
  };

  const editarTerreno = (terreno: Terreno) => {
    setFormTerreno({
      id: terreno.id,
      tipo: terreno.tipo,
      endereco: terreno.endereco,
      numero: terreno.numero ?? '',
      complemento: terreno.complemento ?? '',
      bairro: terreno.bairro ?? '',
      cidade: terreno.cidade,
      estado: terreno.estado,
      cep: terreno.cep ?? '',
      metragemTotal: terreno.metragemTotal.toString(),
      vagasGaragem: terreno.vagasGaragem?.toString() ?? '',
      quantidadeSalas: terreno.quantidadeSalas?.toString() ?? '',
      metragemSalas: terreno.metragemSalas?.toString() ?? '',
      metragemCasa: terreno.metragemCasa?.toString() ?? '',
      observacoes: terreno.observacoes ?? ''
    });
    setModoEdicao(true);
    setErro(null);
  };

  const excluirTerreno = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/terrenos/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status} ${res.statusText}: ${text}`);
      }
      await carregarDados();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao excluir terreno');
    }
  };

  const resetForm = () => {
    setModoEdicao(false);
    setFormTerreno(defaultTerrenoForm);
    setErro(null);
  };

  const voltarParaHome = () => {
    router.push('/home');
  };

  if (!isLoggedIn) {
    return <div>Redirecionando para login...</div>;
  }

  return (
    <main className='container'>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Gestão de Aluguel - CRUD</h1>
        <button onClick={voltarParaHome} style={{
          padding: '0.5rem 1rem',
          background: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          ← Voltar para Home
        </button>
      </header>

      <p>API base: {API_BASE}</p>

      {carregando && <p>Carregando...</p>}
      {erro && <p style={{ color: 'red' }}>{erro}</p>}

      <section className='card'>
        <h2>Terrenos (CRUD)</h2>
        <form onSubmit={salvarTerreno} style={{ marginBottom: '1rem', display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label>
              Tipo:
              <select value={formTerreno.tipo} onChange={(e) => setFormTerreno((s) => ({ ...s, tipo: e.target.value as TipoTerreno }))} required>
                <option value='COMERCIAL'>Comercial</option>
                <option value='RESIDENCIAL'>Residencial</option>
              </select>
            </label>

            <label>
              Endereço:
              <input type='text' value={formTerreno.endereco} onChange={(e) => setFormTerreno((s) => ({ ...s, endereco: e.target.value }))} required />
            </label>

            <label>
              Número:
              <input type='text' value={formTerreno.numero} onChange={(e) => setFormTerreno((s) => ({ ...s, numero: e.target.value }))} />
            </label>

            <label>
              Complemento:
              <input type='text' value={formTerreno.complemento} onChange={(e) => setFormTerreno((s) => ({ ...s, complemento: e.target.value }))} />
            </label>

            <label>
              Bairro:
              <input type='text' value={formTerreno.bairro} onChange={(e) => setFormTerreno((s) => ({ ...s, bairro: e.target.value }))} />
            </label>

            <label>
              Cidade:
              <input type='text' value={formTerreno.cidade} onChange={(e) => setFormTerreno((s) => ({ ...s, cidade: e.target.value }))} required />
            </label>

            <label>
              Estado:
              <input type='text' value={formTerreno.estado} onChange={(e) => setFormTerreno((s) => ({ ...s, estado: e.target.value.toUpperCase() }))} maxLength={2} required />
            </label>

            <label>
              CEP:
              <input type='text' value={formTerreno.cep} onChange={(e) => setFormTerreno((s) => ({ ...s, cep: e.target.value }))} />
            </label>

            <label>
              Metragem total:
              <input type='number' step='0.01' min='0' value={formTerreno.metragemTotal} onChange={(e) => setFormTerreno((s) => ({ ...s, metragemTotal: e.target.value }))} required />
            </label>
          </div>

          {formTerreno.tipo === 'COMERCIAL' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <label>
                Vagas garagem:
                <input type='number' min='0' value={formTerreno.vagasGaragem} onChange={(e) => setFormTerreno((s) => ({ ...s, vagasGaragem: e.target.value }))} required />
              </label>
              <label>
                Quantidade salas:
                <input type='number' min='0' value={formTerreno.quantidadeSalas} onChange={(e) => setFormTerreno((s) => ({ ...s, quantidadeSalas: e.target.value }))} required />
              </label>
              <label>
                Metragem salas:
                <input type='number' step='0.01' min='0' value={formTerreno.metragemSalas} onChange={(e) => setFormTerreno((s) => ({ ...s, metragemSalas: e.target.value }))} required />
              </label>
            </div>
          )}

          {formTerreno.tipo === 'RESIDENCIAL' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              <label>
                Metragem casa:
                <input type='number' step='0.01' min='0' value={formTerreno.metragemCasa} onChange={(e) => setFormTerreno((s) => ({ ...s, metragemCasa: e.target.value }))} required />
              </label>
            </div>
          )}

          <label>
            Observações:
            <textarea value={formTerreno.observacoes} onChange={(e) => setFormTerreno((s) => ({ ...s, observacoes: e.target.value }))} rows={3} />
          </label>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type='submit' style={{ padding: '0.75rem 1.25rem', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              {modoEdicao ? 'Atualizar' : 'Criar'} terreno
            </button>
            {modoEdicao && (
              <button type='button' onClick={resetForm} style={{ padding: '0.75rem 1.25rem', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Cancelar
              </button>
            )}
          </div>
        </form>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tipo</th>
              <th>Endereço</th>
              <th>Cidade</th>
              <th>Estado</th>
              <th>Metragem</th>
              <th>Extras</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {terrenos.map((terreno) => (
              <tr key={terreno.id}>
                <td>{terreno.id}</td>
                <td>{terreno.tipo}</td>
                <td>{terreno.endereco}</td>
                <td>{terreno.cidade}</td>
                <td>{terreno.estado}</td>
                <td>{terreno.metragemTotal}</td>
                <td>
                  {terreno.tipo === 'COMERCIAL'
                    ? `Vagas: ${terreno.vagasGaragem ?? '—'} • Salas: ${terreno.quantidadeSalas ?? '—'} • Metragem salas: ${terreno.metragemSalas ?? '—'}`
                    : `Metragem casa: ${terreno.metragemCasa ?? '—'}`}
                </td>
                <td>
                  <button onClick={() => editarTerreno(terreno)} style={{ marginRight: '0.5rem' }}>
                    Editar
                  </button>
                  <button onClick={() => excluirTerreno(terreno.id)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className='card'>
        <h2>Salas ({salas.length})</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Identificação</th>
              <th>Metragem</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {salas.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.identificacao || '—'}</td>
                <td>{item.metragem ?? '—'}</td>
                <td>{item.status || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className='card'>
        <h2>Locatários ({locatarios.length})</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Email</th>
              <th>Telefone</th>
            </tr>
          </thead>
          <tbody>
            {locatarios.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.nome}</td>
                <td>{item.email}</td>
                <td>{item.telefone || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className='card'>
        <h2>Contratos ({contratos.length})</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Valor</th>
              <th>Início</th>
              <th>Fim</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {contratos.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.valorAluguel ?? '—'}</td>
                <td>{item.dataInicio || '—'}</td>
                <td>{item.dataTermino || '—'}</td>
                <td>{item.status || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}