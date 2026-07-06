'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearSession } from '../lib/session';

type NavItem = {
  href: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/home', label: 'Início' },
  { href: '/terrenos', label: 'Terrenos' },
  { href: '/salas', label: 'Salas' },
  { href: '/locatarios', label: 'Locatários' },
  { href: '/contratos', label: 'Contratos' }
];

type AppHeaderProps = {
  showLogout?: boolean;
};

export default function AppHeader({ showLogout = true }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    clearSession();
    router.push('/login');
  };

  return (
    <header className='app-header'>
      <div className='app-topbar'>
        <Link href='/home' className='app-brand' aria-label='Felicio e Raitz - Ir para o painel inicial'>
          <img
            src='/logo-holding.png'
            alt='Felicio e Raitz Holding Imobiliária'
            className='app-brand-logo'
          />
        </Link>

        <nav className='app-nav' aria-label='Navegação principal'>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`app-nav-link${isActive ? ' app-nav-link--active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {showLogout && (
          <button type='button' className='app-logout' onClick={logout}>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
              <path
                d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9'
                stroke='currentColor'
                strokeWidth='1.8'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
            Sair
          </button>
        )}
      </div>
    </header>
  );
}
