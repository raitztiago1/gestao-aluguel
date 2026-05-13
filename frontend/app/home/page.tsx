'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearSession, isSessionValid, setupUnloadLogout } from '../lib/session';

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
    if (!isSessionValid()) {
      clearSession();
      router.push('/login');
      return;
    }

    setIsLoggedIn(true);
    carregarContratos();
    const cleanup = setupUnloadLogout();
    return cleanup;
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
    clearSession();
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

    const dataInicio = new Date(contrato.dataInicio);
    const mesInicio = dataInicio.getMonth();
    const anoInicio = dataInicio.getFullYear();

    let mesVencimento = mesInicio;
    let anoVencimento = anoInicio;

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

    return diffDays > 0;
  };

  const contratosEmAtraso = contratos.filter(verificarAtraso);

  if (!isLoggedIn) {
    return <div>Redirecionando para login...</div>;
  }

  return (
    <main className='container'>
      <header className='page-header'>
        <div>
          <h1 className='page-title'>Gestão de Aluguel</h1>
          <p className='page-subtitle'>Painel administrativo com visão de contratos, vencimentos e cobrança.</p>
        </div>
        <div className='button-group'>
          <button className='button button-primary' onClick={irParaCRUD}>
            CRUD
          </button>
          <button className='button button-danger' onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      {carregando && <div className='alert-card'>Carregando contratos...</div>}
      {erro && <div className='alert-card alert-error'>{erro}</div>}

      {contratosEmAtraso.length > 0 && (
        <div className='alert-card alert-warning'>
          <h3>⚠️ ALERTA: Contratos em Atraso</h3>
          <p>Existem {contratosEmAtraso.length} contrato(s) com pagamento(s) em atraso.</p>
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
        <table className='table'>
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
                <tr key={contrato.id}>
                  <td>{contrato.id}</td>
                  <td>{contrato.locatario?.nome || '—'}</td>
                  <td>{contrato.sala?.identificacao || '—'}</td>
                  <td>{contrato.sala?.terreno?.endereco || '—'}</td>
                  <td>R$ {contrato.valorAluguel?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '—'}</td>
                  <td>{contrato.diaVencimento || '—'}</td>
                  <td>{contrato.status || '—'}</td>
                  <td>
                    <span className={emAtraso ? 'badge badge-danger' : 'badge badge-success'}>
                      {emAtraso ? 'Em atraso' : 'Em dia'}
                    </span>
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
