'use client';

import { FormEvent, useEffect, useState } from 'react';
import AppHeader from '../components/AppHeader';
import ErrorAlert from '../components/ErrorAlert';
import MaskedInput from '../components/MaskedInput';
import SortableTh from '../components/SortableTh';
import StatusBadge from '../components/StatusBadge';
import { useAuthGuard } from '../hooks/useAuth';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { fetchJson, requestJson } from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import { formatAddressLine, formatArea, formatAreaInput, formatTerrenoOption } from '../lib/format';
import { parseArea } from '../lib/masks';

type TipoSalaStatus = 'DISPONIVEL' | 'LOCADA' | 'MANUTENCAO';
type SortDirection = 'asc' | 'desc';
type SalaSortKey = 'identificacao' | 'terreno' | 'metragem' | 'status';

type Terreno = {
  id: number;
  tipo?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  quantidadeSalas?: number;
};

type Sala = {
  id: number;
  identificacao: string;
  metragem: number;
  status?: TipoSalaStatus;
  observacoes?: string;
  terreno?: Terreno;
};

type SalaForm = {
  id?: number;
  identificacao: string;
  metragem: string;
  status: TipoSalaStatus;
  terrenoId: string;
  observacoes: string;
};

const defaultSalaForm: SalaForm = {
  identificacao: '',
  metragem: '',
  status: 'DISPONIVEL',
  terrenoId: '',
  observacoes: ''
};

