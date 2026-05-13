'use client';

import { useRouter } from 'next/navigation';

export default function Register() {
  const router = useRouter();

  return (
    <div className='auth-page'>
      <div className='auth-card'>
        <h2 className='auth-title'>Cadastrar</h2>
        <p className='auth-subtitle'>Cadastro não implementado ainda. Use o login existente ou volte para a tela de autenticação.</p>
        <button type='button' className='button button-primary' onClick={() => router.push('/login')}>
          Voltar ao login
        </button>
      </div>
    </div>
  );
}
