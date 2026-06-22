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

type ModalType = 'terrenos' | 'contratos' | 'salas' | 'pagamentos' | null;

type Cobranca = {
  id: number;
  ano: number;
  mes: number;
  valor: number;
  status: 'PENDENTE' | 'PAGO' | 'INADIMPLENTE' | 'CANCELADO';
  dataPagamento?: string;
  observacoes?: string;
};

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
  const [contratoSelecionado, setContratoSelecionado] = useState<Contrato | null>(null);
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [novaCobranca, setNovaCobranca] = useState<Partial<Cobranca>>({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    status: 'PENDENTE'
  });
  const [carregandoCobrancas, setCarregandoCobrancas] = useState(false);
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

  const carregarCobrancas = async (contratoId: number) => {
    try {
      setCarregandoCobrancas(true);
      const dados = await fetchJson<Cobranca>(`/api/cobrancas/contrato/${contratoId}`);
      setCobrancas(dados || []);
    } catch (err) {
      setErro(getErrorMessage(err, 'Erro ao carregar cobranças.'));
    } finally {
      setCarregandoCobrancas(false);
    }
  };

  const abrirModalPagamentos = (contrato: Contrato) => {
    setContratoSelecionado(contrato);
    setSelectedModal('pagamentos');
    setNovaCobranca({
      mes: new Date().getMonth() + 1,
      ano: new Date().getFullYear(),
      status: 'PENDENTE'
    });
    carregarCobrancas(contrato.id);
  };

  const registrarPagamento = async () => {
    if (!contratoSelecionado || !novaCobranca.status || !novaCobranca.mes || !novaCobranca.ano) {
      setErro('Preencha todos os campos obrigatórios.');
      return;
    }

    try {
      const response = await fetch(`/api/cobrancas/contrato/${contratoSelecionado.id}/mes/${novaCobranca.ano}/${novaCobranca.mes}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: novaCobranca.status,
          valor: novaCobranca.valor || contratoSelecionado.valorAluguel,
          dataPagamento: novaCobranca.dataPagamento,
          observacoes: novaCobranca.observacoes
        })
      });

      if (!response.ok) throw new Error('Erro ao registrar pagamento');

      await carregarCobrancas(contratoSelecionado.id);
      setNovaCobranca({
        mes: new Date().getMonth() + 1,
        ano: new Date().getFullYear(),
        status: 'PENDENTE'
      });
      setErro(null);
    } catch (err) {
      setErro(getErrorMessage(err, 'Erro ao registrar pagamento.'));
    }
  };

  const obterLabelStatus = (status: string) => {
    const labels: Record<string, string> = {
      PENDENTE: 'Pendente',
      PAGO: 'Pago',
      INADIMPLENTE: 'Inadimplente',
      CANCELADO: 'Cancelado'
    };
    return labels[status] || status;
  };

  const obterClasseStatus = (status: string) => {
    switch (status) {
      case 'PAGO':
        return 'badge badge-success';
      case 'INADIMPLENTE':
        return 'badge badge-danger';
      case 'PENDENTE':
        return 'badge badge-warning';
      case 'CANCELADO':
        return 'badge badge-neutral';
      default:
        return 'badge';
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

      {selectedModal === 'pagamentos' && contratoSelecionado && (
        <div className='modal-backdrop' onClick={() => setSelectedModal(null)}>
          <div className='modal modal-large' onClick={(event) => event.stopPropagation()}>
            <div className='modal-header'>
              <div>
                <h2>Gerenciar Pagamentos</h2>
                <p className='modal-description'>
                  {contratoSelecionado.locatario?.nome} — Sala {contratoSelecionado.sala?.identificacao}
                </p>
              </div>
              <button className='modal-close' onClick={() => setSelectedModal(null)} aria-label='Fechar modal'>
                ×
              </button>
            </div>

            <div className='modal-content'>
              {erro && <ErrorAlert message={erro} onDismiss={() => setErro(null)} />}

              <div className='form-section'>
                <h3>Registrar Pagamento</h3>
                <div className='form-group'>
                  <label htmlFor='ano'>Ano</label>
                  <input
                    id='ano'
                    type='number'
                    value={novaCobranca.ano || ''}
                    onChange={(e) => setNovaCobranca({ ...novaCobranca, ano: parseInt(e.target.value) })}
                    min='2020'
                    max={new Date().getFullYear() + 1}
                  />
                </div>
                <div className='form-group'>
                  <label htmlFor='mes'>Mês</label>
                  <select
                    id='mes'
                    value={novaCobranca.mes || ''}
                    onChange={(e) => setNovaCobranca({ ...novaCobranca, mes: parseInt(e.target.value) })}
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(2024, i).toLocaleString('pt-BR', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='form-group'>
                  <label htmlFor='status'>Status</label>
                  <select
                    id='status'
                    value={novaCobranca.status || ''}
                    onChange={(e) => setNovaCobranca({ ...novaCobranca, status: e.target.value as Cobranca['status'] })}
                  >
                    <option value='PENDENTE'>Pendente</option>
                    <option value='PAGO'>Pago</option>
                    <option value='INADIMPLENTE'>Inadimplente</option>
                    <option value='CANCELADO'>Cancelado</option>
                  </select>
                </div>
                <div className='form-group'>
                  <label htmlFor='valor'>Valor</label>
                  <input
                    id='valor'
                    type='number'
                    step='0.01'
                    value={novaCobranca.valor || contratoSelecionado.valorAluguel || ''}
                    onChange={(e) => setNovaCobranca({ ...novaCobranca, valor: parseFloat(e.target.value) })}
                  />
                </div>
                <div className='form-group'>
                  <label htmlFor='dataPagamento'>Data de Pagamento</label>
                  <input
                    id='dataPagamento'
                    type='date'
                    value={novaCobranca.dataPagamento || ''}
                    onChange={(e) => setNovaCobranca({ ...novaCobranca, dataPagamento: e.target.value })}
                  />
                </div>
                <div className='form-group'>
                  <label htmlFor='observacoes'>Observações</label>
                  <textarea
                    id='observacoes'
                    value={novaCobranca.observacoes || ''}
                    onChange={(e) => setNovaCobranca({ ...novaCobranca, observacoes: e.target.value })}
                    rows={3}
                  />
                </div>
                <button className='button button-primary' onClick={registrarPagamento}>
                  Registrar Pagamento
                </button>
              </div>

              <div className='form-section'>
                <h3>Histórico de Pagamentos</h3>
                {carregandoCobrancas ? (
                  <p>Carregando histórico...</p>
                ) : cobrancas.length === 0 ? (
                  <p>Nenhum registro de pagamento.</p>
                ) : (
                  <div className='table-scroll'>
                    <table className='table'>
                      <thead>
                        <tr>
                          <th>Período</th>
                          <th>Valor</th>
                          <th>Status</th>
                          <th>Data Pagamento</th>
                          <th>Observações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cobrancas.map((cobranca) => (
                          <tr key={cobranca.id}>
                            <td>
                              {new Date(2024, cobranca.mes - 1).toLocaleString('pt-BR', { month: 'short' })}/{cobranca.ano}
                            </td>
                            <td>{formatCurrency(cobranca.valor)}</td>
                            <td>
                              <span className={obterClasseStatus(cobranca.status)}>
                                {obterLabelStatus(cobranca.status)}
                              </span>
                            </td>
                            <td>{cobranca.dataPagamento ? new Date(cobranca.dataPagamento).toLocaleDateString('pt-BR') : '—'}</td>
                            <td>{cobranca.observacoes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
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
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {contratos.length === 0 ? (
              <tr>
                <td colSpan={8} className='table-empty'>
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
                    <td>
                      <button
                        className='button button-small'
                        onClick={() => abrirModalPagamentos(contrato)}
                        title='Gerenciar pagamentos deste contrato'
                      >
                        Gerenciar
                      </button>
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
