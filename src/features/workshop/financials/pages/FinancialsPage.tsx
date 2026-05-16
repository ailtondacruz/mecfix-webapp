import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../../../../shared/components/Layout';
import { CurrencyInput } from '../../../../shared/components/CurrencyInput';
import {
  getAnnualSummary,
  getMonthlyEntries,
  createEntry,
  updateEntry,
  deleteEntry,
  downloadReportPdf,
  downloadCSV,
} from '../services/financials.service';
import type { FinancialEntry, MonthlySummary } from '../../../../shared';
import type { CreateEntryInput, UpdateEntryInput } from '../services/financials.service';

// ── Constants ──────────────────────────────────────────────────────────────────
const MONTHS_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

const REVENUE_CATEGORIES = ['Mão de obra','Peças','Funilaria','Pintura','Diagnóstico','Outros'];
const EXPENSE_CATEGORIES = [
  'Peças/Fornecedor','Aluguel','Energia elétrica','Água','Telefone/Internet',
  'Salários','Ferramentas','Marketing','Impostos','Outros',
];
const PAYMENT_METHODS: { value: string; label: string }[] = [
  { value: 'pix',            label: 'PIX' },
  { value: 'dinheiro',       label: 'Dinheiro' },
  { value: 'cartao_debito',  label: 'Cartão Débito' },
  { value: 'cartao_credito', label: 'Cartão Crédito' },
  { value: 'transferencia',  label: 'Transferência' },
  { value: 'boleto',         label: 'Boleto' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function parseLocalDate(iso: string): string {
  const [y, m, day] = iso.split('-');
  return `${day}/${m}/${y}`;
}

// ── Entry Modal (create + edit) ────────────────────────────────────────────────
interface EntryModalProps {
  defaultType: 'revenue' | 'expense';
  editEntry?: FinancialEntry; // pre-fill for edit mode
  onClose: () => void;
  onSaved: (entry: FinancialEntry) => void;
}

function EntryModal({ defaultType, editEntry, onClose, onSaved }: Readonly<EntryModalProps>) {
  const isEditMode = editEntry !== undefined;
  const [type, setType] = useState<'revenue' | 'expense'>(editEntry?.type ?? defaultType);
  const [description, setDescription] = useState(editEntry?.description ?? '');
  const [amount, setAmount] = useState(editEntry?.amount ?? 0);
  const [date, setDate] = useState(editEntry?.date ?? todayISO());
  const [category, setCategory] = useState(editEntry?.category ?? '');
  const [paymentMethod, setPaymentMethod] = useState(editEntry?.paymentMethod ?? '');
  const [notes, setNotes] = useState(editEntry?.notes ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = type === 'revenue' ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES;

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!description.trim() || !date || !category) {
      setError('Preencha os campos obrigatórios.');
      return;
    }
    if (amount <= 0) {
      setError('Informe um valor maior que zero.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let saved: FinancialEntry;
      if (isEditMode && editEntry) {
        const dto: UpdateEntryInput = {
          type,
          amount,
          description: description.trim(),
          category,
          date,
          ...(paymentMethod ? { paymentMethod } : {}),
          notes: notes.trim() || undefined,
        };
        saved = await updateEntry(editEntry.entryId, dto);
      } else {
        const dto: CreateEntryInput = {
          type,
          amount,
          description: description.trim(),
          category,
          date,
          ...(paymentMethod && { paymentMethod }),
          ...(notes.trim() && { notes: notes.trim() }),
        };
        saved = await createEntry(dto);
      }
      onSaved(saved);
    } catch (err: any) {
      setError(err.message ?? 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  const isRevenue = type === 'revenue';
  let submitLabel: string;
  if (loading) submitLabel = 'Salvando...';
  else submitLabel = isEditMode ? 'Atualizar' : 'Salvar';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button type="button" aria-label="Fechar" className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        {/* Header */}
        <div className={`rounded-t-2xl px-5 py-4 sm:rounded-t-2xl ${isRevenue ? 'bg-emerald-600' : 'bg-red-600'}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">
              {isEditMode ? 'Editar Lançamento' : 'Novo Lançamento'}
            </h2>
            <button onClick={onClose} className="text-white/80 hover:text-white text-xl leading-none">×</button>
          </div>
          {/* Type toggle */}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => { setType('revenue'); setCategory(''); }}
              className={`flex-1 rounded-lg py-1.5 text-sm font-semibold transition-colors ${type === 'revenue' ? 'bg-white text-emerald-700' : 'bg-white/20 text-white hover:bg-white/30'}`}
            >
              ↑ Receita
            </button>
            <button
              type="button"
              onClick={() => { setType('expense'); setCategory(''); }}
              className={`flex-1 rounded-lg py-1.5 text-sm font-semibold transition-colors ${type === 'expense' ? 'bg-white text-red-700' : 'bg-white/20 text-white hover:bg-white/30'}`}
            >
              ↓ Despesa
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {error && (
            <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <div className="space-y-3">
            <div>
              <label htmlFor="entry-description" className="mb-1 block text-xs font-medium text-slate-600">Descrição *</label>
              <input
                id="entry-description"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                placeholder="Ex: Serviço de alinhamento"
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="entry-amount" className="mb-1 block text-xs font-medium text-slate-600">Valor (R$) *</label>
                <CurrencyInput
                  id="entry-amount"
                  value={amount}
                  onChange={setAmount}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>
              <div>
                <label htmlFor="entry-date" className="mb-1 block text-xs font-medium text-slate-600">Data *</label>
                <input
                  id="entry-date"
                  type="date"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="entry-category" className="mb-1 block text-xs font-medium text-slate-600">Categoria *</label>
              <select
                id="entry-category"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 bg-white"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                <option value="">Selecione...</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {type === 'revenue' && (
              <div>
                <label htmlFor="entry-payment" className="mb-1 block text-xs font-medium text-slate-600">Forma de pagamento</label>
                <select
                  id="entry-payment"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 bg-white"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {PAYMENT_METHODS.map(pm => <option key={pm.value} value={pm.value}>{pm.label}</option>)}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="entry-notes" className="mb-1 block text-xs font-medium text-slate-600">Observações</label>
              <textarea
                id="entry-notes"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 resize-none"
                rows={2}
                placeholder="Opcional..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${isRevenue ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Enviar ao Contador Menu ─────────────────────────────────────────────────────
interface ContadorMenuProps {
  year: number;
  month: number;
  summaries: MonthlySummary[];
  entries: FinancialEntry[];
  onClose: () => void;
}

function ContadorMenu({ year, month, summaries, entries, onClose }: Readonly<ContadorMenuProps>) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const summary = summaries[month - 1];

  function buildWhatsappText(): string {
    const monthName = MONTHS_PT[month - 1];
    const revenue = summary?.revenue ?? 0;
    const expense = summary?.expense ?? 0;
    const balance = revenue - expense;

    const lines = [
      `📊 *Relatório Financeiro — ${monthName} ${year}*`,
      '',
      `✅ Receitas: ${fmtBRL(revenue)}`,
      `❌ Despesas: ${fmtBRL(expense)}`,
      `💰 Saldo: ${fmtBRL(balance)}`,
      `📋 Lançamentos: ${entries.length}`,
      '',
      '---',
      'Relatório gerado pelo sistema MecFix',
    ];
    return encodeURIComponent(lines.join('\n'));
  }

  function buildEmailBody(): string {
    const monthName = MONTHS_PT[month - 1];
    const revenue = summary?.revenue ?? 0;
    const expense = summary?.expense ?? 0;
    const balance = revenue - expense;

    return [
      `Relatório Financeiro — ${monthName} ${year}`,
      '',
      `Receitas: ${fmtBRL(revenue)}`,
      `Despesas: ${fmtBRL(expense)}`,
      `Saldo: ${fmtBRL(balance)}`,
      `Lançamentos: ${entries.length}`,
    ].join('\n');
  }

  async function handlePdf() {
    setPdfLoading(true);
    try {
      await downloadReportPdf(year, month);
      onClose();
    } catch {
      /* silent */
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button type="button" aria-label="Fechar" className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl">
        <h3 className="mb-4 text-center text-base font-semibold text-slate-800">
          Enviar ao Contador — {MONTHS_PT[month - 1]} {year}
        </h3>

        <div className="space-y-3">
          <a
            href={`https://wa.me/?text=${buildWhatsappText()}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex w-full items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3.5 text-left hover:bg-emerald-100"
          >
            <span className="text-2xl">💬</span>
            <div>
              <div className="font-semibold text-emerald-800">WhatsApp</div>
              <div className="text-xs text-emerald-600">Enviar resumo por mensagem</div>
            </div>
          </a>

          <a
            href={`mailto:?subject=Rel. Financeiro ${MONTHS_PT[month - 1]} ${year}&body=${encodeURIComponent(buildEmailBody())}`}
            onClick={onClose}
            className="flex w-full items-center gap-3 rounded-xl bg-blue-50 px-4 py-3.5 text-left hover:bg-blue-100"
          >
            <span className="text-2xl">✉️</span>
            <div>
              <div className="font-semibold text-blue-800">E-mail</div>
              <div className="text-xs text-blue-600">Abrir cliente de e-mail</div>
            </div>
          </a>

          <button
            onClick={handlePdf}
            disabled={pdfLoading}
            className="flex w-full items-center gap-3 rounded-xl bg-slate-100 px-4 py-3.5 text-left hover:bg-slate-200 disabled:opacity-60"
          >
            <span className="text-2xl">📄</span>
            <div>
              <div className="font-semibold text-slate-800">Baixar PDF</div>
              <div className="text-xs text-slate-500">{pdfLoading ? 'Gerando...' : 'Relatório completo com tabela'}</div>
            </div>
          </button>

          <button
            onClick={() => { downloadCSV(entries, year, month); onClose(); }}
            className="flex w-full items-center gap-3 rounded-xl bg-green-50 px-4 py-3.5 text-left hover:bg-green-100"
          >
            <span className="text-2xl">📊</span>
            <div>
              <div className="font-semibold text-green-800">Planilha CSV</div>
              <div className="text-xs text-green-600">Abre no Excel, Google Sheets e LibreOffice</div>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl border border-slate-200 py-2.5 text-sm text-slate-500 hover:bg-slate-50"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

// ── Annual view ────────────────────────────────────────────────────────────────
interface AnnualViewProps {
  summaries: MonthlySummary[];
  onSelectMonth: (m: number) => void;
}

function AnnualView({ summaries, onSelectMonth }: Readonly<AnnualViewProps>) {
  const maxValue = Math.max(...summaries.flatMap(s => [s.revenue, s.expense]), 1);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {summaries.map(s => {
        const revPct = Math.round((s.revenue / maxValue) * 100);
        const expPct = Math.round((s.expense / maxValue) * 100);
        const isPositive = s.balance >= 0;
        const isEmpty = s.entryCount === 0;

        return (
          <button
            key={s.month}
            onClick={() => onSelectMonth(s.month)}
            className={`group rounded-2xl border p-4 text-left shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:scale-95 ${
              isEmpty
                ? 'border-slate-200 bg-slate-50'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {MONTHS_PT[s.month - 1].slice(0, 3)}
              </span>
              {s.entryCount > 0 && (
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                  {s.entryCount}
                </span>
              )}
            </div>

            {isEmpty ? (
              <p className="text-xs text-slate-400">Sem lançamentos</p>
            ) : (
              <>
                {/* Revenue bar */}
                <div className="mb-1">
                  <div className="mb-0.5 flex items-center justify-between">
                    <span className="text-xs text-emerald-600">Rec</span>
                    <span className="text-xs font-medium text-emerald-700">{fmtBRL(s.revenue)}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100">
                    <div className="h-1.5 rounded-full bg-emerald-400 transition-all" style={{ width: `${revPct}%` }} />
                  </div>
                </div>
                {/* Expense bar */}
                <div className="mb-3">
                  <div className="mb-0.5 flex items-center justify-between">
                    <span className="text-xs text-red-500">Des</span>
                    <span className="text-xs font-medium text-red-600">{fmtBRL(s.expense)}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100">
                    <div className="h-1.5 rounded-full bg-red-400 transition-all" style={{ width: `${expPct}%` }} />
                  </div>
                </div>
                {/* Balance */}
                <div className={`rounded-lg px-2 py-1 text-center text-xs font-bold ${isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {fmtBRL(s.balance)}
                </div>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Monthly view ───────────────────────────────────────────────────────────────
interface MonthlyViewProps {
  year: number;
  month: number;
  entries: FinancialEntry[];
  loading: boolean;
  onChangeMonth: (delta: number) => void;
  onDelete: (entryId: string) => void;
  onEdit: (entry: FinancialEntry) => void;
  onAddRevenue: () => void;
  onAddExpense: () => void;
}

function MonthlyView({ year, month, entries, loading, onChangeMonth, onDelete, onEdit, onAddRevenue, onAddExpense }: Readonly<MonthlyViewProps>) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const revenue = entries.reduce((a, e) => e.type === 'revenue' ? a + e.amount : a, 0);
  const expense = entries.reduce((a, e) => e.type === 'expense' ? a + e.amount : a, 0);
  const balance = revenue - expense;

  async function handleDelete(entryId: string) {
    if (!confirm('Excluir este lançamento?')) return;
    setDeleting(entryId);
    try {
      await deleteEntry(entryId);
      onDelete(entryId);
    } catch {
      /* silent */
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      {/* Month nav */}
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => onChangeMonth(-1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-500 hover:bg-slate-50">‹</button>
        <span className="font-semibold text-slate-800">{MONTHS_PT[month - 1]} {year}</span>
        <button onClick={() => onChangeMonth(1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-500 hover:bg-slate-50">›</button>
      </div>

      {/* Summary cards */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-center">
          <div className="text-xs font-medium text-emerald-600">Receitas</div>
          <div className="mt-1 text-sm font-bold text-emerald-700 sm:text-base">{fmtBRL(revenue)}</div>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-center">
          <div className="text-xs font-medium text-red-600">Despesas</div>
          <div className="mt-1 text-sm font-bold text-red-700 sm:text-base">{fmtBRL(expense)}</div>
        </div>
        <div className={`rounded-xl border p-3 text-center ${balance >= 0 ? 'border-blue-100 bg-blue-50' : 'border-red-100 bg-red-50'}`}>
          <div className={`text-xs font-medium ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>Saldo</div>
          <div className={`mt-1 text-sm font-bold sm:text-base ${balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{fmtBRL(balance)}</div>
        </div>
      </div>

      {/* Add buttons */}
      <div className="mb-4 flex gap-3">
        <button
          onClick={onAddRevenue}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95"
        >
          <span className="text-base">+</span> Receita
        </button>
        <button
          onClick={onAddExpense}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 active:scale-95"
        >
          <span className="text-base">+</span> Despesa
        </button>
      </div>

      {/* Entry list */}
      {loading && (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      )}
      {!loading && entries.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center text-slate-400">
          <div className="mb-2 text-3xl">💸</div>
          <p className="text-sm">Nenhum lançamento em {MONTHS_PT[month - 1]}</p>
        </div>
      )}
      {!loading && entries.length > 0 && (
        <div className="space-y-2">
          {entries.map(entry => {
            const isRev = entry.type === 'revenue';
            return (
              <button
                key={entry.entryId}
                type="button"
                className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm cursor-pointer hover:border-slate-300 hover:shadow-md transition-all active:scale-[0.99] text-left"
                onClick={() => onEdit(entry)}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isRev ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {isRev ? '↑' : '↓'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{entry.description}</p>
                  <p className="text-xs text-slate-400">{entry.category} · {parseLocalDate(entry.date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className={`text-sm font-bold ${isRev ? 'text-emerald-700' : 'text-red-700'}`}>
                      {isRev ? '+' : '-'}{fmtBRL(entry.amount)}
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(entry.entryId); }}
                    disabled={deleting === entry.entryId}
                    title="Excluir"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 disabled:opacity-40 transition-colors"
                  >
                    {deleting === entry.entryId
                      ? <span className="text-xs">...</span>
                      : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" /></svg>
                    }
                  </button>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export function FinancialsPage() {
  const now = new Date();

  const [year, setYear] = useState(now.getFullYear());
  const [view, setView] = useState<'annual' | 'monthly'>('annual');
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [summaries, setSummaries] = useState<MonthlySummary[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);

  const [modal, setModal] = useState<null | 'revenue' | 'expense'>(null);
  const [editingEntry, setEditingEntry] = useState<FinancialEntry | null>(null);
  const [showContador, setShowContador] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Load annual summary
  const loadSummary = useCallback(async (y: number) => {
    setSummaryLoading(true);
    setApiError(null);
    try {
      const data = await getAnnualSummary(y);
      setSummaries(data);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Erro ao carregar dados financeiros');
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // Load monthly entries
  const loadEntries = useCallback(async (y: number, m: number) => {
    setEntriesLoading(true);
    try {
      const data = await getMonthlyEntries(y, m);
      setEntries(data);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Erro ao carregar lançamentos');
    } finally {
      setEntriesLoading(false);
    }
  }, []);

  useEffect(() => { loadSummary(year); }, [year, loadSummary]);
  useEffect(() => { if (view === 'monthly') loadEntries(year, month); }, [view, year, month, loadEntries]);

  function handleSelectMonth(m: number) {
    setMonth(m);
    setView('monthly');
  }

  function handleChangeMonth(delta: number) {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 1) { newMonth = 12; newYear--; }
    if (newMonth > 12) { newMonth = 1; newYear++; }
    setMonth(newMonth);
    if (newYear !== year) { setYear(newYear); }
  }

  function handleEntrySaved(entry: FinancialEntry) {
    setModal(null);
    setEditingEntry(null);
    loadEntries(year, month);
    loadSummary(year);
  }

  function handleEntryDeleted(entryId: string) {
    setEntries(prev => prev.filter(e => e.entryId !== entryId));
    loadSummary(year);
  }

  return (
    <Layout title="Financeiro" backTo="/workshop">
      {/* Top bar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        {/* Year selector */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
          <button onClick={() => setYear(y => y - 1)} className="px-2 text-slate-400 hover:text-slate-700">‹</button>
          <span className="min-w-[3.5rem] text-center text-sm font-semibold text-slate-800">{year}</span>
          <button onClick={() => setYear(y => y + 1)} className="px-2 text-slate-400 hover:text-slate-700">›</button>
        </div>

        {/* View toggle */}
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setView('annual')}
            className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${view === 'annual' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Anual
          </button>
          <button
            onClick={() => { setView('monthly'); loadEntries(year, month); }}
            className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${view === 'monthly' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Mensal
          </button>
        </div>

        {/* Enviar ao Contador */}
        <button
          onClick={() => {
            if (view !== 'monthly') loadEntries(year, month);
            setShowContador(true);
          }}
          className="ml-auto flex items-center gap-1.5 rounded-xl bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 active:scale-95"
        >
          <span>📤</span> Contador
        </button>
      </div>

      {/* Content */}
      {apiError && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="mt-0.5 shrink-0 text-base">⚠️</span>
          <div>
            <p className="font-semibold">Erro ao carregar dados</p>
            <p className="mt-0.5 font-mono text-xs text-red-600">{apiError}</p>
          </div>
          <button onClick={() => { setApiError(null); loadSummary(year); }} className="ml-auto shrink-0 text-xs underline">Tentar novamente</button>
        </div>
      )}
      {summaryLoading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }, (_, i) => `skel-${i}`).map(k => (
            <div key={k} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      )}
      {!summaryLoading && view === 'annual' && (
        <AnnualView summaries={summaries} onSelectMonth={handleSelectMonth} />
      )}
      {!summaryLoading && view !== 'annual' && (
        <MonthlyView
          year={year}
          month={month}
          entries={entries}
          loading={entriesLoading}
          onChangeMonth={handleChangeMonth}
          onDelete={handleEntryDeleted}
          onEdit={entry => setEditingEntry(entry)}
          onAddRevenue={() => setModal('revenue')}
          onAddExpense={() => setModal('expense')}
        />
      )}

      {/* Modals */}
      {modal && (
        <EntryModal
          defaultType={modal}
          onClose={() => setModal(null)}
          onSaved={handleEntrySaved}
        />
      )}

      {editingEntry && (
        <EntryModal
          defaultType={editingEntry.type}
          editEntry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSaved={handleEntrySaved}
        />
      )}

      {showContador && (
        <ContadorMenu
          year={year}
          month={month}
          summaries={summaries}
          entries={entries}
          onClose={() => setShowContador(false)}
        />
      )}
    </Layout>
  );
}
