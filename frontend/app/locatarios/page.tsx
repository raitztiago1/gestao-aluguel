'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { fetchJson, requestJson } from '../lib/api';
import { clearSession, isSessionValid, setupUnloadLogout } from '../lib/session';

type TipoPessoa = 'FISICA' | 'JURIDICA';

type Locatario = {
  id: number;
  tipoPessoa: TipoPessoa;
  nome: string;
  cpfCnpj: string;
  email: string;
  telefone: string;
  celular?: string;
  endereco: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade: string;
  estado: string;
  cep?: string;
  observacoes?: string;
};

type LocatarioForm = {
  id?: number;
  tipoPessoa: TipoPessoa;
  nome: string;
  cpfCnpj: string;
  email: string;
  telefone: string;
  celular: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  observacoes: string;
};

const defaultLocatarioForm: LocatarioForm = {
  tipoPessoa: 'FISICA',
  nome: '',
  cpfCnpj: '',
  email: '',
  telefone: '',
  celular: '',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
  observacoes: ''
};

export default function LocatariosPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [locatarios, setLocatarios] = useState<Locatario[]>([]);
  const [formLocatario, setFormLocatario] = useState<LocatarioForm>(defaultLocatarioForm);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    document.title = 'Gestão de Aluguel - Locatários';
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
      const loaded = await fetchJson<Locatario>('/api/locatarios');
      setLocatarios(loaded);
      setErro(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar locatários');
    } finally {
      setCarregando(false);
    }
  };

  const salvarLocatario = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const payload = {
        tipoPessoa: formLocatario.tipoPessoa,
        nome: formLocatario.nome,
        cpfCnpj: formLocatario.cpfCnpj,
        email: formLocatario.email,
        telefone: formLocatario.telefone,
        celular: formLocatario.celular || undefined,
        endereco: formLocatario.endereco,
        numero: formLocatario.numero || undefined,
        complemento: formLocatario.complemento || undefined,
        bairro: formLocatario.bairro || undefined,
        cidade: formLocatario.cidade,
        estado: formLocatario.estado,
        cep: formLocatario.cep || undefined,
        observacoes: formLocatario.observacoes || undefined
      };

      if (modoEdicao && formLocatario.id) {
        await requestJson<Locatario>(`/api/locatarios/${formLocatario.id}`, 'PUT', payload);
      } else {
        await requestJson<Locatario>('/api/locatarios', 'POST', payload);
      }
      setFormLocatario(defaultLocatarioForm);
      setModoEdicao(false);
      await carregarDados();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao salvar locatário');
    }
  };

  const editarLocatario = (locatario: Locatario) => {
    setFormLocatario({
      id: locatario.id,
      tipoPessoa: locatario.tipoPessoa,
      nome: locatario.nome,
      cpfCnpj: locatario.cpfCnpj,
      email: locatario.email,
      telefone: locatario.telefone,
      celular: locatario.celular ?? '',
      endereco: locatario.endereco,
      numero: locatario.numero ?? '',
      complemento: locatario.complemento ?? '',
      bairro: locatario.bairro ?? '',
      cidade: locatario.cidade,
      estado: locatario.estado,
      cep: locatario.cep ?? '',
      observacoes: locatario.observacoes ?? ''
    });
    setModoEdicao(true);
    setErro(null);
  };

  const excluirLocatario = async (id: number) => {
    try {
      await requestJson<void>(`/api/locatarios/${id}`, 'DELETE');
      await carregarDados();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao excluir locatário');
    }
  };

  const resetForm = () => {
    setModoEdicao(false);
    setFormLocatario(defaultLocatarioForm);
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
          <h1 className='page-title'>Gestão de Aluguel - Locatários</h1>
          <p className='page-subtitle'>Gerencie locatários com dados completos e navegação clara.</p>
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
          <button type='button' className='button button-outline' onClick={irParaContratos}>
            Ir para Contratos
          </button>
        </div>
      </header>

      {carregando && <div className='alert-card'>Carregando...</div>}
      {erro && <div className='alert-card alert-error'>{erro}</div>}

      <section className='card'>
        <div className='page-header'>
          <div>
            <h2>{modoEdicao ? 'Editar locatário' : 'Novo locatário'}</h2>
            <p className='page-subtitle'>Preencha os dados básicos para cadastrar ou atualizar o locatário.</p>
          </div>
          <div className='button-group'>
            <button type='button' className='button button-outline' onClick={resetForm}>
              Limpar formulário
            </button>
          </div>
        </div>

        <form onSubmit={salvarLocatario} className='form-grid'>
          <div className='form-group'>
            <label>Tipo de pessoa</label>
            <select
              className='select-field'
              value={formLocatario.tipoPessoa}
              onChange={(e) => setFormLocatario((s) => ({ ...s, tipoPessoa: e.target.value as TipoPessoa }))}
              required
            >
              <option value='FISICA'>Física</option>
              <option value='JURIDICA'>Jurídica</option>
            </select>
          </div>
          <div className='form-group'>
            <label>Nome <span className='required-star'>*</span></label>
            <input
              className='input-field'
              type='text'
              required
              value={formLocatario.nome}
              onChange={(e) => setFormLocatario((s) => ({ ...s, nome: e.target.value }))}
            />
          </div>
          <div className='form-group'>
            <label>CPF/CNPJ <span className='required-star'>*</span></label>
            <input
              className='input-field'
              type='text'
              required
              value={formLocatario.cpfCnpj}
              onChange={(e) => setFormLocatario((s) => ({ ...s, cpfCnpj: e.target.value }))}
            />
          </div>
          <div className='form-group'>
            <label>Email <span className='required-star'>*</span></label>
            <input
              className='input-field'
              type='email'
              required
              value={formLocatario.email}
              onChange={(e) => setFormLocatario((s) => ({ ...s, email: e.target.value }))}
            />
          </div>
          <div className='form-group'>
            <label>Telefone <span className='required-star'>*</span></label>
            <input
              className='input-field'
              type='tel'
              required
              value={formLocatario.telefone}
              onChange={(e) => setFormLocatario((s) => ({ ...s, telefone: e.target.value }))}
            />
          </div>
          <div className='form-group'>
            <label>Celular</label>
            <input
              className='input-field'
              type='tel'
              value={formLocatario.celular}
              onChange={(e) => setFormLocatario((s) => ({ ...s, celular: e.target.value }))}
            />
          </div>
          <div className='form-group'>
            <label>Endereço <span className='required-star'>*</span></label>
            <input
              className='input-field'
              type='text'
              required
              value={formLocatario.endereco}
              onChange={(e) => setFormLocatario((s) => ({ ...s, endereco: e.target.value }))}
            />
          </div>
          <div className='form-group'>
            <label>Número</label>
            <input
              className='input-field'
              type='text'
              value={formLocatario.numero}
              onChange={(e) => setFormLocatario((s) => ({ ...s, numero: e.target.value }))}
            />
          </div>
          <div className='form-group'>
            <label>Complemento</label>
            <input
              className='input-field'
              type='text'
              value={formLocatario.complemento}
              onChange={(e) => setFormLocatario((s) => ({ ...s, complemento: e.target.value }))}
            />
          </div>
          <div className='form-group'>
            <label>Bairro</label>
            <input
              className='input-field'
              type='text'
              value={formLocatario.bairro}
              onChange={(e) => setFormLocatario((s) => ({ ...s, bairro: e.target.value }))}
            />
          </div>
          <div className='form-group'>
            <label>Cidade <span className='required-star'>*</span></label>
            <input
              className='input-field'
              type='text'
              required
              value={formLocatario.cidade}
              onChange={(e) => setFormLocatario((s) => ({ ...s, cidade: e.target.value }))}
            />
          </div>
          <div className='form-group'>
            <label>Estado <span className='required-star'>*</span></label>
            <input
              className='input-field'
              type='text'
              maxLength={2}
              required
              value={formLocatario.estado}
              onChange={(e) => setFormLocatario((s) => ({ ...s, estado: e.target.value.toUpperCase() }))}
            />
          </div>
          <div className='form-group'>
            <label>CEP</label>
            <input
              className='input-field'
              type='text'
              value={formLocatario.cep}
              onChange={(e) => setFormLocatario((s) => ({ ...s, cep: e.target.value }))}
            />
          </div>
          <div className='form-group'>
            <label>Observações</label>
            <textarea
              className='textarea-field'
              rows={4}
              value={formLocatario.observacoes}
              onChange={(e) => setFormLocatario((s) => ({ ...s, observacoes: e.target.value }))}
            />
          </div>

          <div className='form-actions'>
            <button type='submit' className='button button-primary'>
              {modoEdicao ? 'Atualizar locatário' : 'Criar locatário'}
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
        <h2>Locatários ({locatarios.length})</h2>
        <table className='table'>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Cidade</th>
              <th>Estado</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {locatarios.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.nome}</td>
                <td>{item.email}</td>
                <td>{item.telefone}</td>
                <td>{item.cidade}</td>
                <td>{item.estado}</td>
                <td className='table-actions'>
                  <button type='button' className='button button-outline' onClick={() => editarLocatario(item)}>
                    Editar
                  </button>
                  <button type='button' className='button button-secondary' onClick={() => excluirLocatario(item.id)}>
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
