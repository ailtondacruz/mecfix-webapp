import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  CreateWorkshopModal,
  getAuthToken,
  Layout,
  readJsonSafely,
  type CreateWorkshopPayload,
  type Workshop,
  type WorkshopBillingOverview,
} from '../../../shared';
import { useAuth } from '../../../shared/hooks/useAuth';
import { getBillingOverview } from '../services/billing.service';

interface WorkshopOwnerCredentials {
  userId: string;
  name: string;
  email: string;
  role: 'owner';
  temporaryPassword: string;
}

interface CreateWorkshopResponse {
  success: boolean;
  data: {
    workshop: Workshop;
    owner: WorkshopOwnerCredentials;
  };
  message?: string;
  error?: string;
}

function toSafeMessage(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  return fallback;
}

function formatBRL(value: number | undefined): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);
}

function formatBillingDate(value: string | undefined): string {
  if (!value) {
    return 'Não definido';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Não definido';
  }

  return date.toLocaleDateString('pt-BR');
}

function maskTemporaryPassword(password: string): string {
  if (!password) {
    return '';
  }

  return `${password.slice(0, 2)}******`;
}

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [billingOverview, setBillingOverview] = useState<WorkshopBillingOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ownerCredentials, setOwnerCredentials] = useState<WorkshopOwnerCredentials | null>(null);
  const [loadError, setLoadError] = useState('');
  const [isOwnerPasswordVisible, setIsOwnerPasswordVisible] = useState(false);
  const [isOwnerPasswordCopied, setIsOwnerPasswordCopied] = useState(false);

  useEffect(() => {
    void loadBillingOverview();
  }, []);

  useEffect(() => {
    setIsOwnerPasswordVisible(false);
    setIsOwnerPasswordCopied(false);
  }, [ownerCredentials?.userId]);

  async function loadBillingOverview() {
    setIsLoading(true);
    setLoadError('');

    try {
      const overview = await getBillingOverview();
      setBillingOverview(overview);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Falha ao carregar assinaturas');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateWorkshop(formState: CreateWorkshopPayload) {
    setIsCreating(true);
    setLoadError('');

    try {
      const token = await getAuthToken();
      const response = await fetch('/api/workshops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formState,
        }),
      });

      const payload = await readJsonSafely(response) as CreateWorkshopResponse | null;

      if (!response.ok) {
        throw new Error(
          toSafeMessage(payload?.message || payload?.data || payload?.error, 'Erro ao cadastrar a oficina'),
        );
      }

      if (!payload?.data?.workshop || !payload?.data?.owner) {
        throw new Error('Resposta inválida do servidor ao cadastrar a oficina');
      }

      setOwnerCredentials(payload.data.owner);
      await loadBillingOverview();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao cadastrar a oficina';
      setLoadError(message);
      throw new Error(message);
    } finally {
      setIsCreating(false);
    }
  }

  function getBillingStateLabel(state: WorkshopBillingOverview['workshops'][number]['billingState']): string {
    if (state === 'due_soon') return 'A vencer';
    if (state === 'overdue') return 'Vencida';
    if (state === 'pending') return 'Pendente';
    if (state === 'suspended') return 'Suspensa';
    return 'Paga';
  }

  async function copyTemporaryPassword(): Promise<void> {
    if (!ownerCredentials?.temporaryPassword) {
      return;
    }

    try {
      await navigator.clipboard.writeText(ownerCredentials.temporaryPassword);
      setIsOwnerPasswordCopied(true);
      globalThis.setTimeout(() => setIsOwnerPasswordCopied(false), 2500);
    } catch {
      setLoadError('Nao foi possivel copiar a senha. Copie manualmente.');
    }
  }

  return (
    <Layout
      title="Painel Administrativo"
      rightContent={
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white/90 px-4 py-2 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-mecfix-orange text-sm font-bold text-white">
            {(user?.name || 'Admin')
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part.charAt(0).toUpperCase())
              .join('') || 'AU'}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-900">{user?.name || 'Admin User'}</p>
            <p className="text-xs text-slate-500">{user?.email || 'root@mecfix.local'}</p>
          </div>
        </div>
      }
    >
      <div className="page-grid mb-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        <Card className="stat-card border-l-4 border-l-mecfix-navy">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="stat-label">Oficinas Cadastradas</p>
              <h3 className="stat-value mt-2">{isLoading ? '...' : billingOverview?.summary.total ?? 0}</h3>
            </div>
            <span className="rounded-2xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              Live
            </span>
          </div>
        </Card>

        <Card className="stat-card border-l-4 border-l-mecfix-orange">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="stat-label">Faturamento Mês</p>
              <h3 className="stat-value mt-2 text-mecfix-orange">R$ 0</h3>
            </div>
            <span className="rounded-2xl bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
              Financeiro
            </span>
          </div>
        </Card>

        <Card className="stat-card border-l-4 border-l-rose-500">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="stat-label">Taxa Cancelamento</p>
              <h3 className="stat-value mt-2 text-rose-600">0%</h3>
            </div>
            <span className="rounded-2xl bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
              Alerta
            </span>
          </div>
        </Card>

        <Card className="stat-card border-l-4 border-l-emerald-500">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="stat-label">Novas Assinaturas</p>
              <h3 className="stat-value mt-2 text-emerald-600">0</h3>
            </div>
            <span className="rounded-2xl bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
              Crescimento
            </span>
          </div>
        </Card>
      </div>

      <Card title="Assinaturas">
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{billingOverview?.summary.total ?? '...'}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Pagas</p>
            <p className="mt-2 text-2xl font-bold text-emerald-700">{billingOverview?.summary.paid ?? '...'}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">A vencer</p>
            <p className="mt-2 text-2xl font-bold text-amber-700">{billingOverview?.summary.dueSoon ?? '...'}</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">Vencidas</p>
            <p className="mt-2 text-2xl font-bold text-rose-700">{billingOverview?.summary.overdue ?? '...'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Suspensas</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{billingOverview?.summary.suspended ?? '...'}</p>
          </div>
        </div>
      </Card>

      <Card title="Gestão de Oficinas">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="section-subtitle">Cadastre oficinas e clique em uma linha para abrir os detalhes completos.</p>
          </div>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            + Nova Oficina
          </Button>
        </div>

        {loadError ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {loadError}
          </div>
        ) : null}

        {ownerCredentials ? (
          <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
            <p className="font-semibold">Owner criado com sucesso</p>
            <p className="mt-2">E-mail: {ownerCredentials.email}</p>
            <p>
              Senha temporaria:{' '}
              <strong>
                {isOwnerPasswordVisible
                  ? ownerCredentials.temporaryPassword
                  : maskTemporaryPassword(ownerCredentials.temporaryPassword)}
              </strong>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOwnerPasswordVisible((current) => !current)}
              >
                {isOwnerPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void copyTemporaryPassword()}
              >
                {isOwnerPasswordCopied ? 'Senha copiada' : 'Copiar senha'}
              </Button>
            </div>
            <p className="mt-2 text-xs text-emerald-700">
              Anote essa senha agora. Depois, o owner deve trocar no primeiro acesso.
            </p>
          </div>
        ) : null}

        {!billingOverview?.workshops?.length && !isLoading ? (
          <div className="empty-state">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
              <span className="text-2xl">🏁</span>
            </div>
            <p className="text-lg font-semibold text-slate-900">Nenhuma oficina cadastrada ainda.</p>
            <p className="mt-2 text-sm text-slate-600">
              Clique em Nova Oficina para criar a primeira unidade e gerar o owner inicial.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90">
            <div className="hidden grid-cols-5 gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 lg:grid">
              <span>Oficina</span>
              <span>Contato</span>
              <span>Mensalidade</span>
              <span>Vencimento</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-slate-100">
              {(billingOverview?.workshops ?? []).map((workshop) => (
                <button
                  key={workshop.workshopId}
                  type="button"
                  onClick={() => navigate(`/admin/workshops/${workshop.workshopId}`)}
                  className="grid w-full grid-cols-1 gap-2 px-4 py-4 text-left transition hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50 lg:grid-cols-5 lg:items-center lg:gap-4"
                >
                  <div>
                    <p className="text-base font-semibold text-slate-900">{workshop.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500 lg:hidden">Oficina</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-700">{workshop.email}</p>
                    <p className="text-xs text-slate-500 lg:hidden">Contato</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{formatBRL(workshop.monthlyFee)}</p>
                    <p className="text-xs text-slate-500 lg:hidden">Mensalidade</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-700">{formatBillingDate(workshop.billingDueAt)}</p>
                    <p className="text-xs text-slate-500 lg:hidden">Vencimento</p>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="soft-chip">{getBillingStateLabel(workshop.billingState)}</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 lg:hidden">Abrir</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      <CreateWorkshopModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateWorkshop}
        isSubmitting={isCreating}
      />
    </Layout>
  );
}
