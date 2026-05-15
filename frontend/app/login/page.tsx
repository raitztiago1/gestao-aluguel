'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import ErrorAlert from '../components/ErrorAlert';
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
    <div className='auth-page'>
      <div className='auth-card'>
        <h2 className='auth-title'>Login</h2>
        <p className='auth-subtitle'>Acesse o sistema de gestão de aluguel de forma segura.</p>

        {erro && <ErrorAlert title='Não foi possível entrar' message={erro} onDismiss={() => setErro('')} />}

        <form onSubmit={handleSubmit} className='form-grid'>
          <div className='form-group'>
            <label>Login</label>
            <input
              className='input-field'
              type='text'
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
            />
          </div>

          <div className='form-group'>
            <label>Senha</label>
            <input
              className='input-field'
              type='password'
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          <button type='submit' className='button button-primary'>
            Entrar
          </button>

          <div className='auth-actions'>
            <button type='button' className='button button-secondary' onClick={() => router.push('/register')}>
              Cadastrar
            </button>
            <button type='button' className='button button-outline' onClick={() => router.push('/forgot-password')}>
              Esqueceu a senha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
