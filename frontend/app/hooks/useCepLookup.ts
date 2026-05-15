'use client';

import { useCallback, useRef } from 'react';
import { maskCep, onlyDigits } from '../lib/masks';

export type AddressFieldsState = {
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
};

type UseCepLookupOptions = {
  onAddressUpdate: (patch: Partial<AddressFieldsState>) => void;
  onError?: (message: string) => void;
};

export function useCepLookup({ onAddressUpdate, onError }: UseCepLookupOptions) {
  const lastCepRef = useRef('');

  const lookupCep = useCallback(
    async (cepDigits: string) => {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
        if (!response.ok) throw new Error('Erro ao consultar CEP');
        const data = await response.json();
        if (data.erro) throw new Error('CEP não encontrado');
        onAddressUpdate({
          endereco: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || ''
        });
      } catch (err) {
        onError?.(err instanceof Error ? err.message : 'Falha ao consultar CEP.');
      }
    },
    [onAddressUpdate, onError]
  );

  const handleCepChange = useCallback(
    async (value: string, setCep: (formatted: string) => void) => {
      const formatted = maskCep(value);
      const digits = onlyDigits(formatted);
      setCep(formatted);
      if (digits.length === 8 && digits !== lastCepRef.current) {
        lastCepRef.current = digits;
        await lookupCep(digits);
      }
      if (digits.length < 8) {
        lastCepRef.current = '';
      }
    },
    [lookupCep]
  );

  const resetCepRef = useCallback(() => {
    lastCepRef.current = '';
  }, []);

  return { handleCepChange, resetCepRef };
}
