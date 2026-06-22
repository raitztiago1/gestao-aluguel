'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import ErrorAlert from '../components/ErrorAlert';
import { register } from '../lib/api';
import { createSession } from '../lib/session';

export default function Register() {
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      // Validações
      const trimmedEmail = email.trim();
      const trimmedNome = nomeCompleto.trim();

      if (!trimmedNome || !trimmedEmail || !senha || !confirmarSenha) {
        setErro('Por favor, preencha todos os campos');
        setEmailError('');
        setLoading(false);
        return;
      }

      if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
        setErro('Por favor, insira um email válido');
        setEmailError('O email informado parece estar incorreto. Verifique o formato e tente novamente.');
        setLoading(false);
        return;
      }

      if (trimmedNome.length < 3) {
        setErro('O nome completo deve ter pelo menos 3 caracteres');
        setLoading(false);
        return;
      }

      const passwordValidation = validatePassword(senha);
      if (!passwordValidation.valid) {
        setErro(passwordValidation.message);
        setLoading(false);
        return;
      }

      if (senha !== confirmarSenha) {
        setErro('As senhas não correspondem');
        setEmailError('');
        setLoading(false);
        return;
      }

      const response = await register(trimmedEmail, senha, trimmedNome);
      
      createSession(response);
      router.push('/home');
    } catch (err: any) {
      const mensagem = err?.message || 'Erro ao cadastrar. Tente novamente.';
      setErro(mensagem);
      setLoading(false);
    }
  };

  return (
    <div className='auth-page'>
      <div className='auth-card'>
        <h2 className='auth-title'>Cadastrar</h2>
        <p className='auth-subtitle'>Crie sua conta para acessar o sistema de gestão de aluguel.</p>

        {erro && <ErrorAlert title='Erro no cadastro' message={erro} onDismiss={() => setErro('')} />}

        <form onSubmit={handleSubmit} className='form-grid'>
          <div className='form-group'>
            <label>Nome Completo</label>
            <input
              className='input-field'
              type='text'
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              required
              disabled={loading}
              placeholder='Ex: João Silva'
            />
          </div>

          <div className='form-group'>
            <label>Email</label>
            {emailError && <span className='field-error'>{emailError}</span>}
            <input
              className={`input-field${emailError ? ' invalid' : ''}`}
              type='email'
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              required
              disabled={loading}
              placeholder='seu@email.com'
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
              disabled={loading}
              placeholder='Repita a senha'
            />
          </div>

          <button type='submit' className='button button-primary' disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
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
