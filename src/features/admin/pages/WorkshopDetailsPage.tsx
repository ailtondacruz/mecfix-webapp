import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Card, Layout } from '../../../shared';
import type { WorkshopBillingDetails, WorkshopBillingInstallment } from '../../../shared';
import {
  getWorkshopBillingDetails,
  markInstallmentAsPaid,
  markInstallmentAsUnpaid,
} from '../services/billing.service';

function formatBRL(value: number | undefined): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);
}

function formatDate(value: string | undefined): string {
  if (!value) {
    return 'Não definido';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Não definido';
  }

  return date.toLocaleDateString('pt-BR');
}

export function WorkshopDetailsPage() {
  const { workshopId } = useParams<{ workshopId: string }>();
  const [details, setDetails] = useState<WorkshopBillingDetails | null>(null);
  const [installments, setInstallments] = useState<WorkshopBillingInstallment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  async function refreshWorkshop() {
    if (!workshopId) {
      return;
    }

    const response = await getWorkshopBillingDetails(workshopId);
    setDetails(response);
    setInstallments(response.installments ?? []);
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

  async function handleInstallmentAction(installment: WorkshopBillingInstallment) {
    if (!workshopId || !installment.nextAction) {
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      if (installment.nextAction.type === 'pay') {
        await markInstallmentAsPaid(workshopId, installment.periodKey);
      } else {
        await markInstallmentAsUnpaid(workshopId, installment.periodKey);
      }

      await refreshWorkshop();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Falha ao atualizar parcela');
    } finally {
      setIsSaving(false);
    }
  }

  const workshop = details?.workshop ?? null;

  return (
    <Layout title="Detalhe da Oficina" backTo="/admin">
      <div className="space-y-6">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <Card>
          {isLoading ? (
            <div className="py-10 text-center text-slate-500">Carregando oficina...</div>
          ) : workshop ? (
            <div>
              <p className="section-subtitle">
                {workshop.documentType.toUpperCase()} {workshop.documentNumber}
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">{workshop.name}</h1>
              <p className="mt-3 text-sm text-slate-600">{workshop.address}</p>
              <p className="mt-1 text-sm text-slate-600">{workshop.email}</p>
              <p className="mt-1 text-sm text-slate-600">{workshop.phone || 'Sem telefone cadastrado'}</p>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-500">Oficina não encontrada.</div>
          )}
        </Card>

        <Card title="Parcelas mensais">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="hidden grid-cols-6 gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 sm:grid">
              <span>Parcela</span>
              <span>Vencimento</span>
              <span>Valor</span>
              <span>Status</span>
              <span>Pagamento</span>
              <span>Ação</span>
            </div>
            <div className="divide-y divide-slate-100">
              {installments.map((installment) => (
                <div key={installment.periodKey} className="grid grid-cols-1 gap-3 px-4 py-4 text-sm sm:grid-cols-6 sm:items-center sm:gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">Parcela {installment.periodKey}</p>
                  </div>
                  <p>{formatDate(installment.dueAt)}</p>
                  <p>{formatBRL(installment.amount)}</p>
                  <p>{installment.statusLabel ?? installment.status}</p>
                  <p>{installment.paidAt ? formatDate(installment.paidAt) : 'Não pago'}</p>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {installment.nextAction ? (
                      <Button
                        type="button"
                        variant={installment.nextAction.type === 'unpay' ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => void handleInstallmentAction(installment)}
                        isLoading={isSaving}
                      >
                        {installment.nextAction.label}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
              {installments.length === 0 ? (
                <div className="px-4 py-8 text-sm text-slate-500">Sem parcelas disponíveis.</div>
              ) : null}
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
