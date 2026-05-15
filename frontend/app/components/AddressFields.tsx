'use client';

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
};

export default function AddressFields({
  value,
  onChange,
  onCepChange,
  required = false,
  showComplement = true
}: AddressFieldsProps) {
  const star = required ? <span className='required-star'>*</span> : null;

  return (
    <>
      <div className='form-group'>
        <label>CEP</label>
        <MaskedInput
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
        <label>Logradouro {star}</label>
        <input
          className='input-field'
          type='text'
          required={required}
          value={value.endereco}
          onChange={(e) => onChange({ endereco: e.target.value })}
          placeholder='Rua, avenida...'
        />
      </div>

      <div className='form-grid-two'>
        <div className='form-group'>
          <label>Número</label>
          <input
            className='input-field'
            type='text'
            value={value.numero}
            onChange={(e) => onChange({ numero: e.target.value })}
            placeholder='Nº'
          />
        </div>
        {showComplement && (
          <div className='form-group'>
            <label>Complemento</label>
            <input
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
        <label>Bairro</label>
        <input
          className='input-field'
          type='text'
          value={value.bairro}
          onChange={(e) => onChange({ bairro: e.target.value })}
        />
      </div>

      <div className='form-grid-two'>
        <div className='form-group'>
          <label>Cidade {star}</label>
          <input
            className='input-field'
            type='text'
            required={required}
            value={value.cidade}
            onChange={(e) => onChange({ cidade: e.target.value })}
          />
        </div>
        <div className='form-group'>
          <label>Estado {star}</label>
          <select
            className='select-field'
            required={required}
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
