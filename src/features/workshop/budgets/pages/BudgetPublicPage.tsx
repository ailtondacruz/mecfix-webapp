import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getBudgetByToken, respondToBudget } from '../services/budgets.service';
import type { Budget } from '../../../../shared';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

type PageState = 'loading' | 'ready' | 'confirming' | 'done' | 'error';

function LoadingView() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <svg className="h-8 w-8 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-sm">Carregando orçamento…</p>
      </div>
    </div>
  );
}

function ErrorView({ message }: Readonly<{ message: string }>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <h2 className="mb-1 text-lg font-bold text-slate-900">Orçamento não encontrado</h2>
        <p className="text-sm text-slate-500">{message || 'O link pode estar incorreto ou expirado.'}</p>
      </div>
    </div>
  );
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function DoneView({ action, respondedAt }: Readonly<{ action: 'approve' | 'reject' | null; respondedAt: string | null }>) {
  const approved = action === 'approve';
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-8 text-center shadow-sm">
        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${approved ? 'bg-emerald-100' : 'bg-slate-100'}`}>
          {approved
            ? <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          }
        </div>
        <h2 className={`mb-1 text-xl font-bold ${approved ? 'text-emerald-700' : 'text-slate-700'}`}>
          {approved ? 'Orçamento aprovado!' : 'Orçamento recusado'}
        </h2>
        <p className="text-sm text-slate-500">
          {approved
            ? 'Obrigado! A oficina foi notificada e entrará em contato em breve.'
            : 'Tudo bem. A oficina foi informada da sua decisão.'}
        </p>
        {respondedAt && (
          <p className="mt-3 text-xs text-slate-400">
            {approved ? 'Aprovado' : 'Recusado'} em {formatDateTime(respondedAt)}
          </p>
        )}
      </div>
    </div>
  );
}

const STATUS_BANNER: Record<string, { className: string; text: string }> = {
  approved: { className: 'border-emerald-200 bg-emerald-50 text-emerald-800', text: '✓ Você aprovou este orçamento' },
  rejected: { className: 'border-red-200 bg-red-50 text-red-700',           text: '✗ Você recusou este orçamento' },
  expired:  { className: 'border-slate-200 bg-slate-100 text-slate-600',     text: 'Este orçamento expirou' },
};

function StatusBanner({ status, updatedAt }: Readonly<{ status: string; updatedAt?: string }>) {
  const cfg = STATUS_BANNER[status];
  if (!cfg) return null;
  const showDate = (status === 'approved' || status === 'rejected') && updatedAt;
  return (
    <div className={`rounded-xl border px-4 py-3 ${cfg.className}`}>
      <span className="text-sm font-semibold">{cfg.text}</span>
      {showDate && (
        <p className="mt-0.5 text-xs opacity-70">
          em {formatDateTime(updatedAt)}
        </p>
      )}
    </div>
  );
}

function ActionButtons({
  pageState,
  onApprove,
  onReject,
}: Readonly<{ pageState: PageState; onApprove: () => void; onReject: () => void }>) {
  if (pageState === 'confirming') {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-sm text-slate-500">
        <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Processando…
      </div>
    );
  }
  return (
    <>
      <button
        type="button"
        onClick={onApprove}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-base font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        Aprovar orçamento
      </button>
      <button
        type="button"
        onClick={onReject}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3.5 text-base font-semibold text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        Recusar
      </button>
    </>
  );
}

export function BudgetPublicPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [finalAction, setFinalAction] = useState<'approve' | 'reject' | null>(null);
  const [respondedAt, setRespondedAt] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!shareToken) return;
    getBudgetByToken(shareToken)
      .then((b) => { setBudget(b); setPageState('ready'); })
      .catch((e: unknown) => {
        setErrorMsg(e instanceof Error ? e.message : 'Orçamento não encontrado');
        setPageState('error');
      });
  }, [shareToken]);

  async function handleRespond(action: 'approve' | 'reject') {
    if (!shareToken) return;
    setPageState('confirming');
    try {
      const updated = await respondToBudget(shareToken, action);
      setBudget(updated);
      setFinalAction(action);
      setRespondedAt(new Date().toISOString());
      setPageState('done');
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Falha ao processar resposta');
      setPageState('ready');
    }
  }

  if (pageState === 'loading') return <LoadingView />;
  if (pageState === 'error' || !budget) return <ErrorView message={errorMsg} />;
  if (pageState === 'done') return <DoneView action={finalAction} respondedAt={respondedAt} />;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto w-full max-w-lg space-y-4">

        <div className="rounded-2xl bg-[#0B1C36] px-6 py-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-300">Orçamento</p>
          <h1 className="mt-1 text-2xl font-black">{budget.customerName}</h1>
          <p className="mt-0.5 text-sm text-blue-200">{budget.vehicleName} · {budget.vehiclePlate}</p>
        </div>

        <StatusBanner status={budget.status} updatedAt={budget.updatedAt} />

        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMsg}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span className="text-sm font-semibold text-slate-700">Serviços e Peças</span>
          </div>

          <div className="divide-y divide-slate-100">
            {budget.items.map((item, i) => (
              <div key={item.id ?? i} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{item.description}</p>
                  <span className={`mt-0.5 inline-block rounded-full px-2 py-px text-xs font-semibold ${item.type === 'service' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>
                    {item.type === 'service' ? 'Serviço' : 'Peça'}
                  </span>
                </div>
                <p className="shrink-0 text-sm font-bold text-slate-900">{formatCurrency(item.unitPrice)}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between bg-[#0B1C36] px-4 py-4">
            <span className="text-sm font-bold text-white">TOTAL</span>
            <span className="text-xl font-black text-amber-400">{formatCurrency(budget.total)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
          <span className="text-slate-500">Validade</span>
          <span className="font-semibold text-slate-800">
            {new Date(budget.validUntil).toLocaleDateString('pt-BR')}
            {' '}
            <span className="font-normal text-slate-400">({budget.validityDays} dias)</span>
          </span>
        </div>

        {budget.notes && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Observações</p>
            <p className="text-sm text-slate-700">{budget.notes}</p>
          </div>
        )}

        {budget.status === 'pending' && (
          <div className="space-y-3 pt-2">
            <ActionButtons
              pageState={pageState}
              onApprove={() => void handleRespond('approve')}
              onReject={() => void handleRespond('reject')}
            />
          </div>
        )}

        <a
          href={`/api/budgets/public/${shareToken}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="12" y2="18"/><line x1="15" y1="15" x2="12" y2="18"/></svg>
          Baixar PDF
        </a>

        <p className="pb-4 text-center text-xs text-slate-400">MecFix · Sistema de Gestão de Oficinas</p>
      </div>
    </div>
  );
}
