'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Contrato = {
  id: number;
  valorAluguel?: number;
  dataInicio?: string;
  dataTermino?: string;
  status?: string;
  diaVencimento?: number;
  sala?: {
    id: number;
    identificacao?: string;
    terreno?: {
      endereco?: string;
    };
  };
  locatario?: {
    nome?: string;
  };
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

const fetchJson = async <T,>(path: string): Promise<T[]> => {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Erro: ${res.status}`);
  return (await res.json()) as T[];
};

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const logado = localStorage.getItem('logado');
    if (logado === 'true') {
      setIsLoggedIn(true);
      carregarContratos();
    } else {
      router.push('/login');
    }
  }, [router]);

  const carregarContratos = async () => {
    try {
      setCarregando(true);
      const contratosData = await fetchJson<Contrato>('/api/contratos');
      setContratos(contratosData);
      setErro(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar contratos');
    } finally {
      setCarregando(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('logado');
    setIsLoggedIn(false);
    router.push('/login');
  };

  const irParaCRUD = () => {
    router.push('/crud');
  };

  const verificarAtraso = (contrato: Contrato) => {
    if (!contrato.diaVencimento || !contrato.dataInicio) return false;

    const hoje = new Date();
    const diaAtual = hoje.getDate();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    // Data de início do contrato
    const dataInicio = new Date(contrato.dataInicio);
    const mesInicio = dataInicio.getMonth();
    const anoInicio = dataInicio.getFullYear();

    // Calcula o próximo vencimento
    let mesVencimento = mesInicio;
    let anoVencimento = anoInicio;

    // Se já passou do dia de vencimento do mês atual, o próximo é no próximo mês
    if (diaAtual > contrato.diaVencimento) {
      mesVencimento = mesAtual + 1;
      anoVencimento = anoAtual;
      if (mesVencimento > 11) {
        mesVencimento = 0;
        anoVencimento = anoAtual + 1;
      }
    } else {
      mesVencimento = mesAtual;
      anoVencimento = anoAtual;
    }

    const dataVencimento = new Date(anoVencimento, mesVencimento, contrato.diaVencimento);
    const diffTime = hoje.getTime() - dataVencimento.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0; // Se positivo, está em atraso
  };

  const contratosEmAtraso = contratos.filter(verificarAtraso);

  if (!isLoggedIn) {
    return <div>Redirecionando para login...</div>;
  }

  return (
    <main className='container'>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Gestão de Aluguel - Home</h1>
        <div>
          <button onClick={irParaCRUD} style={{
            padding: '0.5rem 1rem',
            background: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '1rem'
          }}>
            CRUD
          </button>
          <button onClick={logout} style={{
            padding: '0.5rem 1rem',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            Sair
          </button>
        </div>
      </header>

      {carregando && <p>Carregando contratos...</p>}
      {erro && <p style={{ color: 'red' }}>{erro}</p>}

      {contratosEmAtraso.length > 0 && (
        <div style={{
          background: '#ffebee',
          border: '1px solid #f44336',
          borderRadius: '4px',
          padding: '1rem',
          marginBottom: '2rem',
          color: '#c62828'
        }}>
          <h3>⚠️ ALERTA: Contratos em Atraso</h3>
          <p>Existem {contratosEmAtraso.length} contrato(s) com pagamento(s) em atraso:</p>
          <ul>
            {contratosEmAtraso.map((contrato) => (
              <li key={contrato.id}>
                <strong>Contrato #{contrato.id}</strong> - {contrato.locatario?.nome} - {contrato.sala?.identificacao} ({contrato.sala?.terreno?.endereco})
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className='card'>
        <h2>Vencimentos dos Aluguéis ({contratos.length})</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Locatário</th>
              <th>Sala</th>
              <th>Endereço</th>
              <th>Valor</th>
              <th>Dia Vencimento</th>
              <th>Status</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {contratos.map((contrato) => {
              const emAtraso = verificarAtraso(contrato);
              return (
                <tr key={contrato.id} style={emAtraso ? { backgroundColor: '#fff5f5' } : {}}>
                  <td>{contrato.id}</td>
                  <td>{contrato.locatario?.nome || '—'}</td>
                  <td>{contrato.sala?.identificacao || '—'}</td>
                  <td>{contrato.sala?.terreno?.endereco || '—'}</td>
                  <td>R$ {contrato.valorAluguel?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '—'}</td>
                  <td>{contrato.diaVencimento || '—'}</td>
                  <td>{contrato.status || '—'}</td>
                  <td style={emAtraso ? { color: '#d32f2f', fontWeight: 'bold' } : { color: '#2e7d32' }}>
                    {emAtraso ? 'EM ATRASO' : 'EM DIA'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </main>
  );
}