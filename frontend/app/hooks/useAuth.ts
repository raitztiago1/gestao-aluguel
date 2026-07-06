'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearSession, isSessionValid } from '../lib/session';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export function useAuthGuard(): AuthStatus {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    if (isSessionValid()) {
      setStatus('authenticated');
      return;
    }

    clearSession();
    setStatus('unauthenticated');
    router.replace('/login');
  // router é estável; executar só na montagem evita revalidações em loop no F5
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return status;
}

export function useGuestGuard(): AuthStatus {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    if (isSessionValid()) {
      router.replace('/home');
      return;
    }

    setStatus('unauthenticated');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return status;
}
