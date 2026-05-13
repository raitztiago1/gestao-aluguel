'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Terreno = {
  id: number;
  tipo: string;
  endereco: string;
  metragemTotal: number;
  status?: string;
};

type Sala = { id: number; identificacao?: string; metragem?: number; status?: string };
type Locatario = { id: number; nome: string; email: string; telefone?: string };
type Contrato = { id: number; valorAluguel?: number; dataInicio?: string; dataTermino?: string; status?: string };

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

export default function CRUD() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [terrenos, setTerrenos] = useState<Terreno[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [locatarios, setLocatarios] = useState<Locatario[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);

  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [formTerreno, setFormTerreno] = useState({ id: 0, tipo: 'RESIDENCIAL', endereco: '', metragemTotal: 0 });
  const [modoEdicao, setModoEdicao] = useState(false);

  useEffect(() => {
    const logado = localStorage.getItem('logado');
    if (logado === 'true') {
      setIsLoggedIn(true);
      carregarDados();
    } else {
      router.push('/login');
    }
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
      if (modoEdicao) {
        await requestJson<Terreno>(`/api/terrenos/${formTerreno.id}`, 'PUT', formTerreno);
      } else {
        await requestJson<Terreno>('/api/terrenos', 'POST', formTerreno);
      }
      setFormTerreno({ id: 0, tipo: 'RESIDENCIAL', endereco: '', metragemTotal: 0 });
      setModoEdicao(false);
      await carregarDados();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao salvar terreno');
    }
  };

  const editarTerreno = (terreno: Terreno) => {
    setFormTerreno({ id: terreno.id, tipo: terreno.tipo, endereco: terreno.endereco, metragemTotal: terreno.metragemTotal });
    setModoEdicao(true);
    setErro(null);
  };

  const excluirTerreno = async (id: number) => {
    try {
      await fetch(`${API_BASE}/api/terrenos/${id}`, { method: 'DELETE' });
      await carregarDados();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao excluir terreno');
    }
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
        <form onSubmit={salvarTerreno} style={{ marginBottom: '1rem' }}>
          <div>
            <label>
              Tipo:
              <input type='text' value={formTerreno.tipo} onChange={(e) => setFormTerreno((s) => ({ ...s, tipo: e.target.value }))} required />
            </label>
          </div>
          <div>
            <label>
              Endereço:
              <input type='text' value={formTerreno.endereco} onChange={(e) => setFormTerreno((s) => ({ ...s, endereco: e.target.value }))} required />
            </label>
          </div>
          <div>
            <label>
              Metragem total:
              <input type='number' value={formTerreno.metragemTotal} onChange={(e) => setFormTerreno((s) => ({ ...s, metragemTotal: Number(e.target.value) }))} required />
            </label>
          </div>
          <button type='submit'>{modoEdicao ? 'Atualizar' : 'Criar'} terreno</button>
          {modoEdicao && <button type='button' onClick={() => { setModoEdicao(false); setFormTerreno({ id: 0, tipo: 'RESIDENCIAL', endereco: '', metragemTotal: 0 }); }}>Cancelar</button>}
        </form>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tipo</th>
              <th>Endereço</th>
              <th>Metragem</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {terrenos.map((terreno) => (
              <tr key={terreno.id}>
                <td>{terreno.id}</td>
                <td>{terreno.tipo}</td>
                <td>{terreno.endereco}</td>
                <td>{terreno.metragemTotal}</td>
                <td>
                  <button onClick={() => editarTerreno(terreno)}>Editar</button>
                  <button onClick={() => excluirTerreno(terreno.id)}>Excluir</button>
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