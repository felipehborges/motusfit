'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  BarChart3,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Settings2,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { signOut, useSession } from '@/lib/auth-client';
import { DEMO_MODE } from '@/lib/mock-api';

const NAV = [
  { href: '/app', label: 'Visão geral', icon: LayoutDashboard, exact: true },
  { href: '/app/treinos', label: 'Treinos', icon: Dumbbell },
  { href: '/app/estatisticas', label: 'Progresso', icon: BarChart3 },
  { href: '/app/perfil', label: 'Perfil', icon: Settings2 },
];

export function AppShell({ children }: { children: ReactNode }) {
  if (DEMO_MODE) return <ShellLayout userName="Demonstração">{children}</ShellLayout>;
  return <AuthenticatedAppShell>{children}</AuthenticatedAppShell>;
}

function AuthenticatedAppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  useEffect(() => {
    if (!session.isPending && !session.data) router.replace('/login');
  }, [router, session.data, session.isPending]);

  if (session.isPending) return <p className="mf-loading">Verificando sua sessão…</p>;
  if (!session.data) return <p className="mf-loading">Redirecionando para entrar…</p>;

  async function handleSignOut() {
    if (isSigningOut) return;

    setIsSigningOut(true);
    setSignOutError(null);

    try {
      const result = await signOut();

      if (result.error) {
        setSignOutError('Não foi possível sair. Tente novamente.');
        setIsSigningOut(false);
        return;
      }

      queryClient.clear();
      window.location.replace('/login');
    } catch {
      setSignOutError('Não foi possível sair. Verifique sua conexão e tente novamente.');
      setIsSigningOut(false);
    }
  }

  return (
    <ShellLayout
      userName={session.data.user.name}
      onSignOut={handleSignOut}
      isSigningOut={isSigningOut}
      signOutError={signOutError}
    >
      {children}
    </ShellLayout>
  );
}

function ShellLayout({
  children,
  userName,
  onSignOut,
  isSigningOut = false,
  signOutError,
}: {
  children: ReactNode;
  userName: string;
  onSignOut?: (() => Promise<void>) | undefined;
  isSigningOut?: boolean;
  signOutError?: string | null;
}) {
  const pathname = usePathname();
  const initials =
    userName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'MF';

  return (
    <div className="mf-shell">
      <aside className="mf-sidebar">
        <Link className="mf-brand" href="/app" aria-label="MotusFit — início">
          <span className="mf-brand-mark">
            <Activity size={22} strokeWidth={2.6} />
          </span>
          <span>
            <b>MOTUS</b>
            <em>FIT</em>
          </span>
        </Link>

        <div className="mf-sidebar-label">Seu espaço</div>
        <nav className="mf-nav" aria-label="Navegação principal">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={active ? 'active' : ''}>
                <Icon size={19} strokeWidth={2.1} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mf-coach-card">
          <span className="mf-coach-icon">
            <Sparkles size={18} />
          </span>
          <p className="mf-eyebrow">Consistência</p>
          <strong>Um passo por dia.</strong>
          <span>Treine com intenção, evolua com consistência.</span>
        </div>
      </aside>

      <div className="mf-main-column">
        <header className="mf-topbar">
          <div>
            <span className="mf-live-dot" />
            <span>Jornada ativa</span>
          </div>
          <div className="mf-account-actions">
            {signOutError && (
              <p className="mf-signout-error" role="alert">
                {signOutError}
              </p>
            )}
            <span>{userName}</span>
            <Link href="/app/perfil" className="mf-avatar" aria-label="Abrir perfil">
              {initials}
            </Link>
            {onSignOut && (
              <button
                type="button"
                className="mf-signout"
                onClick={onSignOut}
                disabled={isSigningOut}
                aria-busy={isSigningOut}
              >
                <LogOut size={15} /> <span>{isSigningOut ? 'Saindo…' : 'Sair'}</span>
              </button>
            )}
          </div>
        </header>
        <main className="mf-content">{children}</main>
      </div>

      <nav className="mf-mobile-nav" aria-label="Navegação móvel">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={active ? 'active' : ''}>
              <Icon size={20} strokeWidth={2.1} />
              <span>{label === 'Visão geral' ? 'Hoje' : label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
