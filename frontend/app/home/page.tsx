'use client';

import { useEffect, useState } from 'react';
import AppHeader from '../components/AppHeader';
import ErrorAlert from '../components/ErrorAlert';
import StatusBadge from '../components/StatusBadge';
import { useAuthGuard } from '../hooks/useAuth';
import { deleteJson, fetchJson, requestJson } from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import {
  formatAddressLine,
  formatArea,
  formatCurrency,
  labelStatusContrato,
  labelTipoTerreno
} from '../lib/format';

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
  emDia?: boolean;
  situacao?: string;
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

type ModoPagamentoForm = 'adicionar' | 'editar' | null;

function formatarDataInput(data = new Date()) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function criarDataPeriodo(ano: number, mes: number) {
  return new Date(ano, mes - 1, 1);
}

function obterDataInicioContrato(contrato?: Contrato | null) {
  return contrato?.dataInicio?.slice(0, 10);
}

function periodoPermitido(contrato: Contrato | null, ano?: number, mes?: number) {
  if (!ano || !mes) {
    return false;
  }

  const periodo = criarDataPeriodo(ano, mes);
  const periodoAtual = criarDataPeriodo(new Date().getFullYear(), new Date().getMonth() + 1);
  const dataInicio = obterDataInicioContrato(contrato);

  if (dataInicio) {
    const periodoInicial = criarDataPeriodo(
      new Date(`${dataInicio}T00:00:00`).getFullYear(),
      new Date(`${dataInicio}T00:00:00`).getMonth() + 1
    );
    if (periodo < periodoInicial) {
      return false;
    }
  }

  if (contrato?.dataTermino) {
    const dataTermino = new Date(`${contrato.dataTermino}T00:00:00`);
    const periodoFinal = criarDataPeriodo(dataTermino.getFullYear(), dataTermino.getMonth() + 1);
    if (periodo > periodoFinal) {
      return false;
    }
  }

  return periodo <= periodoAtual;
}

function dataPagamentoPermitida(contrato: Contrato | null, dataPagamento?: string) {
  if (!dataPagamento) {
    return true;
  }

  const dataInicio = obterDataInicioContrato(contrato);
  if (dataInicio && dataPagamento < dataInicio) {
    return false;
  }

  return dataPagamento <= formatarDataInput();
}

const criarPagamentoInicial = (cobrancasExistentes: Cobranca[] = [], contrato?: Contrato | null): Partial<Cobranca> => {
  const periodosOcupados = new Set(
    cobrancasExistentes
      .filter((cobranca) => cobranca.ano && cobranca.mes)
      .map((cobranca) => `${cobranca.ano}-${cobranca.mes}`)
  );
  const dataSugerida = contrato?.dataInicio ? new Date(`${contrato.dataInicio}T00:00:00`) : new Date();
  const hoje = new Date();
  dataSugerida.setDate(1);
  hoje.setDate(1);

  while (
    dataSugerida <= hoje &&
    periodosOcupados.has(`${dataSugerida.getFullYear()}-${dataSugerida.getMonth() + 1}`)
  ) {
    dataSugerida.setMonth(dataSugerida.getMonth() + 1);
  }

  return {
    mes: dataSugerida.getMonth() + 1,
    ano: dataSugerida.getFullYear(),
    status: 'PAGO',
    dataPagamento: formatarDataInput()
  };
};

function normalizarCobrancas(items: Cobranca[]): Cobranca[] {
  return [...items]
    .map((item) => ({
      ...item,
      id: Number(item.id),
      ano: Number(item.ano),
      mes: Number(item.mes),
      valor: Number(item.valor)
    }))
    .sort((a, b) => b.ano - a.ano || b.mes - a.mes);
}

function formatarPeriodo(ano: number, mes: number) {
  const nomeMes = new Date(ano, mes - 1).toLocaleString('pt-BR', { month: 'long' });
  return `${nomeMes.charAt(0).toUpperCase()}${nomeMes.slice(1)}/${ano}`;
}

function obterAnoInicioContrato(contrato?: Contrato | null) {
  if (!contrato?.dataInicio) {
    return 1900;
  }

  return new Date(`${contrato.dataInicio}T00:00:00`).getFullYear();
}

function mesPermitidoParaAno(contrato: Contrato | null, ano: number | undefined, mes: number) {
  return periodoPermitido(contrato, ano, mes);
}

