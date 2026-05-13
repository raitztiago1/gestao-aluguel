'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { clearSession, isSessionValid } from './lib/session';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (isSessionValid()) {
      router.push('/home');
    } else {
      clearSession();
      router.push('/login');
    }
  }, [router]);

  return <div>Redirecionando...</div>;
}
