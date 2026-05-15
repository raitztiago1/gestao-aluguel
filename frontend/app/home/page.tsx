'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AppHeader from '../components/AppHeader';
import { fetchJson } from '../lib/api';
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
  quantidadeSalas?: number;
  vagasGaragem?: number;
};

type Sala = {
  id: number;
  identificacao?: string;
  metragem?: number;
  status?: TipoSalaStatus;
  terreno?: {
    endereco?: string;
    numero?: string;
  };
};

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
      numero?: string;
    };
  };
  locatario?: {
    nome?: string;
  };
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
    const cleanup = setupUnloadLogout();
    return cleanup;
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
      setErro(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setCarregando(false);
    }
  };

  const abrirModal = (type: ModalType) => {
    setSelectedModal(type);
  };

  const fecharModal = () => {
    setSelectedModal(null);
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
      <AppHeader
        title='Painel'
        subtitle='Visão geral dos terrenos, salas, contratos ativos e vencimentos de aluguel.'
      />

      {carregando && <div className='alert-card'>Carregando dados...</div>}
      {erro && <div className='alert-card alert-error'>{erro}</div>}

      <section className='summary-grid'>
        <article className='summary-card'>
          <p className='summary-label'>Terrenos cadastrados</p>
          <strong className='summary-value'>{terrenosCount}</strong>
          <button className='button button-link' onClick={() => abrirModal('terrenos')}>
            Ver detalhes
          </button>
        </article>
        <article className='summary-card'>
          <p className='summary-label'>Contratos ativos</p>
          <strong className='summary-value'>{contratosAtivosCount}</strong>
          <button className='button button-link' onClick={() => abrirModal('contratos')}>
            Ver detalhes
          </button>
        </article>
        <article className='summary-card summary-card-highlight'>
          <p className='summary-label'>Salas para alugar</p>
          <strong className='summary-value'>{salasDisponiveisCount}</strong>
          <button className='button button-link' onClick={() => abrirModal('salas')}>
            Ver detalhes
          </button>
        </article>
      </section>

      {selectedModal && (
        <div className='modal-backdrop' onClick={fecharModal}>
          <div className='modal' onClick={(event) => event.stopPropagation()}>
            <div className='modal-header'>
              <div>
                <h2>
                  {selectedModal === 'terrenos' && 'Terrenos cadastrados'}
                  {selectedModal === 'contratos' && 'Contratos ativos'}
                  {selectedModal === 'salas' && 'Salas para alugar'}
                </h2>
                <p className='modal-description'>Informações atualizadas direto do servidor.</p>
              </div>
              <button className='modal-close' onClick={fecharModal} aria-label='Fechar modal'>×</button>
            </div>

            <div className='modal-content'>
              {selectedModal === 'terrenos' && (
                <div className='modal-section'>
                  <p className='summary-label'>Total de terrenos</p>
                  <strong className='summary-value'>{terrenosCount}</strong>
                  {terrenos.length === 0 ? (
                    <p>Nenhum terreno encontrado.</p>
                  ) : (
                    <div className='table-scroll'>
                      <table className='table'>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Tipo</th>
                            <th>Endereço</th>
                            <th>Cidade</th>
                            <th>Metragem</th>
                          </tr>
                        </thead>
                        <tbody>
                          {terrenos.map((terreno) => (
                            <tr key={terreno.id}>
                              <td>{terreno.id}</td>
                              <td>{terreno.tipo || '—'}</td>
                              <td>{terreno.endereco}{terreno.numero ? `, ${terreno.numero}` : ''}</td>
                              <td>{terreno.cidade || '—'}</td>
                              <td>{terreno.metragemTotal ?? '—'}</td>
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
                  <p className='summary-label'>Total de contratos carregados</p>
                  <strong className='summary-value'>{contratos.length}</strong>
                  {contratos.length === 0 ? (
                    <p>Nenhum contrato encontrado.</p>
                  ) : (
                    <div className='table-scroll'>
                      <table className='table'>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Locatário</th>
                            <th>Sala</th>
                            <th>Endereço</th>
                            <th>Valor</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contratos.map((contrato) => (
                            <tr key={contrato.id}>
                              <td>{contrato.id}</td>
                              <td>{contrato.locatario?.nome || '—'}</td>
                              <td>{contrato.sala?.identificacao || '—'}</td>
                              <td>{contrato.sala?.terreno?.endereco}{contrato.sala?.terreno?.numero ? `, ${contrato.sala.terreno.numero}` : ''}</td>
                              <td>{contrato.valorAluguel != null ? `R$ ${contrato.valorAluguel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}</td>
                              <td>{contrato.status || '—'}</td>
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
                  <p className='summary-label'>Salas disponíveis</p>
                  <strong className='summary-value'>{salasDisponiveisCount}</strong>
                  {salas.filter((s) => s.status === 'DISPONIVEL').length === 0 ? (
                    <p>Nenhuma sala disponível no momento.</p>
                  ) : (
                    <div className='table-scroll'>
                      <table className='table'>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Identificação</th>
                            <th>Metragem</th>
                            <th>Status</th>
                            <th>Terreno</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salas
                            .filter((s) => s.status === 'DISPONIVEL')
                            .map((sala) => (
                              <tr key={sala.id}>
                                <td>{sala.id}</td>
                                <td>{sala.identificacao || '—'}</td>
                                <td>{sala.metragem != null ? `${sala.metragem} m²` : '—'}</td>
                                <td>{sala.status || '—'}</td>
                                <td>{sala.terreno?.endereco}{sala.terreno?.numero ? `, ${sala.terreno.numero}` : ''}</td>
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
          <h3>⚠️ ALERTA: Contratos em Atraso</h3>
          <p>Existem {contratosEmAtraso.length} contrato(s) com pagamento(s) em atraso.</p>
          <ul>
            {contratosEmAtraso.map((contrato) => (
              <li key={contrato.id}>
                <strong>Contrato #{contrato.id}</strong> - {contrato.locatario?.nome} - {contrato.sala?.identificacao} ({contrato.sala?.terreno?.endereco}{contrato.sala?.terreno?.numero ? `, ${contrato.sala.terreno.numero}` : ''})
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
