'use client';

import { useEffect } from 'react';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Erro global:', error);
  }, [error]);

  return (
    <html lang='pt-BR'>
      <body style={{ fontFamily: 'Inter, system-ui, sans-serif', margin: 0, padding: '2rem', background: '#f3f7fb' }}>
        <main style={{ maxWidth: 560, margin: '0 auto' }}>
          <div
            style={{
              background: '#ffe3e3',
              border: '1px solid #f5c2c7',
              borderRadius: 12,
              padding: '1rem 1.25rem',
              color: '#842029',
              marginBottom: '1rem'
            }}
            role='alert'
          >
            <strong style={{ display: 'block', marginBottom: 8 }}>Erro crítico na aplicação</strong>
            <p style={{ margin: 0 }}>
              {error.message || 'Ocorreu um erro inesperado. Recarregue a página para continuar.'}
            </p>
          </div>
          <button
            type='button'
            onClick={() => reset()}
            style={{
              padding: '0.85rem 1.25rem',
              borderRadius: 10,
              border: 'none',
              background: '#0f62fe',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  );
}
