import {
  Layout,
  Button,
  Card,
  CreateWorkshopModal,
  readJsonSafely,
  type CreateWorkshopPayload,
  type WorkshopBillingDetails,
  type WorkshopBillingInstallment,
} from '../../../shared';
import { useAuth } from '../../../shared/hooks/useAuth';
import { auth, storage } from '../../../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { listBudgets } from '../budgets/services/budgets.service';
import { listCustomers } from '../customers/services/customers.service';
import { getMonthlyRevenue } from '../financials/services/financials.service';
import { getMyBilling, getMyInstallments } from '../services/billing.service';

function getLogoButtonLabel(isUploading: boolean, hasLogo: boolean): string {
  if (isUploading) return 'Enviando...';
  if (hasLogo) return '🖼 Trocar logo';
  return '+ Logo';
}

function formatWorkshopBillingDate(value: string | undefined): string {
  if (!value) {
    return 'Sem pagamento registrado';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Data indisponível';
  }

  return date.toLocaleDateString('pt-BR');
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
  const { workshop, refreshWorkshop } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [budgetCount, setBudgetCount] = useState<number | null>(null);
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number | null>(null);
  const [billingDetails, setBillingDetails] = useState<WorkshopBillingDetails | null>(null);
  const [installments, setInstallments] = useState<WorkshopBillingInstallment[]>([]);

  useEffect(() => {
    if (!workshop) return;
    void listBudgets().then((list) => setBudgetCount(list.length)).catch(() => setBudgetCount(0));
    void listCustomers().then((list) => setCustomerCount(list.length)).catch(() => setCustomerCount(0));
    const now = new Date();
    void getMonthlyRevenue(now.getFullYear(), now.getMonth() + 1).then((value) => setMonthlyRevenue(value)).catch(() => setMonthlyRevenue(0));
    void getMyBilling().then((data) => setBillingDetails(data)).catch(() => setBillingDetails(null));
    void getMyInstallments().then((data) => setInstallments(data)).catch(() => setInstallments([]));
  }, [workshop]);

  function getBillingLabel(state: WorkshopBillingDetails['workshop']['billingState']): string {
    if (state === 'due_soon') return 'A vencer';
    if (state === 'overdue') return 'Vencida';
    if (state === 'pending') return 'Pendente';
    if (state === 'suspended') return 'Suspensa';
    return 'Paga';
  }

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
        {/* Sem oficina */}
        {!workshop && (
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
        {workshop && (
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

        {/* Stats */}
        {workshop && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card className="space-y-1">
              <p className="text-xs font-semibold uppercase text-slate-500">Clientes</p>
              <p className="text-2xl font-bold text-slate-900">{customerCount ?? '…'}</p>
              <div className="h-1 w-full rounded-full bg-blue-500/20" />
            </Card>

            <Card className="space-y-1">
              <p className="text-xs font-semibold uppercase text-slate-500">Orçamentos</p>
              <p className="text-2xl font-bold text-slate-900">{budgetCount ?? '…'}</p>
              <div className="h-1 w-full rounded-full bg-orange-500/20" />
            </Card>

            <Card className="space-y-1">
              <p className="text-xs font-semibold uppercase text-slate-500">Faturamento mensal</p>
              <p className="text-xl font-bold text-slate-900">
                {monthlyRevenue === null
                  ? '…'
                  : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyRevenue)}
              </p>
              <div className="h-1 w-full rounded-full bg-purple-500/20" />
            </Card>
          </div>
        )}

        {/* Navegação */}
        {workshop && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card className="cursor-pointer transition-all hover:border-mecfix-orange hover:shadow-lg" onClick={() => navigate('/workshop/customers')}>
              <div className="text-center">
                <div className="mb-2 text-2xl">👥</div>
                <h4 className="text-sm font-semibold text-slate-900">Clientes</h4>
                <p className="text-xs text-slate-500">Gerenciar</p>
              </div>
            </Card>

            <Card className="cursor-pointer transition-all hover:border-mecfix-orange hover:shadow-lg" onClick={() => navigate('/workshop/budgets')}>
              <div className="text-center">
                <div className="mb-2 text-2xl">📋</div>
                <h4 className="text-sm font-semibold text-slate-900">Orçamentos</h4>
                <p className="text-xs text-slate-500">PDF e WhatsApp</p>
              </div>
            </Card>

            <Card className="cursor-pointer transition-all hover:border-mecfix-orange hover:shadow-lg" onClick={() => navigate('/workshop/financials')}>
              <div className="text-center">
                <div className="mb-2 text-2xl">💰</div>
                <h4 className="text-sm font-semibold text-slate-900">Financeiro</h4>
                <p className="text-xs text-slate-500">Ver finanças</p>
              </div>
            </Card>
          </div>
        )}

        {workshop && (
          <Card title="Minha assinatura">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status atual</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-mecfix-orange px-3 py-1 text-xs font-semibold text-white">
                  {billingDetails ? getBillingLabel(billingDetails.workshop.billingState) : '...'}
                </span>
                <span className="text-sm text-slate-600">
                  Vencimento em {billingDetails ? formatWorkshopDueDate(billingDetails.workshop.billingDueAt) : '...'}
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-700">
                Mensalidade: <strong>{formatWorkshopCurrency(workshop.monthlyFee)}</strong>
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Dia do vencimento: <strong>todo dia {billingDetails?.workshop.billingDueDay ?? workshop.billingDueDay ?? 10}</strong>
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Último pagamento: <strong>{formatWorkshopBillingDate(billingDetails?.workshop.lastPaymentAt)}</strong>
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Dias para vencer: <strong>{formatWorkshopDueInDays(billingDetails?.workshop.dueInDays)}</strong>
              </p>
            </div>
          </Card>
        )}

        {workshop && (
          <Card title="Parcelas mensais">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
              <div className="hidden grid-cols-5 gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 sm:grid">
                <span>Parcela</span>
                <span>Vencimento</span>
                <span>Valor</span>
                <span>Status</span>
                <span>Pagamento</span>
              </div>
              <div className="divide-y divide-slate-100">
                {installments.map((installment) => (
                  <div key={installment.periodKey} className="grid grid-cols-1 gap-3 px-4 py-4 text-sm sm:grid-cols-5 sm:items-center sm:gap-4">
                    <p className="font-semibold text-slate-900">Parcela {installment.periodKey}</p>
                    <p><span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 sm:hidden">Vencimento: </span>{formatWorkshopDueDate(installment.dueAt)}</p>
                    <p><span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 sm:hidden">Valor: </span>{formatWorkshopCurrency(installment.amount)}</p>
                    <p><span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 sm:hidden">Status: </span>{installment.statusLabel ?? installment.status}</p>
                    <p><span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 sm:hidden">Pagamento: </span>{installment.paidAt ? formatWorkshopBillingDate(installment.paidAt) : 'Não pago'}</p>
                  </div>
                ))}
                {installments.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-slate-500">Nenhuma parcela registrada ainda.</div>
                ) : null}
              </div>
            </div>
          </Card>
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
