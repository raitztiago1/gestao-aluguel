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
  title: string;
  subtitle?: string;
  showLogout?: boolean;
};

export default function AppHeader({ title, subtitle, showLogout = true }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    clearSession();
    router.push('/login');
  };

  const breadcrumb =
    pathname === '/home'
      ? [{ label: 'Painel', href: '/home' }]
      : [
          { label: 'Início', href: '/home' },
          { label: title, href: pathname }
        ];

  return (
    <header className='app-header'>
      <div className='app-topbar'>
        <Link href='/home' className='app-brand' aria-label='Ir para o painel inicial'>
          <span className='app-brand-icon' aria-hidden='true'>
            <svg width='22' height='22' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <path
                d='M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z'
                stroke='currentColor'
                strokeWidth='1.8'
                strokeLinejoin='round'
              />
            </svg>
          </span>
          <span className='app-brand-text'>
            <span className='app-brand-name'>Gestão de Aluguel</span>
            <span className='app-brand-tagline'>Holding imobiliária</span>
          </span>
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

      <div className='app-hero'>
        <nav className='app-breadcrumb' aria-label='Você está em'>
          {breadcrumb.map((item, index) => (
            <span key={item.href} className='app-breadcrumb-item'>
              {index > 0 && <span className='app-breadcrumb-separator' aria-hidden='true'>/</span>}
              {index === breadcrumb.length - 1 ? (
                <span className='app-breadcrumb-current'>{item.label}</span>
              ) : (
                <Link href={item.href}>{item.label}</Link>
              )}
            </span>
          ))}
        </nav>
        <h1 className='app-hero-title'>{title}</h1>
        {subtitle && <p className='app-hero-subtitle'>{subtitle}</p>}
      </div>
    </header>
  );
}
