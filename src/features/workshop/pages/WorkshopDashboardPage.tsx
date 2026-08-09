import {
  Layout,
  Button,
  Card,
  CreateWorkshopModal,
  readJsonSafely,
  type CreateWorkshopPayload,
} from '../../../shared';
import { useAuth } from '../../../shared/hooks/useAuth';
import { auth, storage } from '../../../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { getMyDashboard } from '../services/billing.service';

function getLogoButtonLabel(isUploading: boolean, hasLogo: boolean): string {
  if (isUploading) return 'Enviando...';
  if (hasLogo) return '🖼 Trocar logo';
  return '+ Logo';
}

function formatWorkshopDueDate(value: string | undefined): string {
  if (!value) {
    return 'vencimento não definido';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'vencimento não definido';
  }

  return date.toLocaleDateString('pt-BR');
}

function formatWorkshopDueInDays(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '—';
  }

  if (value < 0) {
    return `${Math.abs(value)} em atraso`;
  }

  return `${value} dia(s)`;
}

function formatWorkshopCurrency(value: number | undefined): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);
}

export function WorkshopDashboardPage() {
  const { workshop, refreshWorkshop, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [budgetCount, setBudgetCount] = useState<number | null>(null);
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number | null>(null);

  useEffect(() => {
    if (!workshop) return;
    void getMyDashboard().then((data) => {
      setBudgetCount(data.budgetCount);
      setCustomerCount(data.customerCount);
      setMonthlyRevenue(data.monthlyRevenue);
    }).catch(() => {
      setBudgetCount(0);
      setCustomerCount(0);
      setMonthlyRevenue(0);
    });
  }, [workshop]);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !workshop) return;

    if (!file.type.startsWith('image/')) {
      setLogoError('Apenas imagens são permitidas');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Imagem deve ter no máximo 2 MB');
      return;
    }

    setIsUploadingLogo(true);
    setLogoError('');

    void (async () => {
      try {
        const storageRef = ref(storage, `workshops/${workshop.workshopId}/logo`);
        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);

        const token = await auth.currentUser?.getIdToken();
        const response = await fetch(`/api/workshops/${workshop.workshopId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ logoUrl: downloadUrl }),
        });

        if (!response.ok) {
          throw new Error('Falha ao salvar logo');
        }

        await refreshWorkshop();
      } catch (err) {
        setLogoError(err instanceof Error ? err.message : 'Erro ao enviar logo');
      } finally {
        setIsUploadingLogo(false);
        event.target.value = '';
      }
    })();
  };

  const handleCreateWorkshop = async (data: CreateWorkshopPayload) => {
    setIsCreating(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch('/api/workshops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await readJsonSafely(response);

      if (!response.ok) {
        throw new Error(result?.message || result?.error || 'Erro ao criar oficina');
      }

      if (!result?.data?.workshop) {
        throw new Error('Resposta inválida do servidor ao criar oficina');
      }

    } catch (error) {
      throw error instanceof Error ? error : new Error('Erro ao criar oficina');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Layout title="Painel">
      <div className="space-y-4">
        {/* Loading skeleton — evita flash do estado vazio durante init */}
        {isLoading && (
          <div className="space-y-3">
            <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
            <div className="grid grid-cols-3 gap-3">
              <div className="h-32 animate-pulse rounded-3xl bg-slate-100" />
              <div className="h-32 animate-pulse rounded-3xl bg-slate-100" />
              <div className="h-32 animate-pulse rounded-3xl bg-slate-100" />
            </div>
          </div>
        )}

        {/* Sem oficina */}
        {!isLoading && !workshop && (
          <Card>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-3 text-4xl">🏗️</div>
              <h3 className="mb-1 text-lg font-bold text-slate-900">Nenhuma oficina cadastrada</h3>
              <p className="mb-4 text-sm text-slate-600">Comece criando sua primeira oficina</p>
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                + Nova Oficina
              </Button>
            </div>
          </Card>
        )}

        {/* Cabeçalho da oficina + logo */}
        {!isLoading && workshop && (
          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {workshop.logoUrl ? (
                <img
                  src={workshop.logoUrl}
                  alt={workshop.name}
                  className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-mecfix-navy text-xl font-black text-white">
                  {workshop.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-bold text-slate-900">{workshop.name}</h3>
                <p className="truncate text-xs text-slate-500">{workshop.email}</p>
              </div>

              <label className="cursor-pointer sm:shrink-0">
                <span className={`btn-outline btn-sm inline-flex items-center gap-1 text-xs ${isUploadingLogo ? 'opacity-60 pointer-events-none' : ''}`}>
                  {getLogoButtonLabel(isUploadingLogo, Boolean(workshop.logoUrl))}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleLogoUpload}
                  disabled={isUploadingLogo}
                />
              </label>
            </div>

            {logoError ? (
              <p className="mt-2 text-xs text-red-600">{logoError}</p>
            ) : null}
          </Card>
        )}

        {/* Cards de navegação + stats combinados */}
        {!isLoading && workshop && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => navigate('/workshop/customers')}
              className="group rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-lg">👥</div>
                <span className="text-xs font-semibold text-slate-400 transition-colors group-hover:text-blue-500">Acessar →</span>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Clientes</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{customerCount ?? '…'}</p>
              <div className="mt-3 h-1 w-full rounded-full bg-blue-100">
                <div className="h-1 w-1/3 rounded-full bg-blue-400 transition-all group-hover:w-full" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate('/workshop/budgets')}
              className="group rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-mecfix-orange/50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-mecfix-orange"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-lg">📋</div>
                <span className="text-xs font-semibold text-slate-400 transition-colors group-hover:text-mecfix-orange">Acessar →</span>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Orçamentos</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{budgetCount ?? '…'}</p>
              <div className="mt-3 h-1 w-full rounded-full bg-orange-100">
                <div className="h-1 w-1/3 rounded-full bg-mecfix-orange transition-all group-hover:w-full" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate('/workshop/financials')}
              className="group rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-lg">💰</div>
                <span className="text-xs font-semibold text-slate-400 transition-colors group-hover:text-emerald-600">Acessar →</span>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Faturamento mensal</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {monthlyRevenue === null ? '…' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyRevenue)}
              </p>
              <div className="mt-3 h-1 w-full rounded-full bg-emerald-100">
                <div className="h-1 w-1/3 rounded-full bg-emerald-400 transition-all group-hover:w-full" />
              </div>
            </button>
          </div>
        )}

        {!isLoading && workshop && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                workshop.billingStatus === 'active'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {workshop.billingStatus === 'active' ? 'Paga' : 'Pendente'}
              </span>
              <span className="text-sm font-semibold text-slate-800">{formatWorkshopCurrency(workshop.monthlyFee)}<span className="text-xs font-normal text-slate-400">/mês</span></span>
              <span className="hidden text-slate-300 sm:inline">·</span>
              <span className="hidden text-xs text-slate-500 sm:inline">Dia {workshop.billingDueDay} · vence {formatWorkshopDueDate(workshop.billingDueAt)}</span>
            </div>
            <span className="text-xs text-slate-400 sm:hidden">Vence {formatWorkshopDueDate(workshop.billingDueAt)}</span>
          </div>
        )}
      </div>

      <CreateWorkshopModal
        isOpen={isModalOpen}
        isSubmitting={isCreating}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateWorkshop}
      />
    </Layout>
  );
}