export default function Home() {
  const authStatus = useAuthGuard();
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [terrenos, setTerrenos] = useState<Terreno[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [terrenosCount, setTerrenosCount] = useState(0);
  const [salasDisponiveisCount, setSalasDisponiveisCount] = useState(0);
  const [contratosAtivosCount, setContratosAtivosCount] = useState(0);
  const [selectedModal, setSelectedModal] = useState<ModalType>(null);
  const [contratoSelecionado, setContratoSelecionado] = useState<Contrato | null>(null);
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [modoPagamentoForm, setModoPagamentoForm] = useState<ModoPagamentoForm>(null);
  const [cobrancaEmEdicao, setCobrancaEmEdicao] = useState<Cobranca | null>(null);
  const [formPagamento, setFormPagamento] = useState<Partial<Cobranca>>(criarPagamentoInicial());
  const [carregandoCobrancas, setCarregandoCobrancas] = useState(false);
  const [salvandoPagamento, setSalvandoPagamento] = useState(false);
  const [excluindoCobrancaId, setExcluindoCobrancaId] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    document.title = 'Gestão de Aluguel - Home';
  }, []);

  useEffect(() => {
    if (authStatus !== 'authenticated') {
      return;
    }
    carregarDados();
  }, [authStatus]);

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
      const cobrancasNormalizadas = normalizarCobrancas(dados || []);
      setCobrancas(cobrancasNormalizadas);
      return cobrancasNormalizadas;
    } catch (err) {
      setErro(getErrorMessage(err, 'Erro ao carregar cobranças.'));
      return [];
    } finally {
      setCarregandoCobrancas(false);
    }
  };

  const cancelarFormularioPagamento = () => {
    setModoPagamentoForm(null);
    setCobrancaEmEdicao(null);
    setFormPagamento(criarPagamentoInicial([], contratoSelecionado));
  };

  const abrirFormularioAdicionar = () => {
    const pagamentoInicial = criarPagamentoInicial(cobrancas, contratoSelecionado);
    if (!periodoPermitido(contratoSelecionado, pagamentoInicial.ano, pagamentoInicial.mes)) {
      setErro('Todos os pagamentos do contrato ate o mes atual ja foram registrados.');
      return;
    }

    setModoPagamentoForm('adicionar');
    setCobrancaEmEdicao(null);
    setFormPagamento(pagamentoInicial);
    setErro(null);
  };

  const abrirFormularioEditar = (cobranca: Cobranca) => {
    setModoPagamentoForm('editar');
    setCobrancaEmEdicao(cobranca);
    setFormPagamento({
      id: cobranca.id,
      ano: cobranca.ano,
      mes: cobranca.mes,
      valor: cobranca.valor,
      status: cobranca.status,
      dataPagamento: cobranca.dataPagamento?.slice(0, 10),
      observacoes: cobranca.observacoes || ''
    });
  };

  const abrirModalPagamentos = (contrato: Contrato) => {
    setContratoSelecionado(contrato);
    setSelectedModal('pagamentos');
    setModoPagamentoForm(null);
    setCobrancaEmEdicao(null);
    setFormPagamento(criarPagamentoInicial([], contrato));
    carregarCobrancas(contrato.id);
  };

  const salvarPagamento = async () => {
    if (!contratoSelecionado || !formPagamento.mes || !formPagamento.ano) {
      setErro('Preencha todos os campos obrigatórios.');
      return;
    }
    if (!periodoPermitido(contratoSelecionado, formPagamento.ano, formPagamento.mes)) {
      setErro('Selecione um periodo dentro da vigencia do contrato e ate o mes atual.');
      return;
    }
    if (!dataPagamentoPermitida(contratoSelecionado, formPagamento.dataPagamento)) {
      setErro('A data de pagamento deve estar entre a data de inicio do contrato e hoje.');
      return;
    }

    const periodoJaRegistrado = cobrancas.some(
      (cobranca) => cobranca.ano === formPagamento.ano && cobranca.mes === formPagamento.mes
    );
    if (modoPagamentoForm === 'adicionar' && periodoJaRegistrado) {
      setErro('Ja existe um pagamento registrado para este periodo. Use Editar ou escolha outro mes.');
      return;
    }

    try {
      setSalvandoPagamento(true);

      if (modoPagamentoForm === 'editar' && cobrancaEmEdicao) {
        await requestJson(`/api/cobrancas/${cobrancaEmEdicao.id}`, 'PUT', {
          status: 'PAGO',
          valor: formPagamento.valor || contratoSelecionado.valorAluguel,
          dataPagamento: formPagamento.dataPagamento || formatarDataInput(),
          observacoes: formPagamento.observacoes
        });
      } else {
        await requestJson(
          `/api/cobrancas/contrato/${contratoSelecionado.id}/mes/${formPagamento.ano}/${formPagamento.mes}`,
          'POST',
          {
            status: 'PAGO',
            valor: formPagamento.valor || contratoSelecionado.valorAluguel,
            dataPagamento: formPagamento.dataPagamento || formatarDataInput(),
            observacoes: formPagamento.observacoes
          }
        );
      }

      await carregarDados();
      const cobrancasAtualizadas = await carregarCobrancas(contratoSelecionado.id);
      if (modoPagamentoForm === 'adicionar') {
        const proximoPagamento = criarPagamentoInicial(cobrancasAtualizadas, contratoSelecionado);
        if (periodoPermitido(contratoSelecionado, proximoPagamento.ano, proximoPagamento.mes)) {
          setFormPagamento(proximoPagamento);
        } else {
          cancelarFormularioPagamento();
        }
      } else {
        cancelarFormularioPagamento();
      }
      setErro(null);
    } catch (err) {
      setErro(getErrorMessage(err, 'Erro ao salvar pagamento.'));
    } finally {
      setSalvandoPagamento(false);
    }
  };

  const excluirPagamento = async (cobranca: Cobranca) => {
    if (!contratoSelecionado) {
      return;
    }

    const confirmar = window.confirm(
      `Excluir o pagamento de ${formatarPeriodo(cobranca.ano, cobranca.mes)}? Esta ação não pode ser desfeita.`
    );
    if (!confirmar) {
      return;
    }

    try {
      setExcluindoCobrancaId(cobranca.id);
      await deleteJson(`/api/cobrancas/${cobranca.id}`);
      if (cobrancaEmEdicao?.id === cobranca.id) {
        cancelarFormularioPagamento();
      }
      await carregarDados();
      await carregarCobrancas(contratoSelecionado.id);
      setErro(null);
    } catch (err) {
      setErro(getErrorMessage(err, 'Erro ao excluir pagamento.'));
    } finally {
      setExcluindoCobrancaId(null);
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

  const getSituacaoContrato = (contrato: Contrato) => {
    if (contrato.status !== 'ATIVO') {
      return { label: 'Em aberto', className: 'badge badge-warning' };
    }

    const situacao = contrato.situacao || 'EM_ABERTO';

    if (situacao === 'EM_DIA') {
      return { label: 'Em dia', className: 'badge badge-success' };
    }
    if (situacao === 'EM_ATRASO') {
      return { label: 'Em atraso', className: 'badge badge-danger' };
    }
    return { label: 'Em aberto', className: 'badge badge-warning' };
  };

  const verificarAtraso = (contrato: Contrato) =>
    contrato.status === 'ATIVO' && contrato.situacao === 'EM_ATRASO';

  const contratosEmAtraso = contratos.filter(verificarAtraso);
  const contratosAtivos = contratos.filter((c) => c.status === 'ATIVO');
  const salasDisponiveis = salas.filter((s) => s.status === 'DISPONIVEL');

  if (authStatus !== 'authenticated') {
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
        <button type='button' className='summary-card summary-action-card' onClick={() => setSelectedModal('terrenos')}>
          <p className='summary-label'>Terrenos cadastrados</p>
          <strong className='summary-value'>{terrenosCount}</strong>
          <span className='summary-action-text'>Ver detalhes</span>
        </button>
        <button type='button' className='summary-card summary-action-card' onClick={() => setSelectedModal('contratos')}>
          <p className='summary-label'>Contratos ativos</p>
          <strong className='summary-value'>{contratosAtivosCount}</strong>
          <span className='summary-action-text'>Ver detalhes</span>
        </button>
        <button type='button' className='summary-card summary-card-highlight summary-action-card' onClick={() => setSelectedModal('salas')}>
          <p className='summary-label'>Salas para alugar</p>
          <strong className='summary-value'>{salasDisponiveisCount}</strong>
          <span className='summary-action-text'>Ver detalhes</span>
        </button>
      </section>

      {selectedModal && selectedModal !== 'pagamentos' && (
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
                <div className='section-toolbar'>
                  <h3>Histórico de Pagamentos ({cobrancas.length})</h3>
                  <button
                    type='button'
                    className='button button-primary button-small'
                    onClick={() => (modoPagamentoForm === 'adicionar' ? cancelarFormularioPagamento() : abrirFormularioAdicionar())}
                  >
                    {modoPagamentoForm === 'adicionar' ? 'Cancelar' : 'Adicionar pagamento'}
                  </button>
                </div>
                {modoPagamentoForm && (
                  <div className='payment-form-grid'>
                    <div className='form-group'>
                      <label htmlFor='ano'>Ano</label>
                      <input
                        id='ano'
                        type='number'
                        value={formPagamento.ano || ''}
                        onChange={(e) => setFormPagamento({ ...formPagamento, ano: parseInt(e.target.value, 10) })}
                        min={obterAnoInicioContrato(contratoSelecionado)}
                        max={new Date().getFullYear()}
                        disabled={modoPagamentoForm === 'editar'}
                      />
                    </div>
                    <div className='form-group'>
                      <label htmlFor='mes'>Mês</label>
                      <select
                        id='mes'
                        value={formPagamento.mes || ''}
                        onChange={(e) => setFormPagamento({ ...formPagamento, mes: parseInt(e.target.value, 10) })}
                        disabled={modoPagamentoForm === 'editar'}
                      >
                        {[...Array(12)].map((_, i) => (
                          <option
                            key={i + 1}
                            value={i + 1}
                            disabled={!mesPermitidoParaAno(contratoSelecionado, formPagamento.ano, i + 1)}
                          >
                            {new Date(2024, i).toLocaleString('pt-BR', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className='form-group'>
                      <label htmlFor='valor'>Valor</label>
                      <input
                        id='valor'
                        type='number'
                        step='0.01'
                        value={formPagamento.valor ?? contratoSelecionado.valorAluguel ?? ''}
                        onChange={(e) => setFormPagamento({ ...formPagamento, valor: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className='form-group'>
                      <label htmlFor='dataPagamento'>Data de Pagamento</label>
                      <input
                        id='dataPagamento'
                        type='date'
                        value={formPagamento.dataPagamento || ''}
                        onChange={(e) => setFormPagamento({ ...formPagamento, dataPagamento: e.target.value })}
                        min={obterDataInicioContrato(contratoSelecionado)}
                        max={formatarDataInput()}
                      />
                    </div>
                    <div className='form-group payment-notes'>
                      <label htmlFor='observacoes'>Observações</label>
                      <textarea
                        id='observacoes'
                        value={formPagamento.observacoes || ''}
                        onChange={(e) => setFormPagamento({ ...formPagamento, observacoes: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className='payment-form-actions'>
                      <button
                        type='button'
                        className='button button-primary'
                        onClick={salvarPagamento}
                        disabled={salvandoPagamento}
                      >
                        {salvandoPagamento
                          ? 'Salvando...'
                          : modoPagamentoForm === 'editar'
                            ? 'Salvar alterações'
                            : 'Registrar pagamento'}
                      </button>
                      <button
                        type='button'
                        className='button button-secondary'
                        onClick={cancelarFormularioPagamento}
                        disabled={salvandoPagamento}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
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
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cobrancas.map((cobranca) => (
                          <tr key={`${cobranca.id}-${cobranca.ano}-${cobranca.mes}`}>
                            <td>{formatarPeriodo(cobranca.ano, cobranca.mes)}</td>
                            <td>{formatCurrency(cobranca.valor)}</td>
                            <td>
                              <span className={obterClasseStatus(cobranca.status)}>
                                {obterLabelStatus(cobranca.status)}
                              </span>
                            </td>
                            <td>
                              {cobranca.dataPagamento
                                ? new Date(`${cobranca.dataPagamento}T00:00:00`).toLocaleDateString('pt-BR')
                                : '—'}
                            </td>
                            <td>{cobranca.observacoes || '—'}</td>
                            <td>
                              <div className='table-actions'>
                                <button
                                  type='button'
                                  className='button button-small button-outline'
                                  onClick={() => abrirFormularioEditar(cobranca)}
                                  disabled={excluindoCobrancaId === cobranca.id}
                                >
                                  Editar
                                </button>
                                <button
                                  type='button'
                                  className='button button-small button-danger'
                                  onClick={() => excluirPagamento(cobranca)}
                                  disabled={excluindoCobrancaId === cobranca.id}
                                >
                                  {excluindoCobrancaId === cobranca.id ? 'Excluindo...' : 'Excluir'}
                                </button>
                              </div>
                            </td>
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
                const situacao = getSituacaoContrato(contrato);
                return (
                  <tr key={contrato.id}>
                    <td>{contrato.locatario?.nome || '—'}</td>
                    <td>{contrato.sala?.identificacao || '—'}</td>
                    <td>{contrato.sala?.terreno ? formatAddressLine(contrato.sala.terreno) : '—'}</td>
                    <td>{formatCurrency(contrato.valorAluguel)}</td>
                    <td>Dia {contrato.diaVencimento ?? '—'}</td>
                    <td>{labelStatusContrato(contrato.status)}</td>
                    <td>
                      <span className={situacao.className}>{situacao.label}</span>
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
