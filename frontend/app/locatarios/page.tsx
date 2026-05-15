'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import AddressFields from '../components/AddressFields';
import AppHeader from '../components/AppHeader';
import ErrorAlert from '../components/ErrorAlert';
import MaskedInput from '../components/MaskedInput';
import { fetchJson, requestJson } from '../lib/api';
import {
  formatAddressLine,
  formatCpfCnpjDisplay,
  formatPhoneDisplay,
  labelTipoPessoa
} from '../lib/format';
import { getErrorMessage } from '../lib/errors';
import { useCepLookup } from '../hooks/useCepLookup';
import { maskCep, maskCpfCnpj, maskPhone, onlyDigits } from '../lib/masks';
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

function locatarioToForm(loc: Locatario): LocatarioForm {
  return {
    id: loc.id,
    tipoPessoa: loc.tipoPessoa,
    nome: loc.nome,
    cpfCnpj: maskCpfCnpj(loc.cpfCnpj, loc.tipoPessoa),
    email: loc.email,
    telefone: maskPhone(loc.telefone),
    celular: loc.celular ? maskPhone(loc.celular) : '',
    endereco: loc.endereco,
    numero: loc.numero ?? '',
    complemento: loc.complemento ?? '',
    bairro: loc.bairro ?? '',
    cidade: loc.cidade,
    estado: loc.estado,
    cep: loc.cep ? maskCep(loc.cep) : '',
    observacoes: loc.observacoes ?? ''
  };
}

