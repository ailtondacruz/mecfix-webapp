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

export async function resetOwnerPassword(workshopId: string): Promise<{ email: string; temporaryPassword: string }> {
  const token = await getAuthToken();
  const response = await fetch(`/api/workshops/${workshopId}/owner/reset-password`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await readJsonSafely(response);
  if (!response.ok) {
    throw await buildHttpError(response, 'Falha ao resetar a senha do owner.', 'OWNER-RESET-PASSWORD');
  }

  return payload.data as { email: string; temporaryPassword: string };
}

export async function markAsPaid(workshopId: string): Promise<void> {
  const token = await getAuthToken();
  const response = await fetch(`/api/workshops/${workshopId}/billing/pay`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw await buildHttpError(response, 'Falha ao marcar como pago.', 'BILLING-MARK-PAID');
  }
}

export async function markAsUnpaid(workshopId: string): Promise<void> {
  const token = await getAuthToken();
  const response = await fetch(`/api/workshops/${workshopId}/billing/unpay`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw await buildHttpError(response, 'Falha ao marcar como não pago.', 'BILLING-MARK-UNPAID');
  }
}

export async function deleteWorkshop(workshopId: string): Promise<void> {
  const token = await getAuthToken();
  const response = await fetch(`/api/workshops/${workshopId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw await buildHttpError(response, 'Falha ao excluir a oficina.', 'WORKSHOP-DELETE');
  }
}

export interface UpdateWorkshopPayload {
  name?: string;
  email?: string;
  phone?: string;
  monthlyFee?: number;
  billingDueDay?: number;
  status?: 'active' | 'blocked';
}

export async function updateWorkshop(workshopId: string, data: UpdateWorkshopPayload): Promise<void> {
  const token = await getAuthToken();
  const response = await fetch(`/api/workshops/${workshopId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw await buildHttpError(response, 'Falha ao atualizar a oficina.', 'WORKSHOP-UPDATE');
  }
}
