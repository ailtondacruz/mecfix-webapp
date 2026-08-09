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
  const { isAuthenticated, logout, workshop, user } = useAuth();
  const isBillingBlocked = workshop?.status === 'blocked';

  const userInitials = (user?.name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('') || 'U';

  let billingLabel = '';
  if (workshop?.billingStatus === 'pending') {
    billingLabel = 'Pagamento pendente';
  } else if (workshop?.billingStatus === 'overdue') {
    billingLabel = 'Pagamento em atraso';
  } else if (workshop?.billingStatus === 'suspended') {
    billingLabel = 'Oficina suspensa';
  }

  const handleLogout = () => {
    void (async () => {
      await logout();
      navigate('/auth/login', { replace: true });
    })();
  };

  return (
    <div className="app-shell">
      <div className="app-frame">
        <header className="sticky top-0 z-50 mb-4 -mx-3 border-b border-slate-200 bg-white/97 px-3 py-3 shadow-sm backdrop-blur sm:-mx-4 sm:px-4 lg:-mx-8 lg:px-8">
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
              {user ? (
                <div className="hidden items-center gap-2.5 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 shadow-sm sm:flex">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-mecfix-orange text-xs font-bold text-white">
                    {userInitials}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold leading-tight text-slate-900">{user.name}</p>
                    <p className="text-[11px] leading-tight text-slate-400">{user.email}</p>
                  </div>
                </div>
              ) : null}
              {isAuthenticated ? (
                <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
                  Sair
                </Button>
              ) : null}
            </div>
          </div>
        </header>

        {isBillingBlocked ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{billingLabel || 'Acesso temporariamente bloqueado'}</p>
                <p className="text-xs text-amber-800">
                  As funcionalidades estão desativadas até a regularização do pagamento da oficina.
                </p>
              </div>
              <span className="inline-flex self-start rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                somente consulta
              </span>
            </div>
          </div>
        ) : null}

        <main className="pb-6">{children}</main>
      </div>
    </div>
  );
}
