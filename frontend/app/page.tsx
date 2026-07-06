'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { clearSession, isSessionValid } from './lib/session';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (isSessionValid()) {
      router.replace('/home');
    } else {
      clearSession();
      router.replace('/login');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div>Redirecionando...</div>;
}
