import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from './Button';

interface LayoutProps {
  readonly children: React.ReactNode;
  readonly title?: string;
  readonly rightContent?: React.ReactNode;
  readonly backTo?: string;
}

export function Layout({ children, title, rightContent, backTo }: LayoutProps) {
  const navigate = useNavigate();
  const { isAuthenticated, logout, workshop } = useAuth();

  const handleLogout = () => {
    void (async () => {
      await logout();
      navigate('/auth/login', { replace: true });
    })();
  };

  return (
    <div className="app-shell">
      <div className="app-frame">
        <header className="sticky top-0 z-50 mb-4 border-b border-slate-200 bg-white/97 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {backTo ? (
                <button
                  type="button"
                  onClick={() => navigate(backTo)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                  aria-label="Voltar"
                >
                  ←
                </button>
              ) : null}

              {workshop?.logoUrl ? (
                <img
                  src={workshop.logoUrl}
                  alt={workshop.name}
                  className="h-9 w-9 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mecfix-navy text-sm font-black text-white">
                  MF
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {workshop?.name ?? 'MecFix'}
                </p>
                {title ? (
                  <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">{title}</h1>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {rightContent}
              {isAuthenticated ? (
                <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
                  Sair
                </Button>
              ) : null}
            </div>
          </div>
        </header>

        <main className="pb-6">{children}</main>
      </div>
    </div>
  );
}
