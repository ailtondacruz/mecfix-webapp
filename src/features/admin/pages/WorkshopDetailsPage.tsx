import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Layout, maskPhone, unmaskNumber } from '../../../shared';
import type { WorkshopBillingDetails, WorkshopBillingView } from '../../../shared';
import {
  deleteWorkshop,
  getWorkshopBillingDetails,
  markAsPaid,
  markAsUnpaid,
  resetOwnerPassword,
  updateWorkshop,
  type UpdateWorkshopPayload,
} from '../services/billing.service';

function formatBRL(value: number | undefined): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);
}

function formatDate(value: string | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR');
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  active:    { label: 'Ativa',     cls: 'bg-emerald-100 text-emerald-700' },
  blocked:   { label: 'Bloqueada', cls: 'bg-amber-100 text-amber-700' },
  deleted:   { label: 'Excluída',  cls: 'bg-red-100 text-red-700' },
};
const BILLING_CONFIG: Record<string, { label: string; cls: string }> = {
  paid:      { label: 'Em dia',   cls: 'bg-emerald-100 text-emerald-700' },
  due_soon:  { label: 'A vencer', cls: 'bg-amber-100 text-amber-700' },
  overdue:   { label: 'Vencida',  cls: 'bg-red-100 text-red-700' },
  pending:   { label: 'Pendente', cls: 'bg-slate-100 text-slate-600' },
  suspended: { label: 'Suspensa', cls: 'bg-rose-100 text-rose-700' },
};

interface WorkshopViewProps {
  workshop: WorkshopBillingView;
  ownerEmail: string;
  isResettingPassword: boolean;
  isDeleting: boolean;
  isBillingLoading: boolean;
  onEdit: () => void;
  onResetPassword: () => void;
  onDelete: () => void;
  onMarkAsPaid: () => void;
  onMarkAsUnpaid: () => void;
}

function WorkshopView({ workshop, ownerEmail, isResettingPassword, isDeleting, isBillingLoading, onEdit, onResetPassword, onDelete, onMarkAsPaid, onMarkAsUnpaid }: Readonly<WorkshopViewProps>) {
  const statusInfo = STATUS_CONFIG[workshop.status] ?? { label: workshop.status, cls: 'bg-slate-100 text-slate-600' };
  const billingInfo = BILLING_CONFIG[workshop.billingState] ?? { label: workshop.billingState, cls: 'bg-slate-100 text-slate-600' };
  const infoCell = 'rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3';
  const isPaid = workshop.billingState === 'paid' || workshop.billingState === 'due_soon';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {workshop.documentType.toUpperCase()} {workshop.documentNumber}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{workshop.name}</h1>
        </div>
        <div className="flex gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.cls}`}>{statusInfo.label}</span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${billingInfo.cls}`}>{billingInfo.label}</span>
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Dados cadastrais</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className={infoCell}>
            <p className="text-xs text-slate-400">Endereço</p>
            <p className="mt-0.5 text-sm font-medium text-slate-800">{workshop.address || '—'}</p>
          </div>
          <div className={infoCell}>
            <p className="text-xs text-slate-400">E-mail</p>
            <p className="mt-0.5 text-sm font-medium text-slate-800">{workshop.email}</p>
          </div>
          <div className={infoCell}>
            <p className="text-xs text-slate-400">Telefone</p>
            <p className="mt-0.5 text-sm font-medium text-slate-800">{workshop.phone || '—'}</p>
          </div>
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Financeiro</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className={infoCell}>
            <p className="text-xs text-slate-400">Mensalidade</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">{formatBRL(workshop.monthlyFee)}</p>
          </div>
          <div className={infoCell}>
            <p className="text-xs text-slate-400">Dia de vencimento</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">Dia {workshop.billingDueDay}</p>
          </div>
          <div className={infoCell}>
            <p className="text-xs text-slate-400">Próximo vencimento</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">{formatDate(workshop.billingDueAt)}</p>
          </div>
          <div className={infoCell}>
            <p className="text-xs text-slate-400">Último pagamento</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">{formatDate(workshop.lastPaymentAt)}</p>
          </div>
        </div>
      </div>

      <div className={infoCell}>
        <p className="text-xs text-slate-400">Login do owner</p>
        <p className="mt-0.5 text-sm font-medium text-slate-800">{ownerEmail || '—'}</p>
      </div>

      {/* Toggle de assinatura */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
        <div>
          <p className="text-xs text-slate-400">Assinatura</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-800">
            {isPaid ? 'Paga — acesso ativo' : 'Não paga — acesso bloqueado'}
          </p>
        </div>
        {isPaid ? (
          <Button type="button" variant="outline" size="sm" onClick={onMarkAsUnpaid} isLoading={isBillingLoading}
            className="border-amber-300 text-amber-700 hover:bg-amber-50 shrink-0">
            Marcar não paga
          </Button>
        ) : (
          <Button type="button" variant="primary" size="sm" onClick={onMarkAsPaid} isLoading={isBillingLoading}
            className="shrink-0">
            Marcar como paga
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <Button type="button" variant="outline" size="sm" onClick={onEdit}>
          Editar dados
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onResetPassword} isLoading={isResettingPassword}>
          Resetar senha do owner
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onDelete} isLoading={isDeleting} className="border-red-300 text-red-600 hover:bg-red-50">
          Excluir oficina
        </Button>
      </div>
    </div>
  );
}

