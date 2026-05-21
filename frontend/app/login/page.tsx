'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import ErrorAlert from '../components/ErrorAlert';
import { login } from '../lib/api';
import { clearSession, createSession, isSessionValid } from '../lib/session';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isSessionValid()) {
      router.push('/home');
    } else {
      clearSession();
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      // Validação básica
      if (!email || !senha) {
        setErro('Por favor, preencha todos os campos');
        setLoading(false);
        return;
      }

      if (!email.includes('@')) {
        setErro('Por favor, insira um email válido');
        setLoading(false);
        return;
      }

      const response = await login(email, senha);
      
      createSession(response);
      router.push('/home');
    } catch (err: any) {
      const mensagem = err?.message || 'Erro ao fazer login. Verifique suas credenciais.';
      setErro(mensagem);
      setLoading(false);
    }
  };

  return (
    <div className='auth-page'>
      <div className='auth-card'>
        <h2 className='auth-title'>Login</h2>
        <p className='auth-subtitle'>Acesse o sistema de gestão de aluguel de forma segura.</p>

        {erro && <ErrorAlert title='Erro na autenticação' message={erro} onDismiss={() => setErro('')} />}

        <form onSubmit={handleSubmit} className='form-grid'>
          <div className='form-group'>
            <label>Email</label>
            <input
              className='input-field'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
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
              disabled={loading}
            />
          </div>

          <button type='submit' className='button button-primary' disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <div className='auth-actions'>
            <button
              type='button'
              className='button button-secondary'
              onClick={() => router.push('/register')}
              disabled={loading}
            >
              Cadastrar
            </button>
            <button
              type='button'
              className='button button-outline'
              onClick={() => router.push('/forgot-password')}
              disabled={loading}
            >
              Esqueceu a senha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
