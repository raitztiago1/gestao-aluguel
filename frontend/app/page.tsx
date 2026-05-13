'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const logado = localStorage.getItem('logado');
    if (logado === 'true') {
      router.push('/home');
    } else {
      router.push('/login');
    }
  }, [router]);

  return <div>Redirecionando...</div>;
}