interface WorkshopEditFormProps {
  form: UpdateWorkshopPayload;
  isUpdating: boolean;
  onChange: (form: UpdateWorkshopPayload) => void;
  onSave: () => void;
  onCancel: () => void;
}

function WorkshopEditForm({ form, isUpdating, onChange, onSave, onCancel }: Readonly<WorkshopEditFormProps>) {
  const inputCls = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20';
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="edit-name" className="mb-1.5 block text-xs font-semibold text-slate-600">Nome da oficina</label>
          <input id="edit-name" className={inputCls} value={form.name ?? ''} onChange={(e) => onChange({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label htmlFor="edit-email" className="mb-1.5 block text-xs font-semibold text-slate-600">E-mail</label>
          <input id="edit-email" type="email" className={inputCls} value={form.email ?? ''} onChange={(e) => onChange({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label htmlFor="edit-phone" className="mb-1.5 block text-xs font-semibold text-slate-600">Telefone</label>
          <input
            id="edit-phone"
            inputMode="numeric"
            className={inputCls}
            placeholder="(11) 99999-9999"
            value={form.phone ?? ''}
            onChange={(e) => onChange({ ...form, phone: maskPhone(e.target.value) })}
          />
        </div>
        <div>
          <label htmlFor="edit-status" className="mb-1.5 block text-xs font-semibold text-slate-600">Status</label>
          <select id="edit-status" className={inputCls} value={form.status ?? 'active'} onChange={(e) => onChange({ ...form, status: e.target.value as 'active' | 'blocked' })}>
            <option value="active">Ativa</option>
            <option value="blocked">Bloqueada</option>
          </select>
        </div>
        <div>
          <label htmlFor="edit-monthly-fee" className="mb-1.5 block text-xs font-semibold text-slate-600">Mensalidade</label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-medium text-slate-500">R$</span>
            <input
              id="edit-monthly-fee"
              inputMode="numeric"
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
              placeholder="99"
              value={form.monthlyFee ?? ''}
              onChange={(e) => onChange({ ...form, monthlyFee: Number(unmaskNumber(e.target.value)) || 0 })}
            />
          </div>
        </div>
        <div>
          <label htmlFor="edit-due-day" className="mb-1.5 block text-xs font-semibold text-slate-600">Dia de vencimento</label>
          <input id="edit-due-day" type="number" min="1" max="31" className={inputCls} value={form.billingDueDay ?? ''} onChange={(e) => onChange({ ...form, billingDueDay: Number(e.target.value) })} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="button" variant="primary" size="sm" onClick={onSave} isLoading={isUpdating}>Salvar</Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isUpdating}>Cancelar</Button>
      </div>
    </div>
  );
}

export function WorkshopDetailsPage() {
  const { workshopId } = useParams<{ workshopId: string }>();
  const navigate = useNavigate();
  const [details, setDetails] = useState<WorkshopBillingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBillingLoading, setIsBillingLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState<UpdateWorkshopPayload>({});
  const [resetCredentials, setResetCredentials] = useState<{ email: string; temporaryPassword: string } | null>(null);
  const [isResetPasswordVisible, setIsResetPasswordVisible] = useState(false);
  const [isResetPasswordCopied, setIsResetPasswordCopied] = useState(false);
  const [error, setError] = useState('');

  async function refreshWorkshop() {
    if (!workshopId) return;
    const response = await getWorkshopBillingDetails(workshopId);
    setDetails(response);
  }

  useEffect(() => {
    if (!workshopId) {
      setError('Oficina não informada');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    void (async () => {
      try {
        await refreshWorkshop();
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Falha ao carregar oficina');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [workshopId]);

  async function handleMarkAsPaid() {
    if (!workshopId) return;
    setIsBillingLoading(true);
    setError('');
    try {
      await markAsPaid(workshopId);
      await refreshWorkshop();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao marcar como pago');
    } finally {
      setIsBillingLoading(false);
    }
  }

  async function handleMarkAsUnpaid() {
    if (!workshopId) return;
    setIsBillingLoading(true);
    setError('');
    try {
      await markAsUnpaid(workshopId);
      await refreshWorkshop();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao marcar como não pago');
    } finally {
      setIsBillingLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!workshopId) return;

    setIsResettingPassword(true);
    setError('');

    try {
      const credentials = await resetOwnerPassword(workshopId);
      setResetCredentials(credentials);
      setIsResetPasswordVisible(false);
      setIsResetPasswordCopied(false);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Falha ao resetar a senha');
    } finally {
      setIsResettingPassword(false);
    }
  }

  async function copyResetPassword(): Promise<void> {
    if (!resetCredentials?.temporaryPassword) return;

    try {
      await navigator.clipboard.writeText(resetCredentials.temporaryPassword);
      setIsResetPasswordCopied(true);
      globalThis.setTimeout(() => setIsResetPasswordCopied(false), 2500);
    } catch {
      setError('Não foi possível copiar a senha. Copie manualmente.');
    }
  }

  async function handleDeleteWorkshop() {
    if (!workshopId) return;
    if (!window.confirm(`Excluir a oficina "${details?.workshop.name}"? Esta ação desabilita todos os usuários e não pode ser desfeita.`)) return;

    setIsDeleting(true);
    setError('');

    try {
      await deleteWorkshop(workshopId);
      navigate('/admin');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Falha ao excluir a oficina');
      setIsDeleting(false);
    }
  }

  function handleStartEditing() {
    const w = details?.workshop;
    if (!w) return;
    setEditForm({
      name: w.name,
      email: w.email,
      phone: maskPhone(w.phone || ''),
      monthlyFee: w.monthlyFee,
      billingDueDay: w.billingDueDay,
      status: w.status === 'deleted' ? 'blocked' : w.status,
    });
    setIsEditing(true);
  }

  async function handleSaveEdit() {
    if (!workshopId) return;
    setIsUpdating(true);
    setError('');
    try {
      await updateWorkshop(workshopId, {
        ...editForm,
        phone: unmaskNumber(editForm.phone ?? ''),
      });
      await refreshWorkshop();
      setIsEditing(false);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Falha ao salvar alterações');
    } finally {
      setIsUpdating(false);
    }
  }

  const workshop = details?.workshop ?? null;

  let cardContent: React.ReactNode;
  if (isLoading) {
    cardContent = <div className="py-10 text-center text-slate-500">Carregando oficina...</div>;
  } else if (workshop && isEditing) {
    cardContent = (
      <WorkshopEditForm
        form={editForm}
        isUpdating={isUpdating}
        onChange={setEditForm}
        onSave={() => void handleSaveEdit()}
        onCancel={() => setIsEditing(false)}
      />
    );
  } else if (workshop) {
    cardContent = (
      <WorkshopView
        workshop={workshop}
        ownerEmail={details?.ownerEmail ?? ''}
        isResettingPassword={isResettingPassword}
        isDeleting={isDeleting}
        isBillingLoading={isBillingLoading}
        onEdit={handleStartEditing}
        onResetPassword={() => void handleResetPassword()}
        onDelete={() => void handleDeleteWorkshop()}
        onMarkAsPaid={() => void handleMarkAsPaid()}
        onMarkAsUnpaid={() => void handleMarkAsUnpaid()}
      />
    );
  } else {
    cardContent = <div className="py-10 text-center text-slate-500">Oficina não encontrada.</div>;
  }

  return (
    <Layout title="Detalhe da Oficina" backTo="/admin">
      <div className="space-y-6">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        {resetCredentials ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            <p className="font-semibold">Senha do owner resetada com sucesso</p>
            <p className="mt-2">E-mail: <strong>{resetCredentials.email}</strong></p>
            <p>
              Nova senha temporária:{' '}
              <strong>
                {isResetPasswordVisible ? resetCredentials.temporaryPassword : `${resetCredentials.temporaryPassword.slice(0, 2)}******`}
              </strong>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsResetPasswordVisible((v) => !v)}
              >
                {isResetPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void copyResetPassword()}
              >
                {isResetPasswordCopied ? 'Copiado!' : 'Copiar senha'}
              </Button>
            </div>
          </div>
        ) : null}

        <Card>{cardContent}</Card>
      </div>
    </Layout>
  );
}
