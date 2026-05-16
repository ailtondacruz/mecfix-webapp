import { useEffect, useState, type ComponentProps } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Layout } from '../../../shared';
import { useAuth } from '../../../shared/hooks/useAuth';
import { auth } from '../../../services/firebase';
import type { Workshop, WorkshopBillingOverview } from '../../../shared';
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
}

interface WorkshopFormState {
  name: string;
  address: string;
  documentType: 'cpf' | 'cnpj';
  documentNumber: string;
  email: string;
  phone: string;
  monthlyFee: string;
  billingDueDay: string;
  ownerName: string;
  ownerEmail: string;
}

const initialFormState: WorkshopFormState = {
  name: '',
  address: '',
  documentType: 'cnpj',
  documentNumber: '',
  email: '',
  phone: '',
  monthlyFee: '0',
  billingDueDay: '10',
  ownerName: '',
  ownerEmail: '',
};

async function getAuthToken(): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Usuário não autenticado');
  }

  return currentUser.getIdToken();
}

function toSafeMessage(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  return fallback;
}

async function readJsonSafely(response: Response): Promise<any> {
  const text = await response.text();

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
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

type CreateWorkshopModalProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WorkshopFormState) => Promise<void>;
  isSubmitting: boolean;
}>;

function CreateWorkshopModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: CreateWorkshopModalProps) {
  const [formState, setFormState] = useState<WorkshopFormState>(initialFormState);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormState(initialFormState);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit: ComponentProps<'form'>['onSubmit'] = (event) => {
    event.preventDefault();
    setError('');

    void (async () => {
      try {
        await onSubmit(formState);
        onClose();
      } catch (submissionError) {
        setError(
          submissionError instanceof Error
            ? submissionError.message
            : 'Erro ao cadastrar a oficina',
        );
      }
    })();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm">
      <Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="section-subtitle">Novo cadastro</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Cadastrar nova oficina</h2>
            <p className="mt-2 text-sm text-slate-600">
              O backend cria a oficina e provisiona o owner inicial com senha temporária.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            Fechar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="workshop-name" className="mb-2 block text-sm font-semibold text-slate-700">Nome da oficina</label>
            <input
              id="workshop-name"
              value={formState.name}
              onChange={(event) => setFormState({ ...formState, name: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
              placeholder="Ex: Mecânica Central"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="workshop-address" className="mb-2 block text-sm font-semibold text-slate-700">Endereço</label>
            <input
              id="workshop-address"
              value={formState.address}
              onChange={(event) => setFormState({ ...formState, address: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
              placeholder="Rua, número, bairro, cidade - UF"
              required
            />
          </div>

          <div>
            <label htmlFor="workshop-document-type" className="mb-2 block text-sm font-semibold text-slate-700">CPF ou CNPJ</label>
            <select
              id="workshop-document-type"
              value={formState.documentType}
              onChange={(event) =>
                setFormState({
                  ...formState,
                  documentType: event.target.value as 'cpf' | 'cnpj',
                })
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
            >
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
            </select>
          </div>

          <div>
            <label htmlFor="workshop-document-number" className="mb-2 block text-sm font-semibold text-slate-700">Número do documento</label>
            <input
              id="workshop-document-number"
              value={formState.documentNumber}
              onChange={(event) => setFormState({ ...formState, documentNumber: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
              placeholder="Somente números"
              required
            />
          </div>

          <div>
            <label htmlFor="workshop-email" className="mb-2 block text-sm font-semibold text-slate-700">E-mail da oficina</label>
            <input
              id="workshop-email"
              type="email"
              value={formState.email}
              onChange={(event) => setFormState({ ...formState, email: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
              placeholder="contato@oficina.com"
              required
            />
          </div>

          <div>
            <label htmlFor="workshop-phone" className="mb-2 block text-sm font-semibold text-slate-700">Telefone</label>
            <input
              id="workshop-phone"
              value={formState.phone}
              onChange={(event) => setFormState({ ...formState, phone: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <label htmlFor="workshop-monthly-fee" className="mb-2 block text-sm font-semibold text-slate-700">Valor mensal</label>
            <input
              id="workshop-monthly-fee"
              type="number"
              min="0"
              step="0.01"
              value={formState.monthlyFee}
              onChange={(event) => setFormState({ ...formState, monthlyFee: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
              placeholder="99.90"
              required
            />
          </div>

          <div>
            <label htmlFor="workshop-billing-due-day" className="mb-2 block text-sm font-semibold text-slate-700">Dia do vencimento</label>
            <input
              id="workshop-billing-due-day"
              type="number"
              min="1"
              max="28"
              step="1"
              value={formState.billingDueDay}
              onChange={(event) => setFormState({ ...formState, billingDueDay: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
              placeholder="10"
              required
            />
          </div>

          <div className="md:col-span-2 mt-2 border-t border-slate-200 pt-4">
            <p className="section-subtitle">Responsável inicial</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">Owner da oficina</h3>
          </div>

          <div>
            <label htmlFor="owner-name" className="mb-2 block text-sm font-semibold text-slate-700">Nome do owner</label>
            <input
              id="owner-name"
              value={formState.ownerName}
              onChange={(event) => setFormState({ ...formState, ownerName: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
              placeholder="Nome completo"
              required
            />
          </div>

          <div>
            <label htmlFor="owner-email" className="mb-2 block text-sm font-semibold text-slate-700">E-mail do owner</label>
            <input
              id="owner-email"
              type="email"
              value={formState.ownerEmail}
              onChange={(event) => setFormState({ ...formState, ownerEmail: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
              placeholder="proprietario@oficina.com"
              required
            />
          </div>

          {error ? (
            <div className="md:col-span-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          <div className="md:col-span-2 flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Cadastrar oficina
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
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

  useEffect(() => {
    void loadBillingOverview();
  }, []);

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

  async function handleCreateWorkshop(formState: WorkshopFormState) {
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
          monthlyFee: Number(formState.monthlyFee),
          billingDueDay: Number(formState.billingDueDay),
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
            <p>Senha temporária: {ownerCredentials.temporaryPassword}</p>
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
