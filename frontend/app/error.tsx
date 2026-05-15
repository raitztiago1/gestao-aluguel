'use client';

import { useEffect } from 'react';
import ErrorAlert from './components/ErrorAlert';
import { getErrorMessage } from './lib/errors';

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Erro de página:', error);
  }, [error]);

  return (
    <main className='container'>
      <ErrorAlert
        title='Não foi possível carregar esta página'
        message={getErrorMessage(error, 'Ocorreu um erro inesperado.')}
        onDismiss={reset}
      />
      <div className='card'>
        <button type='button' className='button button-primary' onClick={() => reset()}>
          Tentar novamente
        </button>
      </div>
    </main>
  );
}
