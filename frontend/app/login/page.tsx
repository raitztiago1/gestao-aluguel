'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { clearSession, createSession, isSessionValid } from '../lib/session';

export default function Login() {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!isSessionValid()) {
      clearSession();
    }
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (login === 'admin' && senha === 'admin') {
      createSession();
      router.push('/home');
    } else {
      setErro('Login ou senha incorretos');
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#f2f2f2'
    }}>
      <form onSubmit={handleSubmit} style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '0.6rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '300px'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Login - Gestão de Aluguel</h2>

        {erro && <p style={{ color: 'red', textAlign: 'center', marginBottom: '1rem' }}>{erro}</p>}

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Login:</label>
          <input
            type="text"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
            required
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Senha:</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
            required
          />
        </div>

        <button type="submit" style={{
          width: '100%',
          padding: '0.75rem',
          background: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '1rem'
        }}>
          Entrar
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginTop: '1rem' }}>
          <button
            type="button"
            onClick={() => router.push('/register')}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cadastrar
          </button>
          <button
            type="button"
            onClick={() => router.push('/forgot-password')}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Esqueceu a senha
          </button>
        </div>
      </form>
    </div>
  );
}