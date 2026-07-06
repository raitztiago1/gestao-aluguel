'use client';

import { FormEvent, useEffect, useState } from 'react';
import AppHeader from '../components/AppHeader';
import ErrorAlert from '../components/ErrorAlert';
import MaskedInput from '../components/MaskedInput';
import StatusBadge from '../components/StatusBadge';
import { useAuthGuard } from '../hooks/useAuth';
import { fetchJson, requestJson } from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import {
    formatCurrency,
    formatDate,
    formatLocatarioOption,
    formatSalaOption
} from '../lib/format';
import { dateBrToIso, isoToDateBr, maskCurrency, onlyDigits, parseCurrency } from '../lib/masks';
import { getToken } from '../lib/session';

type StatusContrato = 'ATIVO' | 'ENCERRADO' | 'RENOVACAO' | 'CANCELADO';
type SortDirection = 'asc' | 'desc';
type ContratoSortKey = 'sala' | 'locatario' | 'periodo' | 'valor' | 'vencimento' | 'status';

type Sala = {
  id: number;
  identificacao?: string;
  metragem?: number;
  terreno?: { endereco?: string; numero?: string; cidade?: string; estado?: string };
};

type Locatario = { id: number; nome?: string; cpfCnpj?: string; tipoPessoa?: string };

type Contrato = {
  id: number;
  sala: Sala;
  locatario: Locatario;
  dataInicio: string;
  dataTermino: string;
  valorAluguel: number;
  diaVencimento: number;
  diaVencimentoAgua?: number;
  diaVencimentoLuz?: number;
  diaVencimentoIptu?: number;
  valorOutrasDespesas?: number;
  documentoUrl?: string;
  status?: StatusContrato;
  observacoes?: string;
};

type ContratoForm = {
  id?: number;
  salaId: string;
  locatarioId: string;
  dataInicio: string;
  dataTermino: string;
  valorAluguel: string;
  diaVencimento: string;
  diaVencimentoAgua: string;
  diaVencimentoLuz: string;
  diaVencimentoIptu: string;
  valorOutrasDespesas: string;
  documentoUrl: string;
  status: StatusContrato;
  observacoes: string;
};

const defaultContratoForm: ContratoForm = {
  salaId: '',
  locatarioId: '',
  dataInicio: '',
  dataTermino: '',
  valorAluguel: '',
  diaVencimento: '',
  diaVencimentoAgua: '',
  diaVencimentoLuz: '',
  diaVencimentoIptu: '',
  valorOutrasDespesas: '',
  documentoUrl: '',
  status: 'ATIVO',
  observacoes: ''
};

