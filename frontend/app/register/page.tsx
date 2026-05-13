'use client';

import { useRouter } from 'next/navigation';

export default function Register() {
  const router = useRouter();

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#f2f2f2'
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '0.6rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '320px',
        textAlign: 'center'
      }}>
        <h2>Cadastrar</h2>
        <p>Cadastro não implementado ainda. Use o login existente ou volte para a tela de autenticação.</p>
        <button
          type="button"
          onClick={() => router.push('/login')}
          style={{
            marginTop: '1rem',
            width: '100%',
            padding: '0.75rem',
            background: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Voltar ao login
        </button>
      </div>
    </div>
  );
}
