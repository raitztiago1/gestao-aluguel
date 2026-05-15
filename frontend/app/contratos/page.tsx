'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { fetchJson, requestJson } from '../lib/api';
import { clearSession, isSessionValid, setupUnloadLogout } from '../lib/session';

type StatusContrato = 'ATIVO' | 'ENCERRADO' | 'RENOVACAO' | 'CANCELADO';

type Sala = { id: number; identificacao?: string; }; 

type Locatario = { id: number; nome?: string; };

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
    const cleanup = setupUnloadLogout();
    return cleanup;
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
      setErro(err instanceof Error ? err.message : 'Erro ao carregar contratos');
    } finally {
      setCarregando(false);
    }
  };

  const salvarContrato = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const payload = {
        sala: { id: Number(formContrato.salaId) },
        locatario: { id: Number(formContrato.locatarioId) },
        dataInicio: formContrato.dataInicio,
        dataTermino: formContrato.dataTermino,
        valorAluguel: Number(formContrato.valorAluguel),
        diaVencimento: Number(formContrato.diaVencimento),
        status: formContrato.status,
        observacoes: formContrato.observacoes || undefined
      };

      if (modoEdicao && formContrato.id) {
        await requestJson<Contrato>(`/api/contratos/${formContrato.id}`, 'PUT', payload);
      } else {
        await requestJson<Contrato>('/api/contratos', 'POST', payload);
      }
      setFormContrato(defaultContratoForm);
      setModoEdicao(false);
      await carregarDados();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao salvar contrato');
    }
  };

  const editarContrato = (contrato: Contrato) => {
    setFormContrato({
      id: contrato.id,
      salaId: contrato.sala?.id.toString() ?? '',
      locatarioId: contrato.locatario?.id.toString() ?? '',
      dataInicio: contrato.dataInicio ?? '',
      dataTermino: contrato.dataTermino ?? '',
      valorAluguel: contrato.valorAluguel?.toString() ?? '',
      diaVencimento: contrato.diaVencimento?.toString() ?? '',
      status: contrato.status ?? 'ATIVO',
      observacoes: contrato.observacoes ?? ''
    });
    setModoEdicao(true);
    setErro(null);
  };

  const excluirContrato = async (id: number) => {
    try {
      await requestJson<void>(`/api/contratos/${id}`, 'DELETE');
      await carregarDados();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao excluir contrato');
    }
  };

  const resetForm = () => {
    setModoEdicao(false);
    setFormContrato(defaultContratoForm);
    setErro(null);
  };

  const voltarParaHome = () => {
    router.push('/home');
  };

  const irParaTerrenos = () => {
    router.push('/terrenos');
  };

  const irParaSalas = () => {
    router.push('/salas');
  };

  const irParaLocatarios = () => {
    router.push('/locatarios');
  };

  if (!isLoggedIn) {
    return <div>Redirecionando para login...</div>;
  }

  return (
    <main className='container'>
      <header className='page-header'>
        <div>
          <h1 className='page-title'>Gestão de Aluguel - Contratos</h1>
          <p className='page-subtitle'>Gerencie contratos, escolha sala, locatário e defina prazos e valores.</p>
        </div>
        <div className='button-group'>
          <button type='button' className='button button-secondary' onClick={voltarParaHome}>
            ← Voltar para Home
          </button>
          <button type='button' className='button button-outline' onClick={irParaTerrenos}>
            Ir para Terrenos
          </button>
          <button type='button' className='button button-outline' onClick={irParaSalas}>
            Ir para Salas
          </button>
          <button type='button' className='button button-outline' onClick={irParaLocatarios}>
            Ir para Locatários
          </button>
        </div>
      </header>

      {carregando && <div className='alert-card'>Carregando...</div>}
      {erro && <div className='alert-card alert-error'>{erro}</div>}

      <section className='card'>
        <div className='page-header'>
          <div>
            <h2>{modoEdicao ? 'Editar contrato' : 'Novo contrato'}</h2>
            <p className='page-subtitle'>Associe sala e locatário, defina datas e valores.</p>
          </div>
          <div className='button-group'>
            <button type='button' className='button button-outline' onClick={resetForm}>
              Limpar formulário
            </button>
          </div>
        </div>

        <form onSubmit={salvarContrato} className='form-grid'>
          <div className='form-group'>
            <label>Sala <span className='required-star'>*</span></label>
            <select
              className='select-field'
              required
              value={formContrato.salaId}
              onChange={(e) => setFormContrato((s) => ({ ...s, salaId: e.target.value }))}
            >
              <option value=''>Selecione uma sala</option>
              {salas.map((sala) => (
                <option key={sala.id} value={sala.id}>
                  {sala.identificacao ?? `Sala #${sala.id}`}
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
              <option value=''>Selecione um locatário</option>
              {locatarios.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.nome ?? `Locatário #${loc.id}`}
                </option>
              ))}
            </select>
          </div>
          <div className='form-group'>
            <label>Data início <span className='required-star'>*</span></label>
            <input
              className='input-field'
              type='date'
              required
              value={formContrato.dataInicio}
              onChange={(e) => setFormContrato((s) => ({ ...s, dataInicio: e.target.value }))}
            />
          </div>
          <div className='form-group'>
            <label>Data término <span className='required-star'>*</span></label>
            <input
              className='input-field'
              type='date'
              required
              value={formContrato.dataTermino}
              onChange={(e) => setFormContrato((s) => ({ ...s, dataTermino: e.target.value }))}
            />
          </div>
          <div className='form-group'>
            <label>Valor aluguel <span className='required-star'>*</span></label>
            <input
              className='input-field'
              type='number'
              min='0'
              step='0.01'
              required
              value={formContrato.valorAluguel}
              onChange={(e) => setFormContrato((s) => ({ ...s, valorAluguel: e.target.value }))}
            />
          </div>
          <div className='form-group'>
            <label>Dia vencimento <span className='required-star'>*</span></label>
            <input
              className='input-field'
              type='number'
              min='1'
              max='31'
              required
              value={formContrato.diaVencimento}
              onChange={(e) => setFormContrato((s) => ({ ...s, diaVencimento: e.target.value }))}
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
              <option value='RENOVACAO'>Renovação</option>
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
              {modoEdicao ? 'Atualizar contrato' : 'Criar contrato'}
            </button>
            {modoEdicao && (
              <button type='button' className='button button-secondary' onClick={resetForm}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      <section className='card'>
        <h2>Contratos ({contratos.length})</h2>
        <table className='table'>
          <thead>
            <tr>
              <th>ID</th>
              <th>Sala</th>
              <th>Locatário</th>
              <th>Início</th>
              <th>Fim</th>
              <th>Valor</th>
              <th>Dia Vencimento</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {contratos.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.sala?.identificacao || `#${item.sala?.id}`}</td>
                <td>{item.locatario?.nome || `#${item.locatario?.id}`}</td>
                <td>{item.dataInicio}</td>
                <td>{item.dataTermino}</td>
                <td>R$ {item.valorAluguel?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td>{item.diaVencimento}</td>
                <td>{item.status || '—'}</td>
                <td className='table-actions'>
                  <button type='button' className='button button-outline' onClick={() => editarContrato(item)}>
                    Editar
                  </button>
                  <button type='button' className='button button-secondary' onClick={() => excluirContrato(item.id)}>
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
