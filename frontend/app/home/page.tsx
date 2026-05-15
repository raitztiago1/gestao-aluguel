'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AppHeader from '../components/AppHeader';
import ErrorAlert from '../components/ErrorAlert';
import StatusBadge from '../components/StatusBadge';
import { fetchJson } from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import {
  formatAddressLine,
  formatArea,
  formatCurrency,
  labelStatusContrato,
  labelTipoTerreno
} from '../lib/format';
import { clearSession, isSessionValid, setupUnloadLogout } from '../lib/session';

type TipoSalaStatus = 'DISPONIVEL' | 'LOCADA' | 'MANUTENCAO';

type Terreno = {
  id: number;
  tipo?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  metragemTotal?: number;
};

type Sala = {
  id: number;
  identificacao?: string;
  metragem?: number;
  status?: TipoSalaStatus;
  terreno?: { endereco?: string; numero?: string };
};

type Contrato = {
  id: number;
  valorAluguel?: number;
  dataInicio?: string;
  dataTermino?: string;
  status?: string;
  diaVencimento?: number;
  sala?: {
    identificacao?: string;
    terreno?: { endereco?: string; numero?: string };
  };
  locatario?: { nome?: string };
};

type ModalType = 'terrenos' | 'contratos' | 'salas' | null;

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [terrenos, setTerrenos] = useState<Terreno[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [terrenosCount, setTerrenosCount] = useState(0);
  const [salasDisponiveisCount, setSalasDisponiveisCount] = useState(0);
  const [contratosAtivosCount, setContratosAtivosCount] = useState(0);
  const [selectedModal, setSelectedModal] = useState<ModalType>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    document.title = 'Gestão de Aluguel - Home';
  }, []);

  useEffect(() => {
    if (!isSessionValid()) {
      clearSession();
      router.push('/login');
      return;
    }
    setIsLoggedIn(true);
    carregarDados();
    return setupUnloadLogout();
  }, [router]);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const [contratosData, terrenosData, salasData] = await Promise.all([
        fetchJson<Contrato>('/api/contratos'),
        fetchJson<Terreno>('/api/terrenos'),
        fetchJson<Sala>('/api/salas')
      ]);
      setContratos(contratosData);
      setTerrenos(terrenosData);
      setSalas(salasData);
      setTerrenosCount(terrenosData.length);
      setSalasDisponiveisCount(salasData.filter((s) => s.status === 'DISPONIVEL').length);
      setContratosAtivosCount(contratosData.filter((c) => c.status === 'ATIVO').length);
      setErro(null);
    } catch (err) {
      setErro(getErrorMessage(err, 'Erro ao carregar dados do painel.'));
    } finally {
      setCarregando(false);
    }
  };

  const verificarAtraso = (contrato: Contrato) => {
    if (!contrato.diaVencimento || !contrato.dataInicio) return false;
    const hoje = new Date();
    const diaAtual = hoje.getDate();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    const dataInicio = new Date(contrato.dataInicio);
    let mesVencimento = dataInicio.getMonth();
    let anoVencimento = dataInicio.getFullYear();
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
    const diffDays = Math.ceil((hoje.getTime() - dataVencimento.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0;
  };

  const contratosEmAtraso = contratos.filter(verificarAtraso);
  const contratosAtivos = contratos.filter((c) => c.status === 'ATIVO');
  const salasDisponiveis = salas.filter((s) => s.status === 'DISPONIVEL');

  if (!isLoggedIn) {
    return <div className='alert-card'>Redirecionando para login...</div>;
  }

  return (
    <main className='container'>
      <AppHeader
        title='Painel'
        subtitle='Visão geral dos terrenos, salas, contratos ativos e vencimentos de aluguel.'
      />

      {carregando && <div className='alert-card'>Carregando dados...</div>}
      {erro && <ErrorAlert message={erro} onDismiss={() => setErro(null)} />}

      <section className='summary-grid'>
        <article className='summary-card'>
          <p className='summary-label'>Terrenos cadastrados</p>
          <strong className='summary-value'>{terrenosCount}</strong>
          <button className='button button-link' onClick={() => setSelectedModal('terrenos')}>
            Ver detalhes
          </button>
        </article>
        <article className='summary-card'>
          <p className='summary-label'>Contratos ativos</p>
          <strong className='summary-value'>{contratosAtivosCount}</strong>
          <button className='button button-link' onClick={() => setSelectedModal('contratos')}>
            Ver detalhes
          </button>
        </article>
        <article className='summary-card summary-card-highlight'>
          <p className='summary-label'>Salas para alugar</p>
          <strong className='summary-value'>{salasDisponiveisCount}</strong>
          <button className='button button-link' onClick={() => setSelectedModal('salas')}>
            Ver detalhes
          </button>
        </article>
      </section>

      {selectedModal && (
        <div className='modal-backdrop' onClick={() => setSelectedModal(null)}>
          <div className='modal' onClick={(event) => event.stopPropagation()}>
            <div className='modal-header'>
              <div>
                <h2>
                  {selectedModal === 'terrenos' && 'Terrenos cadastrados'}
                  {selectedModal === 'contratos' && 'Contratos ativos'}
                  {selectedModal === 'salas' && 'Salas para alugar'}
                </h2>
                <p className='modal-description'>Resumo atualizado do seu portfólio.</p>
              </div>
              <button className='modal-close' onClick={() => setSelectedModal(null)} aria-label='Fechar modal'>
                ×
              </button>
            </div>

            <div className='modal-content'>
              {selectedModal === 'terrenos' && (
                <div className='modal-section'>
                  {terrenos.length === 0 ? (
                    <p>Nenhum terreno encontrado.</p>
                  ) : (
                    <div className='table-scroll'>
                      <table className='table'>
                        <thead>
                          <tr>
                            <th>Tipo</th>
                            <th>Endereço</th>
                            <th>Cidade</th>
                            <th>Metragem</th>
                          </tr>
                        </thead>
                        <tbody>
                          {terrenos.map((terreno) => (
                            <tr key={terreno.id}>
                              <td>{labelTipoTerreno(terreno.tipo)}</td>
                              <td>{formatAddressLine(terreno)}</td>
                              <td>{terreno.cidade || '—'}</td>
                              <td>{formatArea(terreno.metragemTotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {selectedModal === 'contratos' && (
                <div className='modal-section'>
                  {contratosAtivos.length === 0 ? (
                    <p>Nenhum contrato ativo no momento.</p>
                  ) : (
                    <div className='table-scroll'>
                      <table className='table'>
                        <thead>
                          <tr>
                            <th>Locatário</th>
                            <th>Sala</th>
                            <th>Endereço</th>
                            <th>Valor</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contratosAtivos.map((contrato) => (
                            <tr key={contrato.id}>
                              <td>{contrato.locatario?.nome || '—'}</td>
                              <td>{contrato.sala?.identificacao || '—'}</td>
                              <td>
                                {contrato.sala?.terreno
                                  ? formatAddressLine(contrato.sala.terreno)
                                  : '—'}
                              </td>
                              <td>{formatCurrency(contrato.valorAluguel)}</td>
                              <td>
                                <StatusBadge kind='contrato' status={contrato.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {selectedModal === 'salas' && (
                <div className='modal-section'>
                  {salasDisponiveis.length === 0 ? (
                    <p>Nenhuma sala disponível no momento.</p>
                  ) : (
                    <div className='table-scroll'>
                      <table className='table'>
                        <thead>
                          <tr>
                            <th>Sala</th>
                            <th>Metragem</th>
                            <th>Terreno</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salasDisponiveis.map((sala) => (
                            <tr key={sala.id}>
                              <td>{sala.identificacao || '—'}</td>
                              <td>{formatArea(sala.metragem)}</td>
                              <td>{sala.terreno ? formatAddressLine(sala.terreno) : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {contratosEmAtraso.length > 0 && (
        <div className='alert-card alert-warning'>
          <h3>Contratos em atraso</h3>
          <p>Existem {contratosEmAtraso.length} contrato(s) com pagamento em atraso.</p>
          <ul>
            {contratosEmAtraso.map((contrato) => (
              <li key={contrato.id}>
                <strong>{contrato.locatario?.nome || 'Locatário'}</strong> — {contrato.sala?.identificacao || 'Sala'}{' '}
                ({contrato.sala?.terreno ? formatAddressLine(contrato.sala.terreno) : 'endereço não informado'})
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className='card'>
        <h2>Vencimentos dos aluguéis ({contratos.length})</h2>
        <table className='table'>
          <thead>
            <tr>
              <th>Locatário</th>
              <th>Sala</th>
              <th>Endereço</th>
              <th>Valor</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {contratos.length === 0 ? (
              <tr>
                <td colSpan={7} className='table-empty'>
                  Nenhum contrato cadastrado.
                </td>
              </tr>
            ) : (
              contratos.map((contrato) => {
                const emAtraso = verificarAtraso(contrato);
                return (
                  <tr key={contrato.id}>
                    <td>{contrato.locatario?.nome || '—'}</td>
                    <td>{contrato.sala?.identificacao || '—'}</td>
                    <td>{contrato.sala?.terreno ? formatAddressLine(contrato.sala.terreno) : '—'}</td>
                    <td>{formatCurrency(contrato.valorAluguel)}</td>
                    <td>Dia {contrato.diaVencimento ?? '—'}</td>
                    <td>{labelStatusContrato(contrato.status)}</td>
                    <td>
                      <span className={emAtraso ? 'badge badge-danger' : 'badge badge-success'}>
                        {emAtraso ? 'Em atraso' : 'Em dia'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
