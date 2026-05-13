'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';
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
  const lastCepRef = useRef('');

  const fieldMissing = (value: string) => !value.trim();

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length > 5) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    return digits;
  };

  const lookupCep = async (cepDigits: string) => {
    try {
      setErro(null);
      const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      if (!response.ok) {
        throw new Error('Erro ao consultar CEP');
      }
      const data = await response.json();
      if (data.erro) {
        throw new Error('CEP não encontrado');
      }
      setFormTerreno((s) => ({
        ...s,
        endereco: data.logradouro || s.endereco,
        bairro: data.bairro || s.bairro,
        cidade: data.localidade || s.cidade,
        estado: data.uf || s.estado
      }));
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao consultar CEP');
    }
  };

  const handleCepChange = async (value: string) => {
    const formatted = formatCep(value);
    const digits = formatted.replace(/\D/g, '');
    setFormTerreno((s) => ({ ...s, cep: formatted }));
    if (digits.length === 8 && digits !== lastCepRef.current) {
      lastCepRef.current = digits;
      await lookupCep(digits);
    }
    if (digits.length < 8) {
      lastCepRef.current = '';
    }
  };

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
      <header className='page-header'>
        <div>
          <h1 className='page-title'>Gestão de Aluguel - CRUD</h1>
          <p className='page-subtitle'>Cadastro e visualização rápida de terrenos, salas, locatários e contratos.</p>
        </div>
        <div className='button-group'>
          <button type='button' className='button button-secondary' onClick={voltarParaHome}>
            ← Voltar para Home
          </button>
        </div>
      </header>

      <p className='small-text'>API base: {API_BASE}</p>

      {carregando && <div className='alert-card'>Carregando...</div>}
      {erro && <div className='alert-card alert-error'>{erro}</div>}

      <section className='card'>
        <div className='page-header'>
          <div>
            <h2>Terrenos (CRUD)</h2>
            <p className='page-subtitle'>Insira ou edite terrenos com informações completas e navegação clara.</p>
          </div>
          <div className='button-group'>
            <button type='button' className='button button-outline' onClick={resetForm}>
              Limpar formulário
            </button>
          </div>
        </div>

        <form onSubmit={salvarTerreno} className='form-grid'>
          <div className='form-grid-two'>
            <div className='form-group'>
              <label>Tipo <span className='required-star'>*</span></label>
              <select
                className={`select-field${fieldMissing(formTerreno.tipo) ? ' invalid' : ''}`}
                value={formTerreno.tipo}
                onChange={(e) => setFormTerreno((s) => ({ ...s, tipo: e.target.value as TipoTerreno }))}
                required
              >
                <option value='COMERCIAL'>Comercial</option>
                <option value='RESIDENCIAL'>Residencial</option>
              </select>
            </div>

            <div className='form-group'>
              <label>CEP</label>
              <input
                className='input-field'
                type='text'
                value={formTerreno.cep}
                onChange={(e) => void handleCepChange(e.target.value)}
                placeholder='00000-000'
                maxLength={9}
              />
            </div>

            <div className='form-group'>
              <label>Endereço <span className='required-star'>*</span></label>
              <input
                className={`input-field${fieldMissing(formTerreno.endereco) ? ' invalid' : ''}`}
                type='text'
                value={formTerreno.endereco}
                onChange={(e) => setFormTerreno((s) => ({ ...s, endereco: e.target.value }))}
                required
              />
            </div>

            <div className='form-group'>
              <label>Número</label>
              <input
                className='input-field'
                type='text'
                value={formTerreno.numero}
                onChange={(e) => setFormTerreno((s) => ({ ...s, numero: e.target.value }))}
              />
            </div>

            <div className='form-group'>
              <label>Complemento</label>
              <input
                className='input-field'
                type='text'
                value={formTerreno.complemento}
                onChange={(e) => setFormTerreno((s) => ({ ...s, complemento: e.target.value }))}
              />
            </div>

            <div className='form-group'>
              <label>Bairro</label>
              <input
                className='input-field'
                type='text'
                value={formTerreno.bairro}
                onChange={(e) => setFormTerreno((s) => ({ ...s, bairro: e.target.value }))}
              />
            </div>

            <div className='form-group'>
              <label>Cidade <span className='required-star'>*</span></label>
              <input
                className={`input-field${fieldMissing(formTerreno.cidade) ? ' invalid' : ''}`}
                type='text'
                value={formTerreno.cidade}
                onChange={(e) => setFormTerreno((s) => ({ ...s, cidade: e.target.value }))}
                required
              />
            </div>

            <div className='form-group'>
              <label>Estado <span className='required-star'>*</span></label>
              <input
                className={`input-field${fieldMissing(formTerreno.estado) ? ' invalid' : ''}`}
                type='text'
                value={formTerreno.estado}
                onChange={(e) => setFormTerreno((s) => ({ ...s, estado: e.target.value.toUpperCase() }))}
                maxLength={2}
                required
              />
            </div>

            <div className='form-group'>
              <label>Metragem total <span className='required-star'>*</span></label>
              <input
                className={`input-field${fieldMissing(formTerreno.metragemTotal) ? ' invalid' : ''}`}
                type='number'
                step='0.01'
                min='0'
                value={formTerreno.metragemTotal}
                onChange={(e) => setFormTerreno((s) => ({ ...s, metragemTotal: e.target.value }))}
                required
              />
            </div>
          </div>

          {formTerreno.tipo === 'COMERCIAL' && (
            <div className='form-grid-three'>
                <div className='form-group'>
                <label>Vagas garagem <span className='required-star'>*</span></label>
                <input
                  className={`input-field${fieldMissing(formTerreno.vagasGaragem) ? ' invalid' : ''}`}
                  type='number'
                  min='0'
                  value={formTerreno.vagasGaragem}
                  onChange={(e) => setFormTerreno((s) => ({ ...s, vagasGaragem: e.target.value }))}
                  required
                />
              </div>
              <div className='form-group'>
                <label>Quantidade salas <span className='required-star'>*</span></label>
                <input
                  className={`input-field${fieldMissing(formTerreno.quantidadeSalas) ? ' invalid' : ''}`}
                  type='number'
                  min='0'
                  value={formTerreno.quantidadeSalas}
                  onChange={(e) => setFormTerreno((s) => ({ ...s, quantidadeSalas: e.target.value }))}
                  required
                />
              </div>
              <div className='form-group'>
                <label>Metragem salas <span className='required-star'>*</span></label>
                <input
                  className={`input-field${fieldMissing(formTerreno.metragemSalas) ? ' invalid' : ''}`}
                  type='number'
                  step='0.01'
                  min='0'
                  value={formTerreno.metragemSalas}
                  onChange={(e) => setFormTerreno((s) => ({ ...s, metragemSalas: e.target.value }))}
                  required
                />
              </div>
            </div>
          )}

          {formTerreno.tipo === 'RESIDENCIAL' && (
            <div className='form-grid-two'>
              <div className='form-group'>
                <label>Metragem casa <span className='required-star'>*</span></label>
                <input
                  className={`input-field${fieldMissing(formTerreno.metragemCasa) ? ' invalid' : ''}`}
                  type='number'
                  step='0.01'
                  min='0'
                  value={formTerreno.metragemCasa}
                  onChange={(e) => setFormTerreno((s) => ({ ...s, metragemCasa: e.target.value }))}
                  required
                />
              </div>
            </div>
          )}

          <div className='form-group'>
            <label>Observações</label>
            <textarea
              className='textarea-field'
              value={formTerreno.observacoes}
              onChange={(e) => setFormTerreno((s) => ({ ...s, observacoes: e.target.value }))}
              rows={4}
            />
          </div>

          <div className='form-actions'>
            <button type='submit' className='button button-primary'>
              {modoEdicao ? 'Atualizar terreno' : 'Criar terreno'}
            </button>
            {modoEdicao && (
              <button type='button' className='button button-secondary' onClick={resetForm}>
                Cancelar
              </button>
            )}
          </div>
        </form>

        <table className='table'>
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
                <td className='table-actions'>
                  <button type='button' className='button button-outline' onClick={() => editarTerreno(terreno)}>
                    Editar
                  </button>
                  <button type='button' className='button button-secondary' onClick={() => excluirTerreno(terreno.id)}>
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
        <table className='table'>
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
        <table className='table'>
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
        <table className='table'>
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