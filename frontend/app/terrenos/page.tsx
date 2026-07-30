'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import AddressFields from '../components/AddressFields';
import AppHeader from '../components/AppHeader';
import ErrorAlert from '../components/ErrorAlert';
import MaskedInput from '../components/MaskedInput';
import SortableTh from '../components/SortableTh';
import { useCepLookup } from '../hooks/useCepLookup';
import { useAuthGuard } from '../hooks/useAuth';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { fetchJson, requestJson } from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import { formatAddressLine, formatArea, formatAreaInput, labelTipoTerreno } from '../lib/format';
import { maskCep, onlyDigits, parseArea } from '../lib/masks';

type TipoTerreno = 'COMERCIAL' | 'RESIDENCIAL';
type SortDirection = 'asc' | 'desc';
type TerrenoSortKey = 'tipo' | 'endereco' | 'metragemTotal' | 'detalhes';

type Terreno = {
  id: number;
  tipo: TipoTerreno;
  endereco: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade: string;
  estado: string;
  cep?: string;
  metragemTotal: number;
  vagasGaragem?: number;
  quantidadeSalas?: number;
  metragemSalas?: number;
  metragemCasa?: number;
  observacoes?: string;
};

type TerrenoForm = {
  id?: number;
  tipo: TipoTerreno;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  metragemTotal: string;
  vagasGaragem: string;
  quantidadeSalas: string;
  metragemSalas: string;
  metragemCasa: string;
  observacoes: string;
};

const defaultTerrenoForm: TerrenoForm = {
  tipo: 'RESIDENCIAL',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
  metragemTotal: '',
  vagasGaragem: '',
  quantidadeSalas: '',
  metragemSalas: '',
  metragemCasa: '',
  observacoes: ''
};

function terrenoToForm(terreno: Terreno): TerrenoForm {
  return {
    id: terreno.id,
    tipo: terreno.tipo,
    endereco: terreno.endereco,
    numero: terreno.numero ?? '',
    complemento: terreno.complemento ?? '',
    bairro: terreno.bairro ?? '',
    cidade: terreno.cidade,
    estado: terreno.estado,
    cep: terreno.cep ? maskCep(terreno.cep) : '',
    metragemTotal: formatAreaInput(terreno.metragemTotal),
    vagasGaragem: terreno.vagasGaragem?.toString() ?? '',
    quantidadeSalas: terreno.quantidadeSalas?.toString() ?? '',
    metragemSalas: formatAreaInput(terreno.metragemSalas),
    metragemCasa: formatAreaInput(terreno.metragemCasa),
    observacoes: terreno.observacoes ?? ''
  };
}

function formatTerrenoPayload(form: TerrenoForm) {
  const payload: Record<string, unknown> = {
    tipo: form.tipo,
    endereco: form.endereco.trim(),
    numero: form.numero.trim() || undefined,
    complemento: form.complemento.trim() || undefined,
    bairro: form.bairro.trim() || undefined,
    cidade: form.cidade.trim(),
    estado: form.estado,
    cep: form.cep ? onlyDigits(form.cep) : undefined,
    metragemTotal: parseArea(form.metragemTotal),
    vagasGaragem: form.vagasGaragem ? Number(form.vagasGaragem) : undefined,
    quantidadeSalas: form.quantidadeSalas ? Number(form.quantidadeSalas) : undefined,
    metragemCasa: form.metragemCasa ? parseArea(form.metragemCasa) : undefined,
    observacoes: form.observacoes.trim() || undefined
  };
  return Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined && v !== ''));
}

