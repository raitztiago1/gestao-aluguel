'use client';

import { useId } from 'react';
import MaskedInput from './MaskedInput';
import type { AddressFieldsState } from '../hooks/useCepLookup';

const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

type AddressFieldsProps = {
  value: AddressFieldsState;
  onChange: (patch: Partial<AddressFieldsState>) => void;
  onCepChange: (value: string) => void | Promise<void>;
  required?: boolean;
  showComplement?: boolean;
  idPrefix?: string;
};

export default function AddressFields({
  value,
  onChange,
  onCepChange,
  required = false,
  showComplement = true,
  idPrefix
}: AddressFieldsProps) {
  const generatedPrefix = useId().replace(/:/g, '');
  const prefix = idPrefix ?? generatedPrefix;
  const star = required ? <span className='required-star' aria-hidden='true'>*</span> : null;

  return (
    <>
      <div className='form-group'>
        <label htmlFor={`${prefix}-cep`}>CEP</label>
        <MaskedInput
          id={`${prefix}-cep`}
          mask='cep'
          value={value.cep}
          onValueChange={(v) => void onCepChange(v)}
          placeholder='00000-000'
          maxLength={9}
          inputMode='numeric'
        />
        <span className='field-hint'>Digite o CEP para preencher o endereço automaticamente</span>
      </div>

      <div className='form-group'>
        <label htmlFor={`${prefix}-endereco`}>
          Logradouro {star}
        </label>
        <input
          id={`${prefix}-endereco`}
          className='input-field'
          type='text'
          required={required}
          aria-required={required || undefined}
          value={value.endereco}
          onChange={(e) => onChange({ endereco: e.target.value })}
          placeholder='Rua, avenida...'
        />
      </div>

      <div className='form-grid-two'>
        <div className='form-group'>
          <label htmlFor={`${prefix}-numero`}>Número</label>
          <input
            id={`${prefix}-numero`}
            className='input-field'
            type='text'
            value={value.numero}
            onChange={(e) => onChange({ numero: e.target.value })}
            placeholder='Nº'
          />
        </div>
        {showComplement && (
          <div className='form-group'>
            <label htmlFor={`${prefix}-complemento`}>Complemento</label>
            <input
              id={`${prefix}-complemento`}
              className='input-field'
              type='text'
              value={value.complemento}
              onChange={(e) => onChange({ complemento: e.target.value })}
              placeholder='Apto, bloco...'
            />
          </div>
        )}
      </div>

      <div className='form-group'>
        <label htmlFor={`${prefix}-bairro`}>Bairro</label>
        <input
          id={`${prefix}-bairro`}
          className='input-field'
          type='text'
          value={value.bairro}
          onChange={(e) => onChange({ bairro: e.target.value })}
        />
      </div>

      <div className='form-grid-two'>
        <div className='form-group'>
          <label htmlFor={`${prefix}-cidade`}>
            Cidade {star}
          </label>
          <input
            id={`${prefix}-cidade`}
            className='input-field'
            type='text'
            required={required}
            aria-required={required || undefined}
            value={value.cidade}
            onChange={(e) => onChange({ cidade: e.target.value })}
          />
        </div>
        <div className='form-group'>
          <label htmlFor={`${prefix}-estado`}>
            Estado {star}
          </label>
          <select
            id={`${prefix}-estado`}
            className='select-field'
            required={required}
            aria-required={required || undefined}
            value={value.estado}
            onChange={(e) => onChange({ estado: e.target.value })}
          >
            <option value=''>UF</option>
            {UF_OPTIONS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}