export default function ContratosPage() {
  const authStatus = useAuthGuard();
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [locatarios, setLocatarios] = useState<Locatario[]>([]);
  const [formContrato, setFormContrato] = useState<ContratoForm>(defaultContratoForm);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: ContratoSortKey; direction: SortDirection }>({
    key: 'periodo',
    direction: 'asc'
  });

  useEffect(() => {
    document.title = 'Gestão de Aluguel - Contratos';
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
      const [loadedContratos, loadedSalas, loadedLocatarios] = await Promise.all([
        fetchJson<Contrato>('/api/contratos'),
        fetchJson<Sala>('/api/salas'),
        fetchJson<Locatario>('/api/locatarios')
      ]);
      setContratos(loadedContratos);
      setSalas(loadedSalas);
      setLocatarios(loadedLocatarios);
      setErro(null);
    } catch (err) {
      setErro(getErrorMessage(err, 'Erro ao carregar contratos.'));
    } finally {
      setCarregando(false);
    }
  };

  const salvarContrato = async (event: FormEvent) => {
    event.preventDefault();
    const dataInicio = dateBrToIso(formContrato.dataInicio);
    const dataTermino = dateBrToIso(formContrato.dataTermino);
    if (!dataInicio || !dataTermino) {
      setErro('Informe datas válidas no formato DD/MM/AAAA.');
      return;
    }
    try {
      const payload = {
        sala: { id: Number(formContrato.salaId) },
        locatario: { id: Number(formContrato.locatarioId) },
        dataInicio,
        dataTermino,
        valorAluguel: parseCurrency(formContrato.valorAluguel),
        diaVencimento: Number(onlyDigits(formContrato.diaVencimento)),
        diaVencimentoAgua: formContrato.diaVencimentoAgua ? Number(onlyDigits(formContrato.diaVencimentoAgua)) : undefined,
        diaVencimentoLuz: formContrato.diaVencimentoLuz ? Number(onlyDigits(formContrato.diaVencimentoLuz)) : undefined,
        diaVencimentoIptu: formContrato.diaVencimentoIptu ? Number(onlyDigits(formContrato.diaVencimentoIptu)) : undefined,
        valorOutrasDespesas: formContrato.valorOutrasDespesas ? parseCurrency(formContrato.valorOutrasDespesas) : undefined,
        status: formContrato.status,
        observacoes: formContrato.observacoes.trim() || undefined
      };

      let saved: Contrato | null = null;
      if (modoEdicao && formContrato.id) {
        saved = await requestJson<Contrato>(`/api/contratos/${formContrato.id}`, 'PUT', payload);
      } else {
        saved = await requestJson<Contrato>('/api/contratos', 'POST', payload);
      }

      // If PDF selected, upload it (non-blocking)
      if (documentFile && saved && saved.id) {
        try {
          const token = getToken();
          const form = new FormData();
          form.append('file', documentFile, documentFile.name);

          await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}/api/contratos/${saved.id}/documento`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            body: form
          });
        } catch (uploadErr) {
          setErro('Contrato salvo, mas falha ao enviar o PDF.');
        }
      }

      resetForm();
      await carregarDados();
    } catch (err) {
      setErro(getErrorMessage(err, 'Falha ao salvar contrato.'));
    }
  };

  const editarContrato = (contrato: Contrato) => {
    setFormContrato({
      id: contrato.id,
      salaId: contrato.sala?.id.toString() ?? '',
      locatarioId: contrato.locatario?.id.toString() ?? '',
      dataInicio: isoToDateBr(contrato.dataInicio),
      dataTermino: isoToDateBr(contrato.dataTermino),
      valorAluguel: maskCurrency(String(Math.round((contrato.valorAluguel ?? 0) * 100))),
      diaVencimento: contrato.diaVencimento ? String(contrato.diaVencimento) : '',
      diaVencimentoAgua: contrato.diaVencimentoAgua ? String(contrato.diaVencimentoAgua) : '',
      diaVencimentoLuz: contrato.diaVencimentoLuz ? String(contrato.diaVencimentoLuz) : '',
      diaVencimentoIptu: contrato.diaVencimentoIptu ? String(contrato.diaVencimentoIptu) : '',
      valorOutrasDespesas: contrato.valorOutrasDespesas ? maskCurrency(String(Math.round(contrato.valorOutrasDespesas * 100))) : '',
      documentoUrl: contrato.documentoUrl ?? '',
      status: contrato.status ?? 'ATIVO',
      observacoes: contrato.observacoes ?? ''
    });
    setModoEdicao(true);
    setShowModal(true);
    setErro(null);
  };

  const excluirContrato = async (id: number) => {
    if (!window.confirm('Deseja realmente excluir este contrato?')) return;
    try {
      await requestJson<void>(`/api/contratos/${id}`, 'DELETE');
      await carregarDados();
    } catch (err) {
      setErro(getErrorMessage(err, 'Falha ao excluir contrato.'));
    }
  };

  const resetForm = () => {
    setModoEdicao(false);
    setFormContrato(defaultContratoForm);
    setShowModal(false);
    setErro(null);
  };

  const handleSort = (key: ContratoSortKey) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedContratos = [...contratos].sort((a, b) => {
    const direction = sortConfig.direction === 'asc' ? 1 : -1;
    const valueA = (() => {
      switch (sortConfig.key) {
        case 'sala':
          return (a.sala?.identificacao || 'Sala não informada').toLowerCase();
        case 'locatario':
          return (a.locatario?.nome || 'Locatário não informado').toLowerCase();
        case 'periodo':
          return `${a.dataInicio || ''} ${a.dataTermino || ''}`.toLowerCase();
        case 'valor':
          return a.valorAluguel;
        case 'vencimento':
          return a.diaVencimento;
        case 'status':
          return a.status ?? 'ATIVO';
        default:
          return '';
      }
    })();
    const valueB = (() => {
      switch (sortConfig.key) {
        case 'sala':
          return (b.sala?.identificacao || 'Sala não informada').toLowerCase();
        case 'locatario':
          return (b.locatario?.nome || 'Locatário não informado').toLowerCase();
        case 'periodo':
          return `${b.dataInicio || ''} ${b.dataTermino || ''}`.toLowerCase();
        case 'valor':
          return b.valorAluguel;
        case 'vencimento':
          return b.diaVencimento;
        case 'status':
          return b.status ?? 'ATIVO';
        default:
          return '';
      }
    })();

    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return (valueA - valueB) * direction;
    }

    return String(valueA).localeCompare(String(valueB)) * direction;
  });

  if (authStatus !== 'authenticated') {
    return <div className='alert-card'>Redirecionando para login...</div>;
  }

  return (
    <main className='container'>
      <AppHeader />

      {carregando && <div className='alert-card'>Carregando...</div>}
      {erro && <ErrorAlert message={erro} onDismiss={() => setErro(null)} />}

      <div className='page-toolbar'>
        <h2>Contratos cadastrados ({contratos.length})</h2>
        <button
          type='button'
          className='button button-primary'
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          + Novo contrato
        </button>
      </div>

      {showModal && (
        <div className='modal-backdrop' onClick={resetForm}>
          <div className='modal' onClick={(event) => event.stopPropagation()}>
            <div className='modal-header'>
              <div>
                <h2>{modoEdicao ? 'Editar contrato' : 'Novo contrato'}</h2>
                <p className='modal-description'>Associe sala e locatário, defina datas e valores.</p>
              </div>
              <button className='modal-close' onClick={resetForm} aria-label='Fechar modal'>×</button>
            </div>

            <div className='modal-content'>
              <form onSubmit={salvarContrato} className='form-grid'>
                <div className='form-group'>
                  <label>Sala <span className='required-star'>*</span></label>
                  <select
                    className='select-field'
                    required
                    value={formContrato.salaId}
                    onChange={(e) => setFormContrato((s) => ({ ...s, salaId: e.target.value }))}
                  >
                    <option value=''>Selecione a sala</option>
                    {salas.map((sala) => (
                      <option key={sala.id} value={sala.id}>
                        {formatSalaOption(sala)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className='form-group'>
                  <label>Locatário <span className='required-star'>*</span></label>
                  <select
                    className='select-field'
                    required
                    value={formContrato.locatarioId}
                    onChange={(e) => setFormContrato((s) => ({ ...s, locatarioId: e.target.value }))}
                  >
                    <option value=''>Selecione o locatário</option>
                    {locatarios.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {formatLocatarioOption(loc)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className='form-grid-two'>
                  <div className='form-group'>
                    <label>Data de início <span className='required-star'>*</span></label>
                    <MaskedInput
                      mask='date'
                      required
                      value={formContrato.dataInicio}
                      onValueChange={(dataInicio) => setFormContrato((s) => ({ ...s, dataInicio }))}
                      placeholder='DD/MM/AAAA'
                      inputMode='numeric'
                    />
                  </div>
                  <div className='form-group'>
                    <label>Data de término <span className='required-star'>*</span></label>
                    <MaskedInput
                      mask='date'
                      required
                      value={formContrato.dataTermino}
                      onValueChange={(dataTermino) => setFormContrato((s) => ({ ...s, dataTermino }))}
                      placeholder='DD/MM/AAAA'
                      inputMode='numeric'
                    />
                  </div>
                </div>

                <div className='form-grid-two'>
                  <div className='form-group'>
                    <label>Valor do aluguel <span className='required-star'>*</span></label>
                    <MaskedInput
                      mask='currency'
                      required
                      value={formContrato.valorAluguel}
                      onValueChange={(valorAluguel) => setFormContrato((s) => ({ ...s, valorAluguel }))}
                      placeholder='0,00'
                      inputMode='decimal'
                    />
                  </div>
                  <div className='form-group'>
                    <label>Dia do vencimento <span className='required-star'>*</span></label>
                    <MaskedInput
                      mask='day'
                      required
                      value={formContrato.diaVencimento}
                      onValueChange={(diaVencimento) => setFormContrato((s) => ({ ...s, diaVencimento }))}
                      placeholder='Ex.: 10'
                      inputMode='numeric'
                      maxLength={2}
                    />
                    <span className='field-hint'>Dia do mês em que o aluguel vence (1 a 31)</span>
                  </div>
                </div>

                <div className='form-grid-three'>
                  <div className='form-group'>
                    <label>Dia de cobrança da água</label>
                    <MaskedInput
                      mask='day'
                      value={formContrato.diaVencimentoAgua}
                      onValueChange={(diaVencimentoAgua) => setFormContrato((s) => ({ ...s, diaVencimentoAgua }))}
                      placeholder='Ex.: 10'
                      inputMode='numeric'
                      maxLength={2}
                    />
                  </div>
                  <div className='form-group'>
                    <label>Dia de cobrança da luz</label>
                    <MaskedInput
                      mask='day'
                      value={formContrato.diaVencimentoLuz}
                      onValueChange={(diaVencimentoLuz) => setFormContrato((s) => ({ ...s, diaVencimentoLuz }))}
                      placeholder='Ex.: 10'
                      inputMode='numeric'
                      maxLength={2}
                    />
                  </div>
                  <div className='form-group'>
                    <label>Dia de cobrança do IPTU</label>
                    <MaskedInput
                      mask='day'
                      value={formContrato.diaVencimentoIptu}
                      onValueChange={(diaVencimentoIptu) => setFormContrato((s) => ({ ...s, diaVencimentoIptu }))}
                      placeholder='Ex.: 10'
                      inputMode='numeric'
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className='form-group'>
                  <label>Outras despesas</label>
                  <MaskedInput
                    mask='currency'
                    value={formContrato.valorOutrasDespesas}
                    onValueChange={(valorOutrasDespesas) => setFormContrato((s) => ({ ...s, valorOutrasDespesas }))}
                    placeholder='0,00'
                    inputMode='decimal'
                  />
                </div>

                <div className='form-group'>
                  <label>Status</label>
                  <select
                    className='select-field'
                    value={formContrato.status}
                    onChange={(e) => setFormContrato((s) => ({ ...s, status: e.target.value as StatusContrato }))}
                  >
                    <option value='ATIVO'>Ativo</option>
                    <option value='ENCERRADO'>Encerrado</option>
                    <option value='RENOVACAO'>Em renovação</option>
                    <option value='CANCELADO'>Cancelado</option>
                  </select>
                </div>

                <div className='form-group'>
                  <label>Observações</label>
                  <textarea
                    className='textarea-field'
                    rows={4}
                    value={formContrato.observacoes}
                    onChange={(e) => setFormContrato((s) => ({ ...s, observacoes: e.target.value }))}
                  />
                </div>

                <div className='form-group'>
                  <label>Documento do contrato (PDF)</label>
                  <input
                    type='file'
                    accept='application/pdf'
                    onChange={(e) => setDocumentFile(e.target.files && e.target.files.length ? e.target.files[0] : null)}
                  />
                  {formContrato.documentoUrl && formContrato.id && (
                    <div className='field-hint'>
                      Documento existente:{' '}
                      <a
                        href={`/api/contratos/${formContrato.id}/documento`}
                        target='_blank'
                        rel='noreferrer'
                      >
                        baixar contrato
                      </a>
                    </div>
                  )}
                  <span className='field-hint'>Anexe um PDF do contrato (opcional).</span>
                </div>

                <div className='form-actions'>
                  <button type='submit' className='button button-primary'>
                    {modoEdicao ? 'Salvar alterações' : 'Cadastrar contrato'}
                  </button>
                  <button type='button' className='button button-secondary' onClick={resetForm}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <section className='card'>
        <table className='table'>
          <thead>
            <tr>
              <th>
                <button type='button' onClick={() => handleSort('sala')} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', fontWeight: 'inherit' }}>
                  Sala {sortConfig.key === 'sala' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </button>
              </th>
              <th>
                <button type='button' onClick={() => handleSort('locatario')} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', fontWeight: 'inherit' }}>
                  Locatário {sortConfig.key === 'locatario' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </button>
              </th>
              <th>
                <button type='button' onClick={() => handleSort('periodo')} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', fontWeight: 'inherit' }}>
                  Período {sortConfig.key === 'periodo' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </button>
              </th>
              <th>
                <button type='button' onClick={() => handleSort('valor')} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', fontWeight: 'inherit' }}>
                  Valor {sortConfig.key === 'valor' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </button>
              </th>
              <th>
                <button type='button' onClick={() => handleSort('vencimento')} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', fontWeight: 'inherit' }}>
                  Vencimento {sortConfig.key === 'vencimento' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </button>
              </th>
              <th>Contrato</th>
              <th>
                <button type='button' onClick={() => handleSort('status')} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', fontWeight: 'inherit' }}>
                  Status {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </button>
              </th>
              <th>Ações</th>
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
              sortedContratos.map((item) => (
                <tr key={item.id}>
                  <td>{item.sala?.identificacao || 'Sala não informada'}</td>
                  <td>{item.locatario?.nome || 'Locatário não informado'}</td>
                  <td>
                    {formatDate(item.dataInicio)} — {formatDate(item.dataTermino)}
                  </td>
                  <td>{formatCurrency(item.valorAluguel)}</td>
                  <td>
                    <div>Dia {item.diaVencimento}</div>
                    {item.diaVencimentoAgua != null && <div>Água: dia {item.diaVencimentoAgua}</div>}
                    {item.diaVencimentoLuz != null && <div>Luz: dia {item.diaVencimentoLuz}</div>}
                    {item.diaVencimentoIptu != null && <div>IPTU: dia {item.diaVencimentoIptu}</div>}
                    {item.valorOutrasDespesas != null && item.valorOutrasDespesas > 0 && (
                      <div>Outras: {formatCurrency(item.valorOutrasDespesas)}</div>
                    )}
                  </td>
                  <td>
                    {item.documentoUrl ? (
                      <a href={`/api/contratos/${item.id}/documento`} target='_blank' rel='noreferrer'>
                        Baixar
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <StatusBadge kind='contrato' status={item.status} />
                  </td>
                  <td className='table-actions'>
                    <button type='button' className='button button-outline' onClick={() => editarContrato(item)}>
                      Editar
                    </button>
                    <button type='button' className='button button-secondary' onClick={() => excluirContrato(item.id)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
