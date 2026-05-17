import { buildHttpError, getAuthToken, readJsonSafely } from '../../../shared';
import type { WorkshopBillingDetails, WorkshopBillingOverview } from '../../../shared';

export async function getBillingOverview(): Promise<WorkshopBillingOverview> {
  const token = await getAuthToken();
  const response = await fetch('/api/workshops/billing/overview', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await readJsonSafely(response);
  if (!response.ok) {
    throw await buildHttpError(response, 'Falha ao carregar assinaturas.', 'BILLING-OVERVIEW-FETCH');
  }

  return payload.data as WorkshopBillingOverview;
}

export async function getWorkshopBillingDetails(workshopId: string): Promise<WorkshopBillingDetails> {
  const token = await getAuthToken();
  const response = await fetch(`/api/workshops/${workshopId}/billing/details`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await readJsonSafely(response);
  if (!response.ok) {
    throw await buildHttpError(response, 'Falha ao carregar detalhes da oficina.', 'BILLING-DETAILS-FETCH');
  }

  return payload.data as WorkshopBillingDetails;
}

export async function markInstallmentAsPaid(workshopId: string, periodKey: string): Promise<void> {
  const token = await getAuthToken();
  const response = await fetch(`/api/workshops/${workshopId}/billing/installments/${periodKey}/pay`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw await buildHttpError(response, 'Falha ao marcar parcela como paga.', 'BILLING-INSTALLMENT-PAY');
  }
}

export async function markInstallmentAsUnpaid(workshopId: string, periodKey: string): Promise<void> {
  const token = await getAuthToken();
  const response = await fetch(`/api/workshops/${workshopId}/billing/installments/${periodKey}/unpay`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw await buildHttpError(response, 'Falha ao marcar parcela como nao paga.', 'BILLING-INSTALLMENT-UNPAY');
  }
}
