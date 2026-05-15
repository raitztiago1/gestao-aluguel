'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import AppHeader from '../components/AppHeader';
import ErrorAlert from '../components/ErrorAlert';
import MaskedInput from '../components/MaskedInput';
import StatusBadge from '../components/StatusBadge';
import { fetchJson, requestJson } from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import {
  formatCurrency,
  formatDate,
  formatLocatarioOption,
  formatSalaOption
} from '../lib/format';
import { dateBrToIso, isoToDateBr, maskCurrency, onlyDigits, parseCurrency } from '../lib/masks';
import { clearSession, isSessionValid, setupUnloadLogout } from '../lib/session';

type StatusContrato = 'ATIVO' | 'ENCERRADO' | 'RENOVACAO' | 'CANCELADO';

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
  status: 'ATIVO',
  observacoes: ''
};

export default function ContratosPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [locatarios, setLocatarios] = useState<Locatario[]>([]);
  const [formContrato, setFormContrato] = useState<ContratoForm>(defaultContratoForm);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    document.title = 'Gestão de Aluguel - Contratos';
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
        status: formContrato.status,
        observacoes: formContrato.observacoes.trim() || undefined
      };

      if (modoEdicao && formContrato.id) {
        await requestJson<Contrato>(`/api/contratos/${formContrato.id}`, 'PUT', payload);
      } else {
        await requestJson<Contrato>('/api/contratos', 'POST', payload);
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

  if (!isLoggedIn) {
    return <div className='alert-card'>Redirecionando para login...</div>;
  }

  return (
    <main className='container'>
      <AppHeader title='Contratos' subtitle='Associe salas e locatários, defina prazos e valores de aluguel.' />

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
              <th>Sala</th>
              <th>Locatário</th>
              <th>Período</th>
              <th>Valor</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th>Ações</th>
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
              contratos.map((item) => (
                <tr key={item.id}>
                  <td>{item.sala?.identificacao || 'Sala não informada'}</td>
                  <td>{item.locatario?.nome || 'Locatário não informado'}</td>
                  <td>
                    {formatDate(item.dataInicio)} — {formatDate(item.dataTermino)}
                  </td>
                  <td>{formatCurrency(item.valorAluguel)}</td>
                  <td>Dia {item.diaVencimento}</td>
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
