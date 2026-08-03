'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import AddressFields from '../components/AddressFields';
import AppHeader from '../components/AppHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import ErrorAlert from '../components/ErrorAlert';
import MaskedInput from '../components/MaskedInput';
import Modal from '../components/Modal';
import SortableTh from '../components/SortableTh';
import { useCepLookup } from '../hooks/useCepLookup';
import { useAuthGuard } from '../hooks/useAuth';
import { fetchJson, requestJson } from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import {
    formatAddressLine,
    formatCpfCnpjDisplay,
    formatPhoneDisplay,
    labelTipoPessoa
} from '../lib/format';
import { maskCep, maskCpfCnpj, maskPhone, onlyDigits } from '../lib/masks';

type TipoPessoa = 'FISICA' | 'JURIDICA';
type SortDirection = 'asc' | 'desc';
type LocatarioSortKey = 'nome' | 'tipo' | 'documento' | 'localizacao';

type Locatario = {
  id: number;
  tipoPessoa: TipoPessoa;
  nome: string;
  cpfCnpj: string;
  email: string;
  telefone: string;
  celular: string;
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
  celular: loc.celular ? maskPhone(loc.celular) : '',
  telefone: maskPhone(loc.telefone),
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
  const authStatus = useAuthGuard();
  const [locatarios, setLocatarios] = useState<Locatario[]>([]);
  const [formLocatario, setFormLocatario] = useState<LocatarioForm>(defaultLocatarioForm);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [locatarioParaExcluir, setLocatarioParaExcluir] = useState<Locatario | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [erroModal, setErroModal] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: LocatarioSortKey; direction: SortDirection }>({
    key: 'nome',
    direction: 'asc'
  });

  const updateAddress = useCallback((patch: Partial<LocatarioForm>) => {
    setFormLocatario((s) => ({ ...s, ...patch }));
  }, []);

  const { handleCepChange, resetCepRef } = useCepLookup({
    onAddressUpdate: updateAddress,
    onError: (msg) => setErroModal(msg)
  });

  useEffect(() => {
    document.title = 'Gestão de Aluguel - Locatários';
  }, []);

  useEffect(() => {
    if (authStatus !== 'authenticated') {
      return;
    }
    carregarDados();
  }, [authStatus]);

  // Helper function to validate CPF
  const isValidCpf = (cpf: string): boolean => {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    for (let t = 9; t < 11; t++) {
      let sum = 0;
      for (let i = 0; i < t; i++) {
        sum += parseInt(cpf[i]) * (t + 1 - i);
      }
      let digito = (sum * 10) % 11;
      if (digito === 10) digito = 0;
      if (digito !== parseInt(cpf[t])) return false;
    }
    return true;
  };

  // Helper function to validate CNPJ
  const isValidCnpj = (cnpj: string): boolean => {
    cnpj = cnpj.replace(/[^\d]+/g, '');
    if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

    const validarDigito = (base: string, peso: number[]): boolean => {
      let soma = 0;
      for (let i = 0; i < base.length; i++) {
        soma += parseInt(base[i]) * peso[i];
      }
      let resto = soma % 11;
      let digito = resto < 2 ? 0 : 11 - resto;
      return digito === parseInt(base[base.length - 1]);
    };

    const peso1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const peso2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    // Valida o primeiro dígito verificador
    let cnpjSemDigitos = cnpj.substring(0, 12);
    let digito1 = cnpj.substring(12, 13);
    let soma1 = 0;
    for (let i = 0; i < 12; i++) {
      soma1 += parseInt(cnpjSemDigitos.charAt(i)) * peso1[i];
    }
    let resultado1 = soma1 % 11 < 2 ? 0 : 11 - (soma1 % 11);
    if (resultado1 !== parseInt(digito1)) return false;

    // Valida o segundo dígito verificador
    let cnpjComDigito1 = cnpj.substring(0, 13);
    let digito2 = cnpj.substring(13, 14);
    let soma2 = 0;
    for (let i = 0; i < 13; i++) {
      soma2 += parseInt(cnpjComDigito1.charAt(i)) * peso2[i];
    }
    let resultado2 = soma2 % 11 < 2 ? 0 : 11 - (soma2 % 11);
    return resultado2 === parseInt(digito2);
  };

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
    setErroModal(null);
    try {
      const payload = {
        tipoPessoa: formLocatario.tipoPessoa,
        nome: formLocatario.nome.trim(),
        // CPF/CNPJ validation
        ...(() => {
          const rawCpfCnpj = onlyDigits(formLocatario.cpfCnpj);
          if (formLocatario.tipoPessoa === 'FISICA' && !isValidCpf(rawCpfCnpj)) {
            throw new Error('CPF inválido.');
          }
          if (formLocatario.tipoPessoa === 'JURIDICA' && !isValidCnpj(rawCpfCnpj)) {
            throw new Error('CNPJ inválido.');
          }
          return {};
        })(),

        cpfCnpj: onlyDigits(formLocatario.cpfCnpj),
        email: formLocatario.email.trim(),
        telefone: onlyDigits(formLocatario.telefone),
        celular: onlyDigits(formLocatario.celular),
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
      setErroModal(getErrorMessage(err, 'Falha ao salvar locatário.'));
    }
  };

  const editarLocatario = (locatario: Locatario) => {
    setFormLocatario(locatarioToForm(locatario));
    setModoEdicao(true);
    setShowModal(true);
    setErro(null);
    setErroModal(null);
    resetCepRef();
  };

  const excluirLocatario = async () => {
    if (!locatarioParaExcluir) return;

    try {
      await requestJson<void>(`/api/locatarios/${locatarioParaExcluir.id}`, 'DELETE');
      await carregarDados();
    } catch (err) {
      setErro(getErrorMessage(err, 'Falha ao excluir locatário.'));
      throw err;
    }
  };

  const resetForm = () => {
    setModoEdicao(false);
    setFormLocatario(defaultLocatarioForm);
    setShowModal(false);
    setErroModal(null);
    resetCepRef();
  };

  const abrirNovaFormulario = () => {
    setModoEdicao(false);
    setFormLocatario(defaultLocatarioForm);
    setShowModal(true);
    setErro(null);
    setErroModal(null);
    resetCepRef();
  };

  const handleSort = (key: LocatarioSortKey) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedLocatarios = [...locatarios].sort((a, b) => {
    const direction = sortConfig.direction === 'asc' ? 1 : -1;
    const valueA = (() => {
      switch (sortConfig.key) {
        case 'nome':
          return a.nome.toLowerCase();
        case 'tipo':
          return labelTipoPessoa(a.tipoPessoa);
        case 'documento':
          return formatCpfCnpjDisplay(a.cpfCnpj, a.tipoPessoa).toLowerCase();
        case 'localizacao':
          return formatAddressLine(a).toLowerCase();
        default:
          return '';
      }
    })();
    const valueB = (() => {
      switch (sortConfig.key) {
        case 'nome':
          return b.nome.toLowerCase();
        case 'tipo':
          return labelTipoPessoa(b.tipoPessoa);
        case 'documento':
          return formatCpfCnpjDisplay(b.cpfCnpj, b.tipoPessoa).toLowerCase();
        case 'localizacao':
          return formatAddressLine(b).toLowerCase();
        default:
          return '';
      }
    })();

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
        <h2>Locatários cadastrados ({locatarios.length})</h2>
        <button type='button' className='button button-primary' onClick={abrirNovaFormulario}>
          + Novo locatário
        </button>
      </div>

      <Modal
        isOpen={showModal}
        title={modoEdicao ? 'Editar locatário' : 'Novo locatário'}
        description='Preencha os dados de identificação, contato, endereço e documentos.'
        onClose={resetForm}
        closeOnBackdrop={false}
        actions={(
          <>
            <button
              type='submit'
              form='locatario-form'
              className='button button-primary'
            >
              {modoEdicao ? 'Salvar alterações' : 'Cadastrar locatário'}
            </button>
            <button type='button' className='button button-secondary' onClick={resetForm}>
              Cancelar
            </button>
          </>
        )}
      >
        {erroModal && <ErrorAlert message={erroModal} onDismiss={() => setErroModal(null)} />}
        <form id='locatario-form' onSubmit={salvarLocatario} className='form-grid'>
          <section className='form-section' aria-labelledby='locatario-identificacao-heading'>
            <h3 id='locatario-identificacao-heading'>Identificação</h3>
            <div className='form-grid'>
              <div className='form-group'>
                <label htmlFor='locatario-tipo'>Tipo de pessoa</label>
                <select
                  id='locatario-tipo'
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
                  aria-required='true'
                >
                  <option value='FISICA'>Pessoa física</option>
                  <option value='JURIDICA'>Pessoa jurídica</option>
                </select>
              </div>

              <div className='form-group'>
                <label htmlFor='locatario-nome'>Nome <span className='required-star' aria-hidden='true'>*</span></label>
                <input
                  id='locatario-nome'
                  className='input-field'
                  type='text'
                  required
                  aria-required='true'
                  value={formLocatario.nome}
                  onChange={(e) => setFormLocatario((s) => ({ ...s, nome: e.target.value }))}
                />
              </div>
            </div>
          </section>

          <section className='form-section' aria-labelledby='locatario-contato-endereco-heading'>
            <h3 id='locatario-contato-endereco-heading'>Contato e endereço</h3>
            <div className='form-grid'>
              <div className='form-group'>
                <label htmlFor='locatario-email'>E-mail <span className='required-star' aria-hidden='true'>*</span></label>
                <input
                  id='locatario-email'
                  className='input-field'
                  type='email'
                  required
                  aria-required='true'
                  value={formLocatario.email}
                  onChange={(e) => setFormLocatario((s) => ({ ...s, email: e.target.value }))}
                />
              </div>

              <div className='form-grid-two'>
                <div className='form-group'>
                  <label htmlFor='locatario-celular'>Celular <span className='required-star' aria-hidden='true'>*</span></label>
                  <MaskedInput
                    id='locatario-celular'
                    mask='phone'
                    required
                    aria-required='true'
                    value={formLocatario.celular}
                    onValueChange={(celular) => setFormLocatario((s) => ({ ...s, celular }))}
                    placeholder='(00) 00000-0000'
                    inputMode='tel'
                  />
                </div>
                <div className='form-group'>
                  <label htmlFor='locatario-telefone'>Telefone</label>
                  <MaskedInput
                    id='locatario-telefone'
                    mask='phone'
                    value={formLocatario.telefone}
                    onValueChange={(telefone) => setFormLocatario((s) => ({ ...s, telefone }))}
                    placeholder='(00) 0000-0000'
                    inputMode='tel'
                  />
                </div>
              </div>

              <AddressFields
                idPrefix='locatario-endereco'
                required
                value={formLocatario}
                onChange={(patch) => setFormLocatario((s) => ({ ...s, ...patch }))}
                onCepChange={(v) => handleCepChange(v, (cep) => setFormLocatario((s) => ({ ...s, cep })))}
              />
            </div>
          </section>

          <section className='form-section' aria-labelledby='locatario-documentos-heading'>
            <h3 id='locatario-documentos-heading'>Documentos e observações</h3>
            <div className='form-grid'>
              <div className='form-group'>
                <label htmlFor='locatario-documento'>
                  {formLocatario.tipoPessoa === 'JURIDICA' ? 'CNPJ' : 'CPF'}{' '}
                  <span className='required-star' aria-hidden='true'>*</span>
                </label>
                <MaskedInput
                  id='locatario-documento'
                  mask='cpfCnpj'
                  tipoPessoa={formLocatario.tipoPessoa}
                  required
                  aria-required='true'
                  value={formLocatario.cpfCnpj}
                  onValueChange={(cpfCnpj) => setFormLocatario((s) => ({ ...s, cpfCnpj }))}
                  placeholder={formLocatario.tipoPessoa === 'JURIDICA' ? '00.000.000/0000-00' : '000.000.000-00'}
                  inputMode='numeric'
                />
              </div>

              <div className='form-group'>
                <label htmlFor='locatario-observacoes'>Observações</label>
                <textarea
                  id='locatario-observacoes'
                  className='textarea-field'
                  rows={4}
                  value={formLocatario.observacoes}
                  onChange={(e) => setFormLocatario((s) => ({ ...s, observacoes: e.target.value }))}
                />
              </div>
            </div>
          </section>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={locatarioParaExcluir !== null}
        title={locatarioParaExcluir
          ? `Excluir locatário ${locatarioParaExcluir.nome}`
          : 'Excluir locatário'}
        message='Deseja realmente excluir este locatário? Esta ação não pode ser desfeita.'
        errorFallback='Falha ao excluir locatário.'
        onCancel={() => setLocatarioParaExcluir(null)}
        onConfirm={excluirLocatario}
      />

      <section className='card'>
        <div className='table-scroll'>
        <table className='table'>
          <thead>
            <tr>
              <SortableTh label='Nome' sortKey='nome' activeKey={sortConfig.key} direction={sortConfig.direction} onSort={(key) => handleSort(key as LocatarioSortKey)} />
              <SortableTh label='Tipo' sortKey='tipo' activeKey={sortConfig.key} direction={sortConfig.direction} onSort={(key) => handleSort(key as LocatarioSortKey)} />
              <SortableTh label='Documento' sortKey='documento' activeKey={sortConfig.key} direction={sortConfig.direction} onSort={(key) => handleSort(key as LocatarioSortKey)} />
              <th>Contato</th>
              <SortableTh label='Localização' sortKey='localizacao' activeKey={sortConfig.key} direction={sortConfig.direction} onSort={(key) => handleSort(key as LocatarioSortKey)} />
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
              sortedLocatarios.map((item) => (
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
                    <button type='button' className='button button-secondary' onClick={() => setLocatarioParaExcluir(item)}>
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
