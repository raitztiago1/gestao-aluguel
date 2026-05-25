'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useEffect, useState } from 'react';
import ErrorAlert from '../components/ErrorAlert';
import { forgotPassword, resetPassword } from '../lib/api';

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  const [step, setStep] = useState<'request' | 'reset'>(token ? 'reset' : 'request');
  const [email, setEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      setStep('reset');
    }
  }, [token]);

  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: 'A senha deve ter pelo menos 8 caracteres' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'A senha deve conter pelo menos uma letra maiúscula' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'A senha deve conter pelo menos uma letra minúscula' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'A senha deve conter pelo menos um número' };
    }
    return { valid: true, message: '' };
  };

  const handleRequestReset = async (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setLoading(true);

    try {
      const trimmedEmail = email.trim();

      if (!trimmedEmail) {
        setErro('Por favor, insira seu email');
        setLoading(false);
        return;
      }

      if (!trimmedEmail.includes('@')) {
        setErro('Por favor, insira um email válido');
        setLoading(false);
        return;
      }

      await forgotPassword(trimmedEmail);
      setSucesso('Se o email for válido, você receberá um link para redefinir sua senha em breve.');
      setEmail('');
      setLoading(false);
      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      const mensagem = err?.message || 'Erro ao enviar email de redefinição. Tente novamente.';
      setErro(mensagem);
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setLoading(true);

    try {
      if (!novaSenha || !confirmarSenha) {
        setErro('Por favor, preencha todos os campos');
        setLoading(false);
        return;
      }

      const passwordValidation = validatePassword(novaSenha);
      if (!passwordValidation.valid) {
        setErro(passwordValidation.message);
        setLoading(false);
        return;
      }

      if (novaSenha !== confirmarSenha) {
        setErro('As senhas não correspondem');
        setLoading(false);
        return;
      }

      if (!token) {
        setErro('Token inválido. Por favor, solicite um novo email de redefinição.');
        setLoading(false);
        return;
      }

      await resetPassword(token, novaSenha);
      setSucesso('Senha redefinida com sucesso! Redirecionando para login...');
      setNovaSenha('');
      setConfirmarSenha('');
      setLoading(false);
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      const mensagem = err?.message || 'Erro ao redefinir senha. Tente novamente.';
      setErro(mensagem);
      setLoading(false);
    }
  };

  if (step === 'request') {
    return (
      <div className='auth-page'>
        <div className='auth-card'>
          <h2 className='auth-title'>Esqueceu a Senha</h2>
          <p className='auth-subtitle'>
            Digite seu email e enviaremos um link para você redefinir sua senha.
          </p>

          {erro && (
            <ErrorAlert title='Erro' message={erro} onDismiss={() => setErro('')} />
          )}

          {sucesso && (
            <div style={{
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: '12px 16px',
              borderRadius: '4px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              {sucesso}
            </div>
          )}

          <form onSubmit={handleRequestReset} className='form-grid'>
            <div className='form-group'>
              <label>Email</label>
              <input
                className='input-field'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || !!sucesso}
                placeholder='seu@email.com'
              />
            </div>

            <button
              type='submit'
              className='button button-primary'
              disabled={loading || !!sucesso}
            >
              {loading ? 'Enviando...' : 'Enviar Link de Redefinição'}
            </button>

            <div className='auth-actions'>
              <button
                type='button'
                className='button button-secondary'
                onClick={() => router.push('/login')}
                disabled={loading}
              >
                Voltar ao Login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className='auth-page'>
      <div className='auth-card'>
        <h2 className='auth-title'>Redefinir Senha</h2>
        <p className='auth-subtitle'>
          Digite sua nova senha abaixo.
        </p>

        {erro && (
          <ErrorAlert title='Erro' message={erro} onDismiss={() => setErro('')} />
        )}

        {sucesso && (
          <div style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '12px 16px',
            borderRadius: '4px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {sucesso}
          </div>
        )}

        <form onSubmit={handleResetPassword} className='form-grid'>
          <div className='form-group'>
            <label>Nova Senha</label>
            <input
              className='input-field'
              type='password'
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              required
              disabled={loading || !!sucesso}
              placeholder='Mínimo 8 caracteres, com maiúsculas e números'
            />
            <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
              Mínimo 8 caracteres, com letra maiúscula, minúscula e número
            </small>
          </div>

          <div className='form-group'>
            <label>Confirmar Senha</label>
            <input
              className='input-field'
              type='password'
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
              disabled={loading || !!sucesso}
              placeholder='Repita a senha'
            />
          </div>

          <button
            type='submit'
            className='button button-primary'
            disabled={loading || !!sucesso}
          >
            {loading ? 'Redefinindo...' : 'Redefinir Senha'}
          </button>

          <div className='auth-actions'>
            <button
              type='button'
              className='button button-secondary'
              onClick={() => router.push('/login')}
              disabled={loading}
            >
              Voltar ao Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ForgotPassword() {
  return (
    <Suspense fallback={<div className='auth-page'><div className='auth-card'><p>Carregando...</p></div></div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
