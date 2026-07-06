'use client';

import { FormEvent, useEffect, useState } from 'react';
import AppHeader from '../components/AppHeader';
import ErrorAlert from '../components/ErrorAlert';
import MaskedInput from '../components/MaskedInput';
import StatusBadge from '../components/StatusBadge';
import { useAuthGuard } from '../hooks/useAuth';
import { fetchJson, requestJson } from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import { formatAddressLine, formatArea, formatTerrenoOption } from '../lib/format';
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
      const payload = {
        identificacao: formSala.identificacao.trim(),
        metragem: parseArea(formSala.metragem),
        status: formSala.status,
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
      setErro(getErrorMessage(err, 'Falha ao salvar sala.'));
    }
  };

  const editarSala = (sala: Sala) => {
    setFormSala({
      id: sala.id,
      identificacao: sala.identificacao,
      metragem: String(sala.metragem).replace('.', ','),
      status: sala.status ?? 'DISPONIVEL',
      terrenoId: sala.terreno?.id?.toString() ?? '',
      observacoes: sala.observacoes ?? ''
    });
    setModoEdicao(true);
    setShowModal(true);
    setErro(null);
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
    setErro(null);
  };

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
                <p className='modal-description'>Informe identificação, metragem, status e terreno.</p>
              </div>
              <button className='modal-close' onClick={resetForm} aria-label='Fechar modal'>×</button>
            </div>

            <div className='modal-content'>
              <form onSubmit={salvarSala} className='form-grid'>
                <div className='form-group'>
                  <label>Terreno <span className='required-star'>*</span></label>
                  <select
                    className='select-field'
                    required
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
                </div>

                <div className='form-group'>
                  <label>Identificação <span className='required-star'>*</span></label>
                  <input
                    className='input-field'
                    type='text'
                    required
                    placeholder='Ex.: Sala 101, Bloco A'
                    value={formSala.identificacao}
                    onChange={(e) => setFormSala((s) => ({ ...s, identificacao: e.target.value }))}
                  />
                </div>

                <div className='form-group'>
                  <label>Metragem (m²) <span className='required-star'>*</span></label>
                  <MaskedInput
                    mask='area'
                    required
                    value={formSala.metragem}
                    onValueChange={(metragem) => setFormSala((s) => ({ ...s, metragem }))}
                    placeholder='Ex.: 45,00'
                    inputMode='decimal'
                  />
                </div>

                <div className='form-group'>
                  <label>Status</label>
                  <select
                    className='select-field'
                    value={formSala.status}
                    onChange={(e) => setFormSala((s) => ({ ...s, status: e.target.value as TipoSalaStatus }))}
                  >
                    <option value='DISPONIVEL'>Disponível</option>
                    <option value='LOCADA'>Locada</option>
                    <option value='MANUTENCAO'>Em manutenção</option>
                  </select>
                </div>

                <div className='form-group'>
                  <label>Observações</label>
                  <textarea
                    className='textarea-field'
                    rows={4}
                    value={formSala.observacoes}
                    onChange={(e) => setFormSala((s) => ({ ...s, observacoes: e.target.value }))}
                  />
                </div>

                <div className='form-actions'>
                  <button type='submit' className='button button-primary'>
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
        <table className='table'>
          <thead>
            <tr>
              <th>
                <button type='button' onClick={() => handleSort('identificacao')} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', fontWeight: 'inherit' }}>
                  Sala {sortConfig.key === 'identificacao' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </button>
              </th>
              <th>
                <button type='button' onClick={() => handleSort('terreno')} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', fontWeight: 'inherit' }}>
                  Terreno {sortConfig.key === 'terreno' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </button>
              </th>
              <th>
                <button type='button' onClick={() => handleSort('metragem')} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', fontWeight: 'inherit' }}>
                  Metragem {sortConfig.key === 'metragem' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </button>
              </th>
              <th>
                <button type='button' onClick={() => handleSort('status')} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', fontWeight: 'inherit' }}>
                  Status {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </button>
              </th>
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
      </section>
    </main>
  );
}
