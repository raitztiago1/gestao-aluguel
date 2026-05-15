'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { fetchJson, requestJson } from '../lib/api';
import { clearSession, isSessionValid, setupUnloadLogout } from '../lib/session';

type TipoSalaStatus = 'DISPONIVEL' | 'LOCADA' | 'MANUTENCAO';

type Terreno = {
  id: number;
  endereco?: string;
  numero?: string;
  cidade?: string;
  estado?: string;
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
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [terrenos, setTerrenos] = useState<Terreno[]>([]);
  const [formSala, setFormSala] = useState<SalaForm>(defaultSalaForm);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    document.title = 'Gestão de Aluguel - Salas';
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
      const [loadedSalas, loadedTerrenos] = await Promise.all([
        fetchJson<Sala>('/api/salas'),
        fetchJson<Terreno>('/api/terrenos')
      ]);
      setSalas(loadedSalas);
      setTerrenos(loadedTerrenos);
      setErro(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setCarregando(false);
    }
  };

  const salvarSala = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const payload = {
        identificacao: formSala.identificacao,
        metragem: Number(formSala.metragem),
        status: formSala.status,
        observacoes: formSala.observacoes || undefined,
        terreno: { id: Number(formSala.terrenoId) }
      };

      if (modoEdicao && formSala.id) {
        await requestJson<Sala>(`/api/salas/${formSala.id}`, 'PUT', payload);
      } else {
        await requestJson<Sala>('/api/salas', 'POST', payload);
      }

      setFormSala(defaultSalaForm);
      setModoEdicao(false);
      setShowModal(false);
      await carregarDados();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao salvar sala');
    }
  };

  const editarSala = (sala: Sala) => {
    setFormSala({
      id: sala.id,
      identificacao: sala.identificacao,
      metragem: sala.metragem?.toString() ?? '',
      status: (sala.status ?? 'DISPONIVEL') as TipoSalaStatus,
      terrenoId: sala.terreno?.id?.toString() ?? '',
      observacoes: sala.observacoes ?? ''
    });
    setModoEdicao(true);
    setShowModal(true);
    setErro(null);
  };

  const excluirSala = async (id: number) => {
    try {
      await requestJson<void>(`/api/salas/${id}`, 'DELETE');
      await carregarDados();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao excluir sala');
    }
  };

  const resetForm = () => {
    setModoEdicao(false);
    setFormSala(defaultSalaForm);
    setShowModal(false);
    setErro(null);
  };

  const abrirNovaFormulario = () => {
    setModoEdicao(false);
    setFormSala(defaultSalaForm);
    setShowModal(true);
    setErro(null);
  };

  const voltarParaHome = () => {
    router.push('/home');
  };

  const irParaTerrenos = () => {
    router.push('/terrenos');
  };

  const irParaLocatarios = () => {
    router.push('/locatarios');
  };

  const irParaContratos = () => {
    router.push('/contratos');
  };

  if (!isLoggedIn) {
    return <div>Redirecionando para login...</div>;
  }

  return (
    <main className='container'>
      <header className='page-header'>
        <div>
          <h1 className='page-title'>Gestão de Aluguel - Salas</h1>
          <p className='page-subtitle'>Gerencie salas, vincule-as a terrenos, edite informações e exclua registros.</p>
        </div>
        <div className='button-group'>
          <button type='button' className='button button-secondary' onClick={voltarParaHome}>
            ← Voltar para Home
          </button>
          <button type='button' className='button button-outline' onClick={irParaTerrenos}>
            Ir para Terrenos
          </button>
          <button type='button' className='button button-outline' onClick={irParaLocatarios}>
            Ir para Locatários
          </button>
          <button type='button' className='button button-outline' onClick={irParaContratos}>
            Ir para Contratos
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Salas cadastradas ({salas.length})</h2>
        <button type='button' className='button button-primary' onClick={abrirNovaFormulario}>
          + Nova Sala
        </button>
      </div>

      {carregando && <div className='alert-card'>Carregando...</div>}
      {erro && <div className='alert-card alert-error'>{erro}</div>}

      {showModal && (
        <div className='modal-backdrop' onClick={resetForm}>
          <div className='modal' onClick={(event) => event.stopPropagation()}>
            <div className='modal-header'>
              <div>
                <h2>{modoEdicao ? 'Editar Sala' : 'Nova Sala'}</h2>
                <p className='modal-description'>Informe a identificação, metragem, status e o terreno vinculado.</p>
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
                    <option value=''>Selecione um terreno</option>
                    {terrenos.map((terreno) => (
                      <option key={terreno.id} value={terreno.id}>
                        {terreno.endereco ? `${terreno.endereco}${terreno.numero ? `, ${terreno.numero}` : ''} — ${terreno.cidade ?? ''}/${terreno.estado ?? ''}` : `Terreno #${terreno.id}`}
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
                    value={formSala.identificacao}
                    onChange={(e) => setFormSala((s) => ({ ...s, identificacao: e.target.value }))}
                  />
                </div>

                <div className='form-group'>
                  <label>Metragem (m²) <span className='required-star'>*</span></label>
                  <input
                    className='input-field'
                    type='number'
                    min='0'
                    step='0.01'
                    required
                    value={formSala.metragem}
                    onChange={(e) => setFormSala((s) => ({ ...s, metragem: e.target.value }))}
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
                    {modoEdicao ? 'Atualizar sala' : 'Criar sala'}
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
              <th>Identificação</th>
              <th>Terreno</th>
              <th>Metragem</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {salas.map((sala) => (
              <tr key={sala.id}>
                <td>{sala.identificacao}</td>
                <td>{sala.terreno ? (sala.terreno.endereco ? `${sala.terreno.endereco}${sala.terreno.numero ? `, ${sala.terreno.numero}` : ''}` : `#${sala.terreno.id}`) : '—'}</td>
                <td>{sala.metragem} m²</td>
                <td>{sala.status ?? '—'}</td>
                <td className='table-actions'>
                  <button type='button' className='button button-outline' onClick={() => editarSala(sala)}>
                    Editar
                  </button>
                  <button type='button' className='button button-secondary' onClick={() => excluirSala(sala.id)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
