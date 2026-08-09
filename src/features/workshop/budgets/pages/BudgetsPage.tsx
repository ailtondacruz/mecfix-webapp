import { useCallback, useEffect, useMemo, useState } from 'react';
import { Layout } from '../../../../shared';
import { CurrencyInput } from '../../../../shared/components/CurrencyInput';
import { useAuth } from '../../../../shared/hooks/useAuth';
import type { Budget, BudgetStatus } from '../../../../shared';
import {
  createBudget,
  updateBudget,
  deleteBudget,
  downloadBudgetPdf,
  getMonthlyBudgetStats,
  listBudgets,
  type BudgetMonthlyStats,
  type CreateBudgetInput,
} from '../services/budgets.service';

// ── Types ───────────────────────────────────────────────────────────────────────
interface BudgetLineDraft {
  id: string;
  description: string;
  unitPrice: number; // cents (×100)
  type: 'service' | 'part';
}

interface BudgetFormState {
  customerName: string;
  vehicleName: string;
  vehiclePlate: string;
  validityDays: string;
  notes: string;
  items: BudgetLineDraft[];
}

// ── Constants ───────────────────────────────────────────────────────────────────
const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const STATUS_CONFIG = {
  pending:  { label: 'Pendente',  dot: 'bg-amber-400',   className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  approved: { label: 'Aprovado',  dot: 'bg-emerald-400', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  rejected: { label: 'Recusado',  dot: 'bg-red-400',     className: 'bg-red-50 text-red-600 ring-1 ring-red-200' },
  expired:  { label: 'Expirado',  dot: 'bg-slate-300',   className: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200' },
} as const;

const STATUS_TABS: { key: 'all' | BudgetStatus; label: string }[] = [
  { key: 'all',      label: 'Todos' },
  { key: 'pending',  label: 'Pendentes' },
  { key: 'approved', label: 'Aprovados' },
  { key: 'rejected', label: 'Recusados' },
  { key: 'expired',  label: 'Expirados' },
];

const INITIAL_FORM: BudgetFormState = {
  customerName: '',
  vehicleName: '',
  vehiclePlate: '',
  validityDays: '15',
  notes: '',
  items: [{ id: 'item-1', description: '', unitPrice: 0, type: 'service' }],
};

// ── Helpers ─────────────────────────────────────────────────────────────────────
function fmtBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function newDraftItem(index: number): BudgetLineDraft {
  return { id: `item-${Date.now()}-${index}`, description: '', unitPrice: 0, type: 'service' };
}

// ── StatusBadge ─────────────────────────────────────────────────────────────────
function StatusBadge({ status }: Readonly<{ status: string }>) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
    ?? { label: status, dot: 'bg-slate-300', className: 'bg-slate-100 text-slate-500' };
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── BudgetCard ──────────────────────────────────────────────────────────────────
interface BudgetCardProps {
  readonly budget: Budget;
  readonly isEditing: boolean;
  readonly isDeleting: boolean;
  readonly onEdit: (budget: Budget) => void;
  readonly onDelete: (budgetId: string) => void;
  readonly onPdf: (budget: Budget) => void;
  readonly onWhatsapp: (budget: Budget) => void;
}

function BudgetCard({ budget, isEditing, isDeleting, onEdit, onDelete, onPdf, onWhatsapp }: BudgetCardProps) {
  const dateLabel = budget.updatedAt && budget.updatedAt !== budget.createdAt
    ? `Editado ${new Date(budget.updatedAt).toLocaleDateString('pt-BR')}`
    : new Date(budget.createdAt).toLocaleDateString('pt-BR');

  return (
    <div className={`overflow-hidden rounded-2xl border bg-white transition-all ${
      isEditing
        ? 'border-mecfix-orange ring-2 ring-mecfix-orange/20 shadow-md'
        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
    }`}>
      {/* Clickable main area */}
      <button
        type="button"
        className="w-full px-4 pt-4 pb-3 text-left"
        onClick={() => onEdit(budget)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">{budget.budgetNumber}</span>
              <StatusBadge status={budget.status} />
            </div>
            <p className="truncate text-base font-bold leading-tight text-slate-900">{budget.customerName}</p>
            <p className="truncate text-sm text-slate-500">{budget.vehicleName} · {budget.vehiclePlate}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xl font-black text-slate-900">{fmtBRL(budget.total)}</p>
            <p className="text-xs text-slate-400">{dateLabel}</p>
          </div>
        </div>
      </button>

      {/* Action row */}
      <div className="flex items-stretch border-t border-slate-100">
        <button
          type="button"
          onClick={() => onEdit(budget)}
          className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-mecfix-orange transition-colors hover:bg-orange-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M2.695 14.763l-1.262 3.154a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.885L17.5 5.5a2.121 2.121 0 0 0-3-3L3.58 13.42a4 4 0 0 0-.885 1.343z" />
          </svg>
          Editar
        </button>
        <div className="w-px bg-slate-100" />
        <button
          type="button"
          onClick={() => onPdf(budget)}
          className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5zM10 8a.75.75 0 0 1 .75.75v2.546l.943-1.048a.75.75 0 1 1 1.114 1.004l-2.25 2.5a.75.75 0 0 1-1.114 0l-2.25-2.5a.75.75 0 1 1 1.114-1.004l.943 1.048V8.75A.75.75 0 0 1 10 8z" clipRule="evenodd" />
          </svg>
          PDF
        </button>
        <div className="w-px bg-slate-100" />
        <button
          type="button"
          onClick={() => onWhatsapp(budget)}
          className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
          </svg>
          <span className="hidden sm:inline">WhatsApp</span>
          <span className="sm:hidden">WA</span>
        </button>
        <div className="w-px bg-slate-100" />
        <button
          type="button"
          onClick={() => onDelete(budget.budgetId)}
          disabled={isDeleting}
          aria-label="Excluir orçamento"
          className="flex items-center justify-center px-4 py-2.5 text-red-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
        >
          {isDeleting
            ? <span className="text-xs">…</span>
            : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" /></svg>
          }
        </button>
      </div>
    </div>
  );
}

// ── BudgetFormModal ─────────────────────────────────────────────────────────────
interface BudgetFormModalProps {
  readonly isOpen: boolean;
  readonly editingBudget: Budget | null;
  readonly workshopName: string | undefined;
  readonly onClose: () => void;
  readonly onCreated: (budget: Budget) => void;
  readonly onUpdated: (budget: Budget) => void;
  readonly onDeleted: (budgetId: string) => void;
}

function BudgetFormModal({ isOpen, editingBudget, workshopName, onClose, onCreated, onUpdated, onDeleted }: BudgetFormModalProps) {
  const [form, setForm] = useState<BudgetFormState>(INITIAL_FORM);
  const [savedBudget, setSavedBudget] = useState<Budget | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const total = useMemo(
    () => form.items.reduce((s, item) => s + item.unitPrice, 0),
    [form.items],
  );

  // Reset when modal opens / target changes
  useEffect(() => {
    if (!isOpen) {
      setSavedBudget(null);
      setError('');
      return;
    }
    if (editingBudget) {
      setSavedBudget(editingBudget);
      setForm({
        customerName: editingBudget.customerName,
        vehicleName: editingBudget.vehicleName,
        vehiclePlate: editingBudget.vehiclePlate,
        validityDays: String(editingBudget.validityDays),
        notes: editingBudget.notes ?? '',
        items: editingBudget.items.map(item => ({
          id: item.id ?? `item-${Date.now()}`,
          description: item.description,
          unitPrice: item.unitPrice,
          type: item.type,
        })),
      });
    } else {
      setForm(INITIAL_FORM);
      setSavedBudget(null);
    }
    setError('');
  }, [isOpen, editingBudget]);

  function updateItem(id: string, field: keyof BudgetLineDraft, value: string | number) {
    setForm(curr => ({
      ...curr,
      items: curr.items.map(item => item.id === id ? { ...item, [field]: value } : item),
    }));
  }

  function addItem() {
    setForm(curr => ({ ...curr, items: [...curr.items, newDraftItem(curr.items.length + 1)] }));
  }

  function removeItem(id: string) {
    setForm(curr => {
      if (curr.items.length === 1) return curr;
      return { ...curr, items: curr.items.filter(item => item.id !== id) };
    });
  }

  async function handleSave() {
    setError('');
    setIsSaving(true);
    try {
      if (!form.customerName.trim()) throw new Error('Informe o nome do cliente');
      if (!form.vehicleName.trim()) throw new Error('Informe o veículo');
      if (!form.vehiclePlate.trim()) throw new Error('Informe a placa');

      const items = form.items
        .map(item => ({ description: item.description.trim(), unitPrice: item.unitPrice, type: item.type }))
        .filter(item => item.description && item.unitPrice >= 0);

      if (items.length === 0) throw new Error('Adicione pelo menos um item com descrição e valor');

      const payload: CreateBudgetInput = {
        customerName: form.customerName.trim(),
        vehicleName: form.vehicleName.trim(),
        vehiclePlate: form.vehiclePlate.trim().toUpperCase(),
        validityDays: Number(form.validityDays) || 15,
        notes: form.notes.trim() || undefined,
        items,
      };

      let budget: Budget;
      if (editingBudget) {
        budget = await updateBudget(editingBudget.budgetId, payload);
      } else {
        budget = await createBudget(payload);
      }
      setSavedBudget(budget);
      if (editingBudget) {
        onUpdated(budget);
      } else {
        onCreated(budget);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar');
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePdf() {
    const target = savedBudget ?? editingBudget;
    if (!target) { setError('Salve o orçamento antes de gerar o PDF'); return; }
    setIsPdfLoading(true);
    try {
      await downloadBudgetPdf(target.budgetId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Falha ao gerar PDF');
    } finally {
      setIsPdfLoading(false);
    }
  }

  function handleWhatsapp() {
    const target = savedBudget ?? editingBudget;
    if (!target) { setError('Salve o orçamento antes de compartilhar'); return; }
    const approvalLink = target.shareToken ? `${globalThis.location.origin}/o/${target.shareToken}` : '';
    const pdfLink = target.shareToken ? `${globalThis.location.origin}/api/budgets/public/${target.shareToken}/pdf` : '';
    const message = [
      `Olá, ${target.customerName}!`,
      `Segue o orçamento para o seu ${target.vehicleName} (Placa: ${target.vehiclePlate}).`,
      `Total: ${fmtBRL(target.total)}`,
      `Válido até: ${new Date(target.validUntil).toLocaleDateString('pt-BR')}`,
      workshopName ? `Oficina: ${workshopName}` : '',
      approvalLink ? `\n✅ Ver e aprovar online:\n${approvalLink}` : '',
      pdfLink ? `📄 Baixar PDF:\n${pdfLink}` : '',
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  async function handleDelete() {
    if (!editingBudget) return;
    const msg = editingBudget.status === 'approved'
      ? 'Atenção: este orçamento já foi APROVADO pelo cliente.\n\nTem certeza que deseja excluí-lo?'
      : 'Excluir este orçamento? Esta ação não pode ser desfeita.';
    if (!globalThis.confirm(msg)) return;
    setIsDeleting(true);
    try {
      await deleteBudget(editingBudget.budgetId);
      onDeleted(editingBudget.budgetId);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Falha ao excluir');
    } finally {
      setIsDeleting(false);
    }
  }

  if (!isOpen) return null;

  const isEdit = !!editingBudget;
  const hasSaved = !!savedBudget;
  const title = isEdit ? `Editando ${editingBudget.budgetNumber}` : 'Novo Orçamento';
  let saveLabel: string;
  if (isSaving) saveLabel = 'Salvando…';
  else saveLabel = isEdit ? '💾 Atualizar' : '💾 Salvar';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button type="button" aria-label="Fechar" className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[96vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-w-3xl sm:rounded-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            {hasSaved && (
              <p className="text-xs font-medium text-emerald-600">
                ✓ {savedBudget.budgetNumber} salvo — válido até {new Date(savedBudget.validUntil).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isEdit && (
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
              >
                {isDeleting ? '…' : '🗑 Excluir'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              ×
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <span className="mt-0.5 shrink-0">⚠️</span>
              <span className="flex-1">{error}</span>
              <button type="button" onClick={() => setError('')} className="shrink-0 text-red-400 hover:text-red-600">✕</button>
            </div>
          )}

          <div className="space-y-4">
            {/* Cliente + Validade */}
            <div className="grid gap-3 sm:grid-cols-[1fr_130px]">
              <div>
                <label htmlFor="bfm-customer" className="mb-1 block text-xs font-semibold text-slate-600">Cliente *</label>
                <input
                  id="bfm-customer"
                  value={form.customerName}
                  onChange={e => setForm({ ...form, customerName: e.target.value })}
                  placeholder="Nome do cliente"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
                />
              </div>
              <div>
                <label htmlFor="bfm-validity" className="mb-1 block text-xs font-semibold text-slate-600">Validade (dias)</label>
                <input
                  id="bfm-validity"
                  type="number"
                  min="1"
                  value={form.validityDays}
                  onChange={e => setForm({ ...form, validityDays: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
                />
              </div>
            </div>

            {/* Veículo + Placa */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="bfm-vehicle" className="mb-1 block text-xs font-semibold text-slate-600">Veículo *</label>
                <input
                  id="bfm-vehicle"
                  value={form.vehicleName}
                  onChange={e => setForm({ ...form, vehicleName: e.target.value })}
                  placeholder="Ex: Gol 1.6 2018"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
                />
              </div>
              <div>
                <label htmlFor="bfm-plate" className="mb-1 block text-xs font-semibold text-slate-600">Placa *</label>
                <input
                  id="bfm-plate"
                  value={form.vehiclePlate}
                  onChange={e => setForm({ ...form, vehiclePlate: e.target.value })}
                  placeholder="ABC1D23"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
                />
              </div>
            </div>

            {/* Itens */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700">
                  Serviços e peças{' '}
                  <span className="font-normal text-slate-400">({form.items.length})</span>
                </p>
                <button
                  type="button"
                  onClick={addItem}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  + Adicionar
                </button>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="hidden grid-cols-[1fr_120px_130px_32px] gap-2 bg-slate-50 px-3 py-1.5 sm:grid">
                  <span className="text-xs font-semibold text-slate-400">DESCRIÇÃO</span>
                  <span className="text-xs font-semibold text-slate-400">TIPO</span>
                  <span className="text-xs font-semibold text-slate-400">VALOR</span>
                  <span />
                </div>
                <div className="divide-y divide-slate-100">
                  {form.items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-1.5 px-3 py-2 sm:grid sm:grid-cols-[1fr_120px_130px_32px] sm:items-center sm:gap-2 sm:py-1.5"
                    >
                      <div className="flex items-center gap-1">
                        <input
                          value={item.description}
                          onChange={e => updateItem(item.id, 'description', e.target.value)}
                          placeholder={`Item ${idx + 1}`}
                          aria-label="Descrição do item"
                          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-mecfix-orange focus:ring-1 focus:ring-mecfix-orange/20"
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          aria-label="Remover item"
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 sm:hidden"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex gap-2 sm:contents">
                        <select
                          value={item.type}
                          onChange={e => updateItem(item.id, 'type', e.target.value)}
                          aria-label="Tipo do item"
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-mecfix-orange sm:w-full"
                        >
                          <option value="service">Serviço</option>
                          <option value="part">Peça</option>
                        </select>
                        <CurrencyInput
                          value={item.unitPrice}
                          onChange={cents => updateItem(item.id, 'unitPrice', cents)}
                          aria-label="Valor do item"
                          className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-mecfix-orange sm:w-full"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        aria-label="Remover item"
                        className="hidden h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 sm:flex"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Observações */}
            <div>
              <label htmlFor="bfm-notes" className="mb-1 block text-xs font-semibold text-slate-600">Observações</label>
              <textarea
                id="bfm-notes"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={2}
                placeholder="Opcional: condições, peças sugeridas, detalhes..."
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
              />
            </div>

            {/* Total summary */}
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
              <div>
                <p className="text-xs font-semibold text-slate-500">Total do orçamento</p>
                <p className="text-xs text-slate-400">Validade: {form.validityDays || '15'} dias</p>
              </div>
              <p className="text-2xl font-black text-slate-900">{fmtBRL(total)}</p>
            </div>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="rounded-b-2xl border-t border-slate-100 bg-white px-5 py-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-mecfix-orange py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
            >
              {saveLabel}
            </button>
            <button
              type="button"
              onClick={() => void handlePdf()}
              disabled={isPdfLoading || !hasSaved}
              title={hasSaved ? 'Baixar PDF' : 'Salve o orçamento primeiro'}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
            >
              {isPdfLoading ? '…' : '📄 PDF'}
            </button>
            <button
              type="button"
              onClick={handleWhatsapp}
              disabled={!hasSaved}
              title={hasSaved ? 'Compartilhar via WhatsApp' : 'Salve o orçamento primeiro'}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-40"
            >
              💬
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────────
export function BudgetsPage() {
  const { workshop } = useAuth();
  const now = new Date();

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BudgetStatus>('all');

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const [apiError, setApiError] = useState('');
  const [stats, setStats] = useState<BudgetMonthlyStats>({
    total: 0,
    totalValue: 0,
    pending: 0,
    approved: 0,
    approvedValue: 0,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);

  const isSearching = search.trim().length > 0;

  const loadBudgetList = useCallback(async (silent = false) => {
    if (silent) {
      setIsFetching(true);
    } else {
      setIsLoading(true);
    }

    try {
      const loaded = await listBudgets({
        ...(isSearching ? { q: search } : { year, month }),
        status: statusFilter,
      });
      setBudgets(loaded);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Falha ao carregar orçamentos');
    } finally {
      if (silent) {
        setIsFetching(false);
      } else {
        setIsLoading(false);
        setHasInitialLoad(true);
      }
    }
  }, [isSearching, month, search, statusFilter, year]);

  const loadMonthlyStats = useCallback(async () => {
    try {
      const monthlyStats = await getMonthlyBudgetStats(year, month);
      setStats(monthlyStats);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Falha ao carregar estatísticas');
    }
  }, [month, year]);

  useEffect(() => {
    const delay = isSearching ? 250 : 0;
    const timer = globalThis.setTimeout(() => {
      void loadBudgetList(hasInitialLoad);
    }, delay);

    return () => globalThis.clearTimeout(timer);
  }, [hasInitialLoad, isSearching, loadBudgetList]);

  useEffect(() => {
    void loadMonthlyStats();
  }, [loadMonthlyStats]);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  function handleChangeMonth(delta: number) {
    setSearch('');
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 1) { newYear -= 1; newMonth = 12; }
    if (newMonth > 12) { newYear += 1; newMonth = 1; }
    setYear(newYear);
    setMonth(newMonth);
  }

  function openNew() {
    setEditingBudget(null);
    setIsFormOpen(true);
  }

  function openEdit(budget: Budget) {
    setEditingBudget(budget);
    setIsFormOpen(true);
  }

  function handleFormClose() {
    setIsFormOpen(false);
    setEditingBudget(null);
  }

  function handleBudgetCreated(budget: Budget) {
    const d = new Date(budget.createdAt);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
    setSearch('');
    setStatusFilter('all');
    void loadBudgetList(true);
    void loadMonthlyStats();
  }

  function handleBudgetUpdated(_: Budget) {
    void loadBudgetList(true);
    void loadMonthlyStats();
  }

  function handleDeleted(_: string) {
    void loadBudgetList(true);
    void loadMonthlyStats();
  }

  async function handleDirectDelete(budgetId: string) {
    const target = budgets.find(b => b.budgetId === budgetId);
    const msg = target?.status === 'approved'
      ? 'Atenção: este orçamento já foi APROVADO.\n\nTem certeza que deseja excluí-lo?'
      : 'Excluir este orçamento? Esta ação não pode ser desfeita.';
    if (!globalThis.confirm(msg)) return;
    setDeletingBudgetId(budgetId);
    try {
      await deleteBudget(budgetId);
      handleDeleted(budgetId);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Falha ao excluir');
    } finally {
      setDeletingBudgetId(null);
    }
  }

  async function handleDirectPdf(budget: Budget) {
    try {
      await downloadBudgetPdf(budget.budgetId);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Falha ao gerar PDF');
    }
  }

  function handleDirectWhatsapp(budget: Budget) {
    const approvalLink = budget.shareToken ? `${globalThis.location.origin}/o/${budget.shareToken}` : '';
    const pdfLink = budget.shareToken ? `${globalThis.location.origin}/api/budgets/public/${budget.shareToken}/pdf` : '';
    const message = [
      `Olá, ${budget.customerName}!`,
      `Segue o orçamento para o seu ${budget.vehicleName} (Placa: ${budget.vehiclePlate}).`,
      `Total: ${fmtBRL(budget.total)}`,
      `Válido até: ${new Date(budget.validUntil).toLocaleDateString('pt-BR')}`,
      workshop?.name ? `Oficina: ${workshop.name}` : '',
      approvalLink ? `\n✅ Ver e aprovar online:\n${approvalLink}` : '',
      pdfLink ? `📄 Baixar PDF:\n${pdfLink}` : '',
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <Layout title="Orçamentos" backTo="/workshop">
      {apiError && (
        <div className="fixed left-0 right-0 top-0 z-40 flex items-center gap-3 bg-red-600 px-4 py-3 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-white"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          <p className="flex-1 text-sm font-medium text-white">{apiError}</p>
          <button type="button" onClick={() => setApiError('')} aria-label="Fechar" className="flex h-7 w-7 items-center justify-center rounded-lg text-white/80 hover:bg-white/20 hover:text-white">✕</button>
        </div>
      )}

      <div className="mx-auto max-w-5xl space-y-4">

        {/* Month nav + New button */}
        {!isSearching && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleChangeMonth(-1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
            >
              ‹
            </button>
            <div className="flex flex-1 flex-col items-center leading-tight">
              <span className="text-xs font-medium text-slate-400">{year}</span>
              <span className="text-base font-bold text-slate-800">{MONTHS_PT[month - 1]}</span>
            </div>
            <button
              type="button"
              onClick={() => handleChangeMonth(1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
            >
              ›
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <button
              type="button"
              onClick={openNew}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-mecfix-orange px-4 py-2 text-sm font-bold text-white transition-transform hover:bg-orange-600 active:scale-95"
            >
              <span className="text-base leading-none">+</span> Novo
            </button>
          </div>
        )}

        {/* Search bar */}
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente, placa ou veículo..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm outline-none focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
          />
          {isSearching && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Limpar busca"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Search mode header */}
        {isSearching && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-800">{budgets.length}</span>
              {' '}resultado{budgets.length === 1 ? '' : 's'} para{' '}
              <span className="font-semibold text-slate-800">"{search}"</span>
              {' · '}
              <button type="button" onClick={() => setSearch('')} className="text-mecfix-orange hover:underline">
                ver por mês
              </button>
            </p>
            <button
              type="button"
              onClick={openNew}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-mecfix-orange px-4 py-2 text-sm font-bold text-white hover:bg-orange-600"
            >
              <span className="text-base leading-none">+</span> Novo
            </button>
          </div>
        )}

        {/* Monthly stats */}
        {!isSearching && (
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
              <p className="text-xs font-medium text-slate-500">Total mês</p>
              <p className="mt-0.5 text-sm font-black text-slate-800">{fmtBRL(stats.totalValue)}</p>
              <p className="text-xs text-slate-400">{stats.total} orçamento{stats.total === 1 ? '' : 's'}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-100">
              <p className="text-xs font-medium text-emerald-600">Aprovados</p>
              <p className="mt-0.5 text-sm font-black text-emerald-800">{fmtBRL(stats.approvedValue)}</p>
              <p className="text-xs text-emerald-500">{stats.approved} orçamento{stats.approved === 1 ? '' : 's'}</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 ring-1 ring-amber-100">
              <p className="text-xs font-medium text-amber-600">Pendentes</p>
              <p className="mt-0.5 text-3xl font-black leading-none text-amber-800">{stats.pending}</p>
            </div>
          </div>
        )}

        {/* Status tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === tab.key
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Budget list */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        )}

        {!isLoading && budgets.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
            <div className="mb-2 text-4xl">🗒️</div>
            <p className="font-semibold text-slate-600">
              {isSearching ? 'Nenhum resultado' : `Nenhum orçamento em ${MONTHS_PT[month - 1]}`}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {isSearching ? 'Tente outro termo de busca' : 'Crie o primeiro orçamento do mês'}
            </p>
            {!isSearching && (
              <button
                type="button"
                onClick={openNew}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-mecfix-orange px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
              >
                + Novo orçamento
              </button>
            )}
          </div>
        )}

        {!isLoading && budgets.length > 0 && (
          <div className="space-y-3">
            {budgets.map(budget => (
              <BudgetCard
                key={budget.budgetId}
                budget={budget}
                isEditing={isFormOpen && editingBudget?.budgetId === budget.budgetId}
                isDeleting={deletingBudgetId === budget.budgetId}
                onEdit={openEdit}
                onDelete={id => void handleDirectDelete(id)}
                onPdf={b => void handleDirectPdf(b)}
                onWhatsapp={handleDirectWhatsapp}
              />
            ))}
          </div>
        )}

        {isFetching && !isLoading && (
          <p className="text-xs text-slate-400">Atualizando listagem...</p>
        )}
      </div>

      {/* Form modal */}
      <BudgetFormModal
        isOpen={isFormOpen}
        editingBudget={editingBudget}
        workshopName={workshop?.name}
        onClose={handleFormClose}
        onCreated={handleBudgetCreated}
        onUpdated={handleBudgetUpdated}
        onDeleted={handleDeleted}
      />
    </Layout>
  );
}
