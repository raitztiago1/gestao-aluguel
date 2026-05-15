'use client';

import { InputHTMLAttributes } from 'react';
import { applyMask, MaskType } from '../lib/masks';

type MaskedInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  mask: MaskType;
  value: string;
  onValueChange: (value: string) => void;
  tipoPessoa?: 'FISICA' | 'JURIDICA';
  className?: string;
};

export default function MaskedInput({
  mask,
  value,
  onValueChange,
  tipoPessoa,
  className = 'input-field',
  ...rest
}: MaskedInputProps) {
  return (
    <input
      {...rest}
      className={className}
      value={value}
      onChange={(e) => onValueChange(applyMask(mask, e.target.value, { tipoPessoa }))}
    />
  );
}
