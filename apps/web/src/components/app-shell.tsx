'use client';

import { Activity, BarChart3, Dumbbell, LayoutDashboard, Settings2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const NAV = [
  { href: '/app', label: 'Visão geral', icon: LayoutDashboard, exact: true },
  { href: '/app/treinos', label: 'Treinos', icon: Dumbbell },
  { href: '/app/estatisticas', label: 'Progresso', icon: BarChart3 },
  { href: '/app/perfil', label: 'Perfil', icon: Settings2 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

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
          <span>Treino e alimentação no mesmo ritmo.</span>
        </div>
      </aside>

      <div className="mf-main-column">
        <header className="mf-topbar">
          <div>
            <span className="mf-live-dot" />
            <span>Jornada ativa</span>
          </div>
          <Link href="/app/perfil" className="mf-avatar" aria-label="Abrir perfil">
            FB
          </Link>
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