export default function TerrenosPage() {
  const authStatus = useAuthGuard();
  const [terrenos, setTerrenos] = useState<Terreno[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [erroModal, setErroModal] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [formTerreno, setFormTerreno] = useState<TerrenoForm>(defaultTerrenoForm);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: TerrenoSortKey; direction: SortDirection }>({
    key: 'endereco',
    direction: 'asc'
  });

  const updateAddress = useCallback((patch: Partial<TerrenoForm>) => {
    setFormTerreno((s) => ({ ...s, ...patch }));
  }, []);

  const { handleCepChange, resetCepRef } = useCepLookup({
    onAddressUpdate: updateAddress,
    onError: (msg) => setErro(msg)
  });

  useEffect(() => {
    document.title = 'Gestão de Aluguel - Terrenos';
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
      setTerrenos(await fetchJson<Terreno>('/api/terrenos'));
      setErro(null);
    } catch (err) {
      setErro(getErrorMessage(err, 'Erro ao carregar terrenos.'));
    } finally {
      setCarregando(false);
    }
  };

  const salvarTerreno = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const payload = formatTerrenoPayload(formTerreno);
      if (modoEdicao && formTerreno.id) {
        await requestJson<Terreno>(`/api/terrenos/${formTerreno.id}`, 'PUT', payload);
      } else {
        await requestJson<Terreno>('/api/terrenos', 'POST', payload);
      }
      resetForm();
      await carregarDados();
    } catch (err) {
      setErroModal(getErrorMessage(err, 'Falha ao salvar terreno.'));
    }
  };

  const editarTerreno = (terreno: Terreno) => {
    setFormTerreno(terrenoToForm(terreno));
    setModoEdicao(true);
    setShowModal(true);
    setErroModal(null);
    resetCepRef();
  };

  const excluirTerreno = async (id: number) => {
    if (!window.confirm('Deseja realmente excluir este terreno?')) return;
    try {
      await requestJson<void>(`/api/terrenos/${id}`, 'DELETE');
      await carregarDados();
    } catch (err) {
      setErro(getErrorMessage(err, 'Falha ao excluir terreno.'));
    }
  };

  const resetForm = () => {
    setModoEdicao(false);
    setFormTerreno(defaultTerrenoForm);
    setShowModal(false);
    setErroModal(null);
    resetCepRef();
  };

  useEscapeKey(resetForm, showModal);

  const handleTipoChange = (novoTipo: TipoTerreno) => {
    setFormTerreno((s) => {
      const patch: Partial<TerrenoForm> = { tipo: novoTipo };
      if (s.tipo === 'COMERCIAL') {
        patch.vagasGaragem = '';
        patch.quantidadeSalas = '';
      } else if (s.tipo === 'RESIDENCIAL') {
        patch.metragemCasa = '';
      }
      return { ...s, ...patch };
    });
  };

  const handleSort = (key: TerrenoSortKey) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedTerrenos = [...terrenos].sort((a, b) => {
    const direction = sortConfig.direction === 'asc' ? 1 : -1;
    const valueA = (() => {
      switch (sortConfig.key) {
        case 'tipo':
          return labelTipoTerreno(a.tipo);
        case 'endereco':
          return formatAddressLine(a).toLowerCase();
        case 'metragemTotal':
          return a.metragemTotal;
        case 'detalhes':
          return a.tipo === 'COMERCIAL'
            ? `${a.vagasGaragem ?? 0} ${a.quantidadeSalas ?? 0}`
            : `${a.metragemCasa ?? 0}`;
        default:
          return '';
      }
    })();
    const valueB = (() => {
      switch (sortConfig.key) {
        case 'tipo':
          return labelTipoTerreno(b.tipo);
        case 'endereco':
          return formatAddressLine(b).toLowerCase();
        case 'metragemTotal':
          return b.metragemTotal;
        case 'detalhes':
          return b.tipo === 'COMERCIAL'
            ? `${b.vagasGaragem ?? 0} ${b.quantidadeSalas ?? 0}`
            : `${b.metragemCasa ?? 0}`;
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
        <h2>Terrenos cadastrados ({terrenos.length})</h2>
        <button
          type='button'
          className='button button-primary'
          onClick={() => {
            setModoEdicao(false);
            setFormTerreno(defaultTerrenoForm);
            setShowModal(true);
            setErroModal(null);
            resetCepRef();
          }}
        >
          + Novo terreno
        </button>
      </div>

      {showModal && (
        <div className='modal-backdrop' onClick={resetForm}>
          <div className='modal' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <div>
                <h2>{modoEdicao ? 'Editar terreno' : 'Novo terreno'}</h2>
                <p className='modal-description'>Informe tipo, endereço e metragem do imóvel.</p>
              </div>
              <button className='modal-close' onClick={resetForm} aria-label='Fechar modal'>×</button>
            </div>

            <div className='modal-content'>
              {erroModal && <ErrorAlert message={erroModal} onDismiss={() => setErroModal(null)} />}
              <form onSubmit={salvarTerreno} className='form-grid'>
                <div className='form-group'>
                  <label htmlFor='terreno-tipo'>Tipo <span className='required-star' aria-hidden='true'>*</span></label>
                  <select
                    id='terreno-tipo'
                    className='select-field'
                    value={formTerreno.tipo}
                    onChange={(e) => handleTipoChange(e.target.value as TipoTerreno)}
                    required
                    aria-required='true'
                  >
                    <option value='COMERCIAL'>Comercial</option>
                    <option value='RESIDENCIAL'>Residencial</option>
                  </select>
                </div>

                <AddressFields
                  required
                  value={formTerreno}
                  onChange={(patch) => setFormTerreno((s) => ({ ...s, ...patch }))}
                  onCepChange={(v) => handleCepChange(v, (cep) => setFormTerreno((s) => ({ ...s, cep })))}
                />

                <div className='form-group'>
                  <label htmlFor='terreno-metragem-total'>Metragem total <span className='required-star' aria-hidden='true'>*</span></label>
                  <MaskedInput
                    id='terreno-metragem-total'
                    mask='area'
                    required
                    aria-required='true'
                    value={formTerreno.metragemTotal}
                    onValueChange={(metragemTotal) => setFormTerreno((s) => ({ ...s, metragemTotal }))}
                    placeholder='Ex.: 500,00'
                    inputMode='decimal'
                  />
                  <span className='field-hint'>Área total do terreno em m²</span>
                </div>

                {formTerreno.tipo === 'COMERCIAL' && (
                  <div className='form-grid-three'>
                    <div className='form-group'>
                      <label htmlFor='terreno-vagas'>Vagas de garagem <span className='required-star' aria-hidden='true'>*</span></label>
                      <input
                        id='terreno-vagas'
                        className='input-field'
                        type='number'
                        min='0'
                        required
                        aria-required='true'
                        value={formTerreno.vagasGaragem}
                        onChange={(e) => setFormTerreno((s) => ({ ...s, vagasGaragem: e.target.value }))}
                      />
                    </div>
                    <div className='form-group'>
                      <label htmlFor='terreno-qtd-salas'>Quantidade de salas <span className='required-star' aria-hidden='true'>*</span></label>
                      <input
                        id='terreno-qtd-salas'
                        className='input-field'
                        type='number'
                        min='0'
                        required
                        aria-required='true'
                        value={formTerreno.quantidadeSalas}
                        onChange={(e) => setFormTerreno((s) => ({ ...s, quantidadeSalas: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {formTerreno.tipo === 'RESIDENCIAL' && (
                  <div className='form-group'>
                    <label htmlFor='terreno-metragem-casa'>Metragem da casa <span className='required-star' aria-hidden='true'>*</span></label>
                    <MaskedInput
                      id='terreno-metragem-casa'
                      mask='area'
                      required
                      aria-required='true'
                      value={formTerreno.metragemCasa}
                      onValueChange={(metragemCasa) => setFormTerreno((s) => ({ ...s, metragemCasa }))}
                      inputMode='decimal'
                    />
                  </div>
                )}

                <div className='form-group'>
                  <label htmlFor='terreno-observacoes'>Observações</label>
                  <textarea
                    id='terreno-observacoes'
                    className='textarea-field'
                    rows={4}
                    value={formTerreno.observacoes}
                    onChange={(e) => setFormTerreno((s) => ({ ...s, observacoes: e.target.value }))}
                  />
                </div>

                <div className='form-actions'>
                  <button type='submit' className='button button-primary'>
                    {modoEdicao ? 'Salvar alterações' : 'Cadastrar terreno'}
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
              <SortableTh label='Tipo' sortKey='tipo' activeKey={sortConfig.key} direction={sortConfig.direction} onSort={(key) => handleSort(key as TerrenoSortKey)} />
              <SortableTh label='Endereço' sortKey='endereco' activeKey={sortConfig.key} direction={sortConfig.direction} onSort={(key) => handleSort(key as TerrenoSortKey)} />
              <SortableTh label='Metragem' sortKey='metragemTotal' activeKey={sortConfig.key} direction={sortConfig.direction} onSort={(key) => handleSort(key as TerrenoSortKey)} />
              <SortableTh label='Detalhes' sortKey='detalhes' activeKey={sortConfig.key} direction={sortConfig.direction} onSort={(key) => handleSort(key as TerrenoSortKey)} />
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {terrenos.length === 0 ? (
              <tr>
                <td colSpan={5} className='table-empty'>
                  Nenhum terreno cadastrado.
                </td>
              </tr>
            ) : (
              sortedTerrenos.map((terreno) => (
                <tr key={terreno.id}>
                  <td>{labelTipoTerreno(terreno.tipo)}</td>
                  <td>{formatAddressLine(terreno)}</td>
                  <td>{formatArea(terreno.metragemTotal)}</td>
                  <td>
                    {terreno.tipo === 'COMERCIAL'
                      ? `${terreno.vagasGaragem ?? 0} vagas · ${terreno.quantidadeSalas ?? 0} salas`
                      : `Casa: ${formatArea(terreno.metragemCasa)}`}
                  </td>
                  <td className='table-actions'>
                    <button type='button' className='button button-outline' onClick={() => editarTerreno(terreno)}>
                      Editar
                    </button>
                    <button type='button' className='button button-secondary' onClick={() => excluirTerreno(terreno.id)}>
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
