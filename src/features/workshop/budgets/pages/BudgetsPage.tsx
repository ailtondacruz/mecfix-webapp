import React, { useEffect, useMemo, useState } from 'react';
import { Layout, Card, Button } from '../../../../shared';
import { useAuth } from '../../../../shared/hooks/useAuth';
import type { Budget } from '../../../../shared';
import {
  createBudget,
  updateBudget,
  deleteBudget,
  downloadBudgetPdf,
  listBudgets,
  type CreateBudgetInput,
} from '../services/budgets.service';

interface BudgetLineDraft {
  id: string;
  description: string;
  unitPrice: string;
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

const initialFormState: BudgetFormState = {
  customerName: '',
  vehicleName: '',
  vehiclePlate: '',
  validityDays: '15',
  notes: '',
  items: [{ id: 'item-1', description: '', unitPrice: '', type: 'service' }],
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

interface RecentBudgetsProps {
  readonly isLoading: boolean;
  readonly budgets: Budget[];
  readonly editingBudgetId: string | null;
  readonly deletingBudgetId: string | null;
  readonly onEdit: (budget: Budget) => void;
  readonly onDelete: (budgetId: string) => void;
}

function RecentBudgets({ isLoading, budgets, editingBudgetId, deletingBudgetId, onEdit, onDelete }: Readonly<RecentBudgetsProps>): React.ReactNode {
  if (isLoading) {
    return <p className="text-sm text-slate-600">Carregando...</p>;
  }
  if (budgets.length === 0) {
    return <p className="text-sm text-slate-600">Nenhum orçamento ainda.</p>;
  }
  return (
    <div className="space-y-2">
      {budgets.slice(0, 10).map((budget) => {
        const isEditing = editingBudgetId === budget.budgetId;
        const isDeleting = deletingBudgetId === budget.budgetId;
        return (
          <div
            key={budget.budgetId}
            className={`group relative rounded-xl border bg-white/90 transition ${
              isEditing
                ? 'border-mecfix-orange ring-2 ring-mecfix-orange/20'
                : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
            }`}
          >
            <button
              type="button"
              className="w-full cursor-pointer p-3 text-left"
              onClick={() => onEdit(budget)}
              aria-label={`Editar orçamento de ${budget.customerName}`}
            >
              <div className="flex items-start justify-between gap-8">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{budget.customerName}</p>
                  <p className="truncate text-xs text-slate-600">{budget.vehicleName} · {budget.vehiclePlate}</p>
                </div>
                <span className="soft-chip shrink-0 text-xs">{budget.status}</span>
              </div>
              <p className="mt-1.5 text-base font-bold text-slate-900">{formatCurrency(budget.total)}</p>
            </button>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(budget.budgetId); }}
              disabled={isDeleting}
              aria-label="Excluir orçamento"
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
            >
              {isDeleting ? '…' : '🗑'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function createDraftItem(index: number): BudgetLineDraft {
  return {
    id: `item-${Date.now()}-${index}`,
    description: '',
    unitPrice: '',
    type: 'service',
  };
}

export function BudgetsPage() {
  const { workshop } = useAuth();
  const [formState, setFormState] = useState<BudgetFormState>(initialFormState);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savedBudget, setSavedBudget] = useState<Budget | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [error, setError] = useState('');
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);

  const total = useMemo(() => {
    return formState.items.reduce((sum, item) => {
      const value = Number(item.unitPrice.replace(',', '.'));
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
  }, [formState.items]);

  useEffect(() => {
    void (async () => {
      try {
        const loadedBudgets = await listBudgets();
        setBudgets(loadedBudgets);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Falha ao carregar orçamentos');
      } finally {
        setIsLoadingList(false);
      }
    })();
  }, []);

  function loadBudgetForEdit(budget: Budget) {
    setEditingBudgetId(budget.budgetId);
    setSavedBudget(null);
    setError('');
    setFormState({
      customerName: budget.customerName,
      vehicleName: budget.vehicleName,
      vehiclePlate: budget.vehiclePlate,
      validityDays: String(budget.validityDays),
      notes: budget.notes ?? '',
      items: budget.items.map((item) => ({
        id: item.id ?? `item-${Date.now()}`,
        description: item.description,
        unitPrice: String(item.unitPrice),
        type: item.type,
      })),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingBudgetId(null);
    setFormState(initialFormState);
    setSavedBudget(null);
    setError('');
  }

  async function handleDelete(budgetId: string) {
    if (!globalThis.confirm('Excluir este orçamento? Esta ação não pode ser desfeita.')) return;
    setDeletingBudgetId(budgetId);
    setError('');
    try {
      await deleteBudget(budgetId);
      setBudgets((current) => current.filter((b) => b.budgetId !== budgetId));
      if (editingBudgetId === budgetId) cancelEdit();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Falha ao excluir orçamento');
    } finally {
      setDeletingBudgetId(null);
    }
  }

  function updateItem(id: string, field: keyof BudgetLineDraft, value: string) {
    setFormState((current) => ({
      ...current,
      items: current.items.map((item) => (
        item.id === id ? { ...item, [field]: value } : item
      )),
    }));
  }

  function addItem() {
    setFormState((current) => ({
      ...current,
      items: [...current.items, createDraftItem(current.items.length + 1)],
    }));
  }

  function removeItem(id: string) {
    setFormState((current) => {
      if (current.items.length === 1) {
        return current;
      }

      return {
        ...current,
        items: current.items.filter((item) => item.id !== id),
      };
    });
  }

  async function handleSave() {
    setError('');
    setIsSaving(true);

    try {
      const items = formState.items
        .map((item) => ({
          description: item.description.trim(),
          unitPrice: Number(item.unitPrice.replace(',', '.')),
          type: item.type,
        }))
        .filter((item) => item.description && Number.isFinite(item.unitPrice) && item.unitPrice >= 0);

      if (!formState.customerName.trim()) {
        throw new Error('Informe o nome do cliente');
      }

      if (!formState.vehicleName.trim()) {
        throw new Error('Informe o veículo');
      }

      if (!formState.vehiclePlate.trim()) {
        throw new Error('Informe a placa');
      }

      if (items.length === 0) {
        throw new Error('Adicione pelo menos um item com descrição e valor');
      }

      const payload: CreateBudgetInput = {
        customerName: formState.customerName.trim(),
        vehicleName: formState.vehicleName.trim(),
        vehiclePlate: formState.vehiclePlate.trim().toUpperCase(),
        validityDays: Number(formState.validityDays) || 15,
        notes: formState.notes.trim() || undefined,
        items,
      };

      let budget;
      if (editingBudgetId) {
        budget = await updateBudget(editingBudgetId, payload);
        setBudgets((current) => current.map((b) => b.budgetId === editingBudgetId ? budget : b));
        setEditingBudgetId(null);
      } else {
        budget = await createBudget(payload);
        setBudgets((current) => [budget, ...current]);
      }
      setSavedBudget(budget);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Falha ao salvar orçamento');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleGeneratePdf() {
    if (!savedBudget) {
      setError('Salve o orçamento antes de gerar o PDF');
      return;
    }

    setError('');
    setIsGeneratingPdf(true);
    try {
      await downloadBudgetPdf(savedBudget.budgetId);
    } catch (pdfError) {
      setError(pdfError instanceof Error ? pdfError.message : 'Falha ao gerar PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  function handleShareWhatsapp() {
    if (!savedBudget) {
      setError('Salve o orçamento antes de compartilhar');
      return;
    }

    const message = [
      `Olá! Segue o orçamento ${savedBudget.budgetId}.`,
      `Cliente: ${savedBudget.customerName}`,
      `Veículo: ${savedBudget.vehicleName}`,
      `Placa: ${savedBudget.vehiclePlate}`,
      `Total: ${formatCurrency(savedBudget.total)}`,
      `Validade: ${savedBudget.validityDays} dias (${new Date(savedBudget.validUntil).toLocaleDateString('pt-BR')})`,
      workshop?.name ? `Oficina: ${workshop.name}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <Layout title="Orçamentos" backTo="/workshop">
      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <Card title={editingBudgetId ? `Editando Orçamento #${editingBudgetId.slice(-6).toUpperCase()}` : 'Novo Orçamento'}>
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label htmlFor="budget-customer" className="mb-1 block text-sm font-semibold text-slate-700">Cliente</label>
                <input
                  id="budget-customer"
                  value={formState.customerName}
                  onChange={(event) => setFormState({ ...formState, customerName: event.target.value })}
                  placeholder="Nome do cliente"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
                />
              </div>

              <div>
                <label htmlFor="budget-validity" className="mb-1 block text-sm font-semibold text-slate-700">Validade (dias)</label>
                <input
                  id="budget-validity"
                  type="number"
                  min="1"
                  value={formState.validityDays}
                  onChange={(event) => setFormState({ ...formState, validityDays: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
                />
              </div>

              <div>
                <label htmlFor="budget-vehicle" className="mb-1 block text-sm font-semibold text-slate-700">Veículo</label>
                <input
                  id="budget-vehicle"
                  value={formState.vehicleName}
                  onChange={(event) => setFormState({ ...formState, vehicleName: event.target.value })}
                  placeholder="Ex: Gol 1.6 2018"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
                />
              </div>

              <div>
                <label htmlFor="budget-plate" className="mb-1 block text-sm font-semibold text-slate-700">Placa</label>
                <input
                  id="budget-plate"
                  value={formState.vehiclePlate}
                  onChange={(event) => setFormState({ ...formState, vehiclePlate: event.target.value })}
                  placeholder="ABC1D23"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-slate-900">
                  {'Serviços e produtos '}
                  <span className="text-xs font-normal text-slate-400">({formState.items.length})</span>
                </p>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>+ Adicionar</Button>
              </div>

              {/* Cabeçalho da tabela — visível apenas em md+ */}
              <div className="mb-1 hidden grid-cols-[1fr_110px_100px_32px] gap-2 px-2 md:grid">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Descrição</span>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tipo</span>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Valor</span>
                <span />
              </div>

              {/* Lista com scroll interno */}
              <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50">
                {formState.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-1 border-b border-slate-200 px-2 py-1.5 last:border-b-0 md:grid-cols-[1fr_110px_100px_32px] md:items-center"
                  >
                    <input
                      id={`item-description-${item.id}`}
                      value={item.description}
                      onChange={(event) => updateItem(item.id, 'description', event.target.value)}
                      placeholder={`Item ${index + 1}`}
                      aria-label="Descrição"
                      className="col-span-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none transition focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
                    />

                    <select
                      id={`item-type-${item.id}`}
                      value={item.type}
                      onChange={(event) => updateItem(item.id, 'type', event.target.value)}
                      aria-label="Tipo"
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none transition focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
                    >
                      <option value="service">Serviço</option>
                      <option value="part">Peça</option>
                    </select>

                    <input
                      id={`item-price-${item.id}`}
                      inputMode="decimal"
                      value={item.unitPrice}
                      onChange={(event) => updateItem(item.id, 'unitPrice', event.target.value)}
                      placeholder="0,00"
                      aria-label="Valor"
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none transition focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
                    />

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label="Remover item"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="budget-notes" className="mb-1 block text-sm font-semibold text-slate-700">Observações</label>
              <textarea
                id="budget-notes"
                value={formState.notes}
                onChange={(event) => setFormState({ ...formState, notes: event.target.value })}
                rows={2}
                placeholder="Opcional: condições, peças sugeridas, detalhes..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {error}
              </div>
            ) : null}
          </div>
        </Card>

        <div className="space-y-4">
          <Card title="Resumo">
            <div className="space-y-3">
              <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                <p className="text-xs font-semibold text-slate-500">Total do orçamento</p>
                <p className="mt-1 text-3xl font-black text-slate-900">{formatCurrency(total)}</p>
                <p className="mt-1 text-xs text-slate-600">Validade: {formState.validityDays || '15'} dias</p>
              </div>

              {editingBudgetId ? (
                <Button type="button" variant="outline" className="w-full" onClick={cancelEdit}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Cancelar edição
                </Button>
              ) : null}
              <Button type="button" variant="primary" isLoading={isSaving} className="w-full" onClick={() => void handleSave()}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                {editingBudgetId ? 'Atualizar orçamento' : 'Salvar orçamento'}
              </Button>
              <Button type="button" variant="secondary" isLoading={isGeneratingPdf} className="w-full" onClick={() => void handleGeneratePdf()}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                Gerar PDF
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={handleShareWhatsapp}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                WhatsApp
              </Button>

              {savedBudget ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                  <p className="font-semibold">Orçamento salvo ✓</p>
                  <p className="mt-0.5 text-xs">Cód: {savedBudget.budgetId}</p>
                  <p className="text-xs">Válido até {new Date(savedBudget.validUntil).toLocaleDateString('pt-BR')}</p>
                </div>
              ) : null}
            </div>
          </Card>

          <Card title="Recentes">
            <RecentBudgets
              isLoading={isLoadingList}
              budgets={budgets}
              editingBudgetId={editingBudgetId}
              deletingBudgetId={deletingBudgetId}
              onEdit={loadBudgetForEdit}
              onDelete={(id) => void handleDelete(id)}
            />
          </Card>
        </div>
      </div>
    </Layout>
  );
}