export default function SalasPage() {
  const authStatus = useAuthGuard();
  const [salas, setSalas] = useState<Sala[]>([]);
  const [terrenos, setTerrenos] = useState<Terreno[]>([]);
  const [formSala, setFormSala] = useState<SalaForm>(defaultSalaForm);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [erroModal, setErroModal] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: SalaSortKey; direction: SortDirection }>({
    key: 'identificacao',
    direction: 'asc'
  });

  const terrenosDisponiveisParaSala = terrenos.filter((terreno) => {
    const isCurrentSelection = formSala.terrenoId === String(terreno.id);
    const salasDoTerreno = salas.filter((sala) => sala.terreno?.id === terreno.id);
    const alreadyHasSala = salasDoTerreno.length > 0;
    const reachedCommercialLimit = terreno.tipo === 'COMERCIAL'
      && terreno.quantidadeSalas != null
      && salasDoTerreno.length >= terreno.quantidadeSalas;

    if (isCurrentSelection) return true;
    if (terreno.tipo === 'COMERCIAL') return !reachedCommercialLimit;
    return !alreadyHasSala;
  });

  useEffect(() => {
    document.title = 'Gestão de Aluguel - Salas';
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
      const [loadedSalas, loadedTerrenos] = await Promise.all([
        fetchJson<Sala>('/api/salas'),
        fetchJson<Terreno>('/api/terrenos')
      ]);
      setSalas(loadedSalas);
      setTerrenos(loadedTerrenos);
      setErro(null);
    } catch (err) {
      setErro(getErrorMessage(err, 'Erro ao carregar dados.'));
    } finally {
      setCarregando(false);
    }
  };

  const salvarSala = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const status = modoEdicao
        ? formSala.status
        : 'DISPONIVEL';

      const payload = {
        identificacao: formSala.identificacao.trim(),
        metragem: parseArea(formSala.metragem),
        status,
        observacoes: formSala.observacoes.trim() || undefined,
        terreno: { id: Number(formSala.terrenoId) }
      };

      if (modoEdicao && formSala.id) {
        await requestJson<Sala>(`/api/salas/${formSala.id}`, 'PUT', payload);
      } else {
        await requestJson<Sala>('/api/salas', 'POST', payload);
      }

      resetForm();
      await carregarDados();
    } catch (err) {
      setErroModal(getErrorMessage(err, 'Falha ao salvar sala.'));
    }
  };

  const editarSala = (sala: Sala) => {
    setFormSala({
      id: sala.id,
      identificacao: sala.identificacao,
      metragem: formatAreaInput(sala.metragem),
      status: sala.status ?? 'DISPONIVEL',
      terrenoId: sala.terreno?.id?.toString() ?? '',
      observacoes: sala.observacoes ?? ''
    });
    setModoEdicao(true);
    setShowModal(true);
    setErroModal(null);
  };

  const excluirSala = async (id: number) => {
    if (!window.confirm('Deseja realmente excluir esta sala?')) return;
    try {
      await requestJson<void>(`/api/salas/${id}`, 'DELETE');
      await carregarDados();
    } catch (err) {
      setErro(getErrorMessage(err, 'Falha ao excluir sala.'));
    }
  };

  const resetForm = () => {
    setModoEdicao(false);
    setFormSala(defaultSalaForm);
    setShowModal(false);
    setErroModal(null);
  };

  useEscapeKey(resetForm, showModal);

  const handleSort = (key: SalaSortKey) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedSalas = [...salas].sort((a, b) => {
    const direction = sortConfig.direction === 'asc' ? 1 : -1;
    const valueA = (() => {
      switch (sortConfig.key) {
        case 'identificacao':
          return a.identificacao.toLowerCase();
        case 'terreno':
          return (a.terreno ? formatAddressLine(a.terreno) : '—').toLowerCase();
        case 'metragem':
          return a.metragem;
        case 'status':
          return a.status ?? 'DISPONIVEL';
        default:
          return '';
      }
    })();
    const valueB = (() => {
      switch (sortConfig.key) {
        case 'identificacao':
          return b.identificacao.toLowerCase();
        case 'terreno':
          return (b.terreno ? formatAddressLine(b.terreno) : '—').toLowerCase();
        case 'metragem':
          return b.metragem;
        case 'status':
          return b.status ?? 'DISPONIVEL';
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

      <div className='page-toolbar'>
        <h2>Salas cadastradas ({salas.length})</h2>
        <button
          type='button'
          className='button button-primary'
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          + Nova sala
        </button>
      </div>

      {carregando && <div className='alert-card'>Carregando...</div>}
      {erro && <ErrorAlert message={erro} onDismiss={() => setErro(null)} />}

      {showModal && (
        <div className='modal-backdrop' onClick={resetForm}>
          <div className='modal' onClick={(event) => event.stopPropagation()}>
            <div className='modal-header'>
              <div>
                <h2>{modoEdicao ? 'Editar sala' : 'Nova sala'}</h2>
                <p className='modal-description'>
                  {modoEdicao
                    ? 'Atualize os dados da sala ou altere o status de manutenção.'
                    : 'Selecione o terreno e informe a identificação e metragem da sala.'}
                </p>
              </div>
              <button className='modal-close' onClick={resetForm} aria-label='Fechar modal'>×</button>
            </div>

            <div className='modal-content'>
              {erroModal && <ErrorAlert message={erroModal} onDismiss={() => setErroModal(null)} />}
              <form onSubmit={salvarSala} className='form-grid'>
                <section className='form-section' aria-labelledby='sala-dados-heading'>
                  <h3 id='sala-dados-heading'>Dados da sala</h3>
                  <div className='form-grid'>
                    <div className='form-group'>
                      <label htmlFor='sala-terreno'>Terreno <span className='required-star' aria-hidden='true'>*</span></label>
                      <select
                        id='sala-terreno'
                        className='select-field'
                        required
                        aria-required='true'
                        value={formSala.terrenoId}
                        onChange={(e) => setFormSala((s) => ({ ...s, terrenoId: e.target.value }))}
                      >
                        <option value=''>Selecione o terreno</option>
                        {terrenosDisponiveisParaSala.map((terreno) => (
                          <option key={terreno.id} value={terreno.id}>
                            {formatTerrenoOption(terreno)}
                          </option>
                        ))}
                      </select>
                      {!modoEdicao && terrenosDisponiveisParaSala.length === 0 && (
                        <span className='field-hint'>
                          Nenhum terreno disponível. Cadastre um terreno comercial ou residencial sem sala vinculada.
                        </span>
                      )}
                    </div>

                    <div className='form-grid-two'>
                      <div className='form-group'>
                        <label htmlFor='sala-identificacao'>
                          Identificação <span className='required-star' aria-hidden='true'>*</span>
                        </label>
                        <input
                          id='sala-identificacao'
                          className='input-field'
                          type='text'
                          required
                          aria-required='true'
                          placeholder='Ex.: Sala 101, Bloco A'
                          value={formSala.identificacao}
                          onChange={(e) => setFormSala((s) => ({ ...s, identificacao: e.target.value }))}
                        />
                        <span className='field-hint'>Nome ou código para localizar a sala no terreno.</span>
                      </div>

                      <div className='form-group'>
                        <label htmlFor='sala-metragem'>
                          Metragem (m²) <span className='required-star' aria-hidden='true'>*</span>
                        </label>
                        <MaskedInput
                          id='sala-metragem'
                          mask='area'
                          required
                          aria-required='true'
                          value={formSala.metragem}
                          onValueChange={(metragem) => setFormSala((s) => ({ ...s, metragem }))}
                          placeholder='Ex.: 45,00'
                          inputMode='decimal'
                        />
                        <span className='field-hint'>Área útil da sala em metros quadrados.</span>
                      </div>
                    </div>
                  </div>
                </section>

                {modoEdicao && (
                  <section className='form-section' aria-labelledby='sala-status-heading'>
                    <div className='form-status-header'>
                      <h3 id='sala-status-heading'>Status da sala</h3>
                      <StatusBadge kind='sala' status={formSala.status} />
                    </div>

                    {formSala.status === 'LOCADA' ? (
                      <p className='form-info-box'>
                        Esta sala está vinculada a um contrato ativo. O status é atualizado automaticamente pelo sistema.
                      </p>
                    ) : (
                      <label
                        className={`form-toggle-card${formSala.status === 'MANUTENCAO' ? ' form-toggle-card-active' : ''}`}
                        htmlFor='sala-em-manutencao'
                      >
                        <input
                          id='sala-em-manutencao'
                          type='checkbox'
                          checked={formSala.status === 'MANUTENCAO'}
                          onChange={(e) =>
                            setFormSala((s) => ({
                              ...s,
                              status: e.target.checked ? 'MANUTENCAO' : 'DISPONIVEL'
                            }))
                          }
                        />
                        <span className='form-toggle-card-content'>
                          <span className='form-toggle-card-title'>Em manutenção</span>
                          <span className='form-toggle-card-description'>
                            Salas em manutenção não aparecem na seleção de novos contratos e são exibidas no painel inicial.
                          </span>
                        </span>
                      </label>
                    )}
                  </section>
                )}

                <section className='form-section' aria-labelledby='sala-observacoes-heading'>
                  <h3 id='sala-observacoes-heading'>Observações</h3>
                  <div className='form-group'>
                    <textarea
                      id='sala-observacoes'
                      className='textarea-field'
                      rows={4}
                      aria-labelledby='sala-observacoes-heading'
                      placeholder='Informações adicionais sobre a sala (opcional)'
                      value={formSala.observacoes}
                      onChange={(e) => setFormSala((s) => ({ ...s, observacoes: e.target.value }))}
                    />
                  </div>
                </section>

                <div className='form-actions'>
                  <button
                    type='submit'
                    className='button button-primary'
                    disabled={!modoEdicao && terrenosDisponiveisParaSala.length === 0}
                  >
                    {modoEdicao ? 'Salvar alterações' : 'Cadastrar sala'}
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
        <div className='table-scroll'>
        <table className='table'>
          <thead>
            <tr>
              <SortableTh label='Sala' sortKey='identificacao' activeKey={sortConfig.key} direction={sortConfig.direction} onSort={(key) => handleSort(key as SalaSortKey)} />
              <SortableTh label='Terreno' sortKey='terreno' activeKey={sortConfig.key} direction={sortConfig.direction} onSort={(key) => handleSort(key as SalaSortKey)} />
              <SortableTh label='Metragem' sortKey='metragem' activeKey={sortConfig.key} direction={sortConfig.direction} onSort={(key) => handleSort(key as SalaSortKey)} />
              <SortableTh label='Status' sortKey='status' activeKey={sortConfig.key} direction={sortConfig.direction} onSort={(key) => handleSort(key as SalaSortKey)} />
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {salas.length === 0 ? (
              <tr>
                <td colSpan={5} className='table-empty'>
                  Nenhuma sala cadastrada.
                </td>
              </tr>
            ) : (
              sortedSalas.map((sala) => (
                <tr key={sala.id}>
                  <td>{sala.identificacao}</td>
                  <td>{sala.terreno ? formatAddressLine(sala.terreno) : '—'}</td>
                  <td>{formatArea(sala.metragem)}</td>
                  <td>
                    <StatusBadge kind='sala' status={sala.status} />
                  </td>
                  <td className='table-actions'>
                    <button type='button' className='button button-outline' onClick={() => editarSala(sala)}>
                      Editar
                    </button>
                    <button type='button' className='button button-secondary' onClick={() => excluirSala(sala.id)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </section>
    </main>
  );
}
