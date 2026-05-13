'use client';

import { useRouter } from 'next/navigation';

export default function ForgotPassword() {
  const router = useRouter();

  return (
    <div className='auth-page'>
      <div className='auth-card'>
        <h2 className='auth-title'>Esqueceu a senha</h2>
        <p className='auth-subtitle'>Recuperação de senha não implementada. Entre em contato com o administrador ou tente novamente com suas credenciais.</p>
        <button type='button' className='button button-primary' onClick={() => router.push('/login')}>
          Voltar ao login
        </button>
      </div>
    </div>
  );
}