export default function LocatariosPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [locatarios, setLocatarios] = useState<Locatario[]>([]);
  const [formLocatario, setFormLocatario] = useState<LocatarioForm>(defaultLocatarioForm);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const updateAddress = useCallback((patch: Partial<LocatarioForm>) => {
    setFormLocatario((s) => ({ ...s, ...patch }));
  }, []);

  const { handleCepChange, resetCepRef } = useCepLookup({
    onAddressUpdate: updateAddress,
    onError: (msg) => setErro(msg)
  });

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
      setErro(getErrorMessage(err, 'Erro ao carregar locatários.'));
    } finally {
      setCarregando(false);
    }
  };

  const salvarLocatario = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const payload = {
        tipoPessoa: formLocatario.tipoPessoa,
        nome: formLocatario.nome.trim(),
        cpfCnpj: onlyDigits(formLocatario.cpfCnpj),
        email: formLocatario.email.trim(),
        telefone: onlyDigits(formLocatario.telefone),
        celular: formLocatario.celular ? onlyDigits(formLocatario.celular) : undefined,
        endereco: formLocatario.endereco.trim(),
        numero: formLocatario.numero.trim() || undefined,
        complemento: formLocatario.complemento.trim() || undefined,
        bairro: formLocatario.bairro.trim() || undefined,
        cidade: formLocatario.cidade.trim(),
        estado: formLocatario.estado,
        cep: formLocatario.cep ? onlyDigits(formLocatario.cep) : undefined,
        observacoes: formLocatario.observacoes.trim() || undefined
      };

      if (modoEdicao && formLocatario.id) {
        await requestJson<Locatario>(`/api/locatarios/${formLocatario.id}`, 'PUT', payload);
      } else {
        await requestJson<Locatario>('/api/locatarios', 'POST', payload);
      }
      resetForm();
      await carregarDados();
    } catch (err) {
      setErro(getErrorMessage(err, 'Falha ao salvar locatário.'));
    }
  };

  const editarLocatario = (locatario: Locatario) => {
    setFormLocatario(locatarioToForm(locatario));
    setModoEdicao(true);
    setShowModal(true);
    setErro(null);
    resetCepRef();
  };

  const excluirLocatario = async (id: number) => {
    if (!window.confirm('Deseja realmente excluir este locatário?')) return;
    try {
      await requestJson<void>(`/api/locatarios/${id}`, 'DELETE');
      await carregarDados();
    } catch (err) {
      setErro(getErrorMessage(err, 'Falha ao excluir locatário.'));
    }
  };

  const resetForm = () => {
    setModoEdicao(false);
    setFormLocatario(defaultLocatarioForm);
    setShowModal(false);
    setErro(null);
    resetCepRef();
  };

  const abrirNovaFormulario = () => {
    setModoEdicao(false);
    setFormLocatario(defaultLocatarioForm);
    setShowModal(true);
    setErro(null);
    resetCepRef();
  };

  if (!isLoggedIn) {
    return <div className='alert-card'>Redirecionando para login...</div>;
  }

  return (
    <main className='container'>
      <AppHeader
        title='Locatários'
        subtitle='Cadastre pessoas físicas ou jurídicas com contato e endereço completos.'
      />

      {carregando && <div className='alert-card'>Carregando...</div>}
      {erro && <ErrorAlert message={erro} onDismiss={() => setErro(null)} />}

      <div className='page-toolbar'>
        <h2>Locatários cadastrados ({locatarios.length})</h2>
        <button type='button' className='button button-primary' onClick={abrirNovaFormulario}>
          + Novo locatário
        </button>
      </div>

      {showModal && (
        <div className='modal-backdrop' onClick={resetForm}>
          <div className='modal' onClick={(event) => event.stopPropagation()}>
            <div className='modal-header'>
              <div>
                <h2>{modoEdicao ? 'Editar locatário' : 'Novo locatário'}</h2>
                <p className='modal-description'>Preencha os dados de contato e endereço.</p>
              </div>
              <button className='modal-close' onClick={resetForm} aria-label='Fechar modal'>×</button>
            </div>

            <div className='modal-content'>
              <form onSubmit={salvarLocatario} className='form-grid'>
                <div className='form-group'>
                  <label>Tipo de pessoa</label>
                  <select
                    className='select-field'
                    value={formLocatario.tipoPessoa}
                    onChange={(e) => {
                      const tipo = e.target.value as TipoPessoa;
                      setFormLocatario((s) => ({
                        ...s,
                        tipoPessoa: tipo,
                        cpfCnpj: maskCpfCnpj(s.cpfCnpj, tipo)
                      }));
                    }}
                    required
                  >
                    <option value='FISICA'>Pessoa física</option>
                    <option value='JURIDICA'>Pessoa jurídica</option>
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
                  <label>{formLocatario.tipoPessoa === 'JURIDICA' ? 'CNPJ' : 'CPF'} <span className='required-star'>*</span></label>
                  <MaskedInput
                    mask='cpfCnpj'
                    tipoPessoa={formLocatario.tipoPessoa}
                    required
                    value={formLocatario.cpfCnpj}
                    onValueChange={(cpfCnpj) => setFormLocatario((s) => ({ ...s, cpfCnpj }))}
                    placeholder={formLocatario.tipoPessoa === 'JURIDICA' ? '00.000.000/0000-00' : '000.000.000-00'}
                    inputMode='numeric'
                  />
                </div>

                <div className='form-group'>
                  <label>E-mail <span className='required-star'>*</span></label>
                  <input
                    className='input-field'
                    type='email'
                    required
                    value={formLocatario.email}
                    onChange={(e) => setFormLocatario((s) => ({ ...s, email: e.target.value }))}
                  />
                </div>

                <div className='form-grid-two'>
                  <div className='form-group'>
                    <label>Telefone <span className='required-star'>*</span></label>
                    <MaskedInput
                      mask='phone'
                      required
                      value={formLocatario.telefone}
                      onValueChange={(telefone) => setFormLocatario((s) => ({ ...s, telefone }))}
                      placeholder='(00) 0000-0000'
                      inputMode='tel'
                    />
                  </div>
                  <div className='form-group'>
                    <label>Celular</label>
                    <MaskedInput
                      mask='phone'
                      value={formLocatario.celular}
                      onValueChange={(celular) => setFormLocatario((s) => ({ ...s, celular }))}
                      placeholder='(00) 00000-0000'
                      inputMode='tel'
                    />
                  </div>
                </div>

                <AddressFields
                  required
                  value={formLocatario}
                  onChange={(patch) => setFormLocatario((s) => ({ ...s, ...patch }))}
                  onCepChange={(v) => handleCepChange(v, (cep) => setFormLocatario((s) => ({ ...s, cep })))}
                />

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
                    {modoEdicao ? 'Salvar alterações' : 'Cadastrar locatário'}
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
              <th>Nome</th>
              <th>Tipo</th>
              <th>Documento</th>
              <th>Contato</th>
              <th>Localização</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {locatarios.length === 0 ? (
              <tr>
                <td colSpan={6} className='table-empty'>
                  Nenhum locatário cadastrado.
                </td>
              </tr>
            ) : (
              locatarios.map((item) => (
                <tr key={item.id}>
                  <td>{item.nome}</td>
                  <td>{labelTipoPessoa(item.tipoPessoa)}</td>
                  <td>{formatCpfCnpjDisplay(item.cpfCnpj, item.tipoPessoa)}</td>
                  <td>
                    <div>{item.email}</div>
                    <small>{formatPhoneDisplay(item.telefone)}</small>
                  </td>
                  <td>{formatAddressLine(item)}</td>
                  <td className='table-actions'>
                    <button type='button' className='button button-outline' onClick={() => editarLocatario(item)}>
                      Editar
                    </button>
                    <button type='button' className='button button-secondary' onClick={() => excluirLocatario(item.id)}>
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
