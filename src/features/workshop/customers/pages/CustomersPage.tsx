import { useCallback, useEffect, useState } from 'react';
import { Layout } from '../../../../shared';
import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
  type CreateCustomerInput,
  type Customer,
} from '../services/customers.service';

const INITIAL_FORM: CreateCustomerInput = {
  name: '',
  contact: '',
  email: '',
  notes: '',
};

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('pt-BR');
}

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<CreateCustomerInput>(INITIAL_FORM);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);

  const [search, setSearch] = useState('');

  const loadCustomers = useCallback(async (query = '', silent = false) => {
    if (silent) setIsFetching(true);
    try {
      const data = await listCustomers(query);
      setCustomers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar clientes');
    } finally {
      if (silent) setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await loadCustomers();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Falha ao carregar clientes');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [loadCustomers]);

  useEffect(() => {
    if (isLoading) return;

    const timer = globalThis.setTimeout(() => {
      void loadCustomers(search, true);
    }, 250);

    return () => globalThis.clearTimeout(timer);
  }, [search, isLoading, loadCustomers]);

  const totalCustomers = customers.length;
  let saveButtonLabel = 'Cadastrar cliente';
  if (isSaving) {
    saveButtonLabel = 'Salvando...';
  } else if (editingCustomerId) {
    saveButtonLabel = 'Salvar alterações';
  }

  function openNewForm() {
    setEditingCustomerId(null);
    setForm(INITIAL_FORM);
    setIsFormOpen(true);
    setError('');
  }

  function openEditForm(customer: Customer) {
    setEditingCustomerId(customer.customerId);
    setForm({
      name: customer.name,
      contact: customer.contact,
      email: customer.email ?? '',
      notes: customer.notes ?? '',
    });
    setIsFormOpen(true);
    setError('');
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingCustomerId(null);
    setForm(INITIAL_FORM);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.contact.trim()) {
      setError('Preencha os campos obrigatórios: Nome e Contato.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const payload: CreateCustomerInput = {
        name: form.name.trim(),
        contact: form.contact.trim(),
        ...(form.email?.trim() ? { email: form.email.trim() } : {}),
        ...(form.notes?.trim() ? { notes: form.notes.trim() } : {}),
      };

      if (editingCustomerId) {
        await updateCustomer(editingCustomerId, payload);
      } else {
        await createCustomer(payload);
      }

      await loadCustomers(search, true);

      closeForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar cliente');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(customerId: string) {
    if (!globalThis.confirm('Excluir este cliente?')) return;

    setDeletingCustomerId(customerId);
    setError('');

    try {
      await deleteCustomer(customerId);
      await loadCustomers(search, true);
      if (editingCustomerId === customerId) closeForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao excluir cliente');
    } finally {
      setDeletingCustomerId(null);
    }
  }

  return (
    <Layout title="Clientes" backTo="/workshop">
      {error && (
        <div className="fixed left-0 right-0 top-0 z-40 flex items-center gap-3 bg-red-600 px-4 py-3 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-white"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          <p className="flex-1 text-sm font-medium text-white">{error}</p>
          <button type="button" onClick={() => setError('')} aria-label="Fechar" className="flex h-7 w-7 items-center justify-center rounded-lg text-white/80 hover:bg-white/20 hover:text-white">✕</button>
        </div>
      )}

      <div className="mx-auto max-w-5xl space-y-4">
        <section className="overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-r from-orange-50 via-white to-amber-50 p-4 shadow-lg sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-black leading-tight text-slate-900 sm:text-2xl">Clientes da oficina</h2>
            </div>
            <button
              type="button"
              onClick={openNewForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-mecfix-orange px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M10 4a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 10 4Z" /></svg>
              Novo cliente
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, contato ou email"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">Total</p>
            <p className="text-lg font-black text-slate-900">{totalCustomers}</p>
            {isFetching && <p className="text-[10px] text-slate-400">Atualizando...</p>}
          </div>
        </section>

        {isFormOpen && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingCustomerId ? 'Editar cliente' : 'Novo cliente'}
              </h3>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
              >
                Fechar
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="customer-name" className="mb-1 block text-xs font-semibold text-slate-600">Nome *</label>
                <input
                  id="customer-name"
                  value={form.name}
                  onChange={(e) => setForm((curr) => ({ ...curr, name: e.target.value }))}
                  placeholder="Nome do cliente"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
                />
              </div>

              <div>
                <label htmlFor="customer-contact" className="mb-1 block text-xs font-semibold text-slate-600">Contato *</label>
                <input
                  id="customer-contact"
                  value={form.contact}
                  onChange={(e) => setForm((curr) => ({ ...curr, contact: e.target.value }))}
                  placeholder="WhatsApp, telefone ou email"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
                />
              </div>

              <div>
                <label htmlFor="customer-email" className="mb-1 block text-xs font-semibold text-slate-600">Email</label>
                <input
                  id="customer-email"
                  value={form.email ?? ''}
                  onChange={(e) => setForm((curr) => ({ ...curr, email: e.target.value }))}
                  placeholder="email@cliente.com"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
                />
              </div>

              <div>
                <label htmlFor="customer-notes" className="mb-1 block text-xs font-semibold text-slate-600">Observações</label>
                <input
                  id="customer-notes"
                  value={form.notes ?? ''}
                  onChange={(e) => setForm((curr) => ({ ...curr, notes: e.target.value }))}
                  placeholder="Preferências, detalhes, etc."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="rounded-xl bg-mecfix-orange px-4 py-2 text-sm font-bold text-white transition hover:bg-orange-600 disabled:opacity-60"
              >
                {saveButtonLabel}
              </button>
            </div>
          </section>
        )}

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        )}

        {!isLoading && customers.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 py-14 text-center">
            <div className="mb-2 text-4xl">👥</div>
            <p className="font-semibold text-slate-700">
              {search.trim() ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado ainda'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {search.trim() ? 'Tente outro termo de busca.' : 'Crie o primeiro cliente da oficina.'}
            </p>
            {!search.trim() && (
              <button
                type="button"
                onClick={openNewForm}
                className="mt-4 rounded-xl bg-mecfix-orange px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
              >
                + Novo cliente
              </button>
            )}
          </div>
        )}

        {!isLoading && customers.length > 0 && (
          <>
            <section className="space-y-2 md:hidden">
              {customers.map((customer) => {
                const deleting = deletingCustomerId === customer.customerId;

                return (
                  <article key={customer.customerId} className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-slate-900">{customer.name}</h3>
                        <p className="truncate text-xs text-slate-600">{customer.contact}</p>
                        {customer.email && <p className="truncate text-xs text-slate-500">{customer.email}</p>}
                      </div>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        {formatDate(customer.createdAt)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2.5">
                      <button
                        type="button"
                        onClick={() => openEditForm(customer)}
                        className="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(customer.customerId)}
                        disabled={deleting}
                        className="inline-flex flex-1 items-center justify-center rounded-lg border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deleting ? 'Excluindo...' : 'Excluir'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="hidden md:block">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Nome</th>
                        <th className="px-4 py-3 text-left font-semibold">Contato</th>
                        <th className="px-4 py-3 text-left font-semibold">Email</th>
                        <th className="px-4 py-3 text-left font-semibold">Observações</th>
                        <th className="px-4 py-3 text-left font-semibold">Desde</th>
                        <th className="px-4 py-3 text-right font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customers.map((customer) => {
                        const deleting = deletingCustomerId === customer.customerId;
                        return (
                          <tr key={customer.customerId} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 font-semibold text-slate-900">{customer.name}</td>
                            <td className="max-w-[220px] truncate px-4 py-3 text-slate-700">{customer.contact}</td>
                            <td className="max-w-[220px] truncate px-4 py-3 text-slate-600">{customer.email || '—'}</td>
                            <td className="max-w-[260px] truncate px-4 py-3 text-slate-600">{customer.notes || '—'}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(customer.createdAt)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditForm(customer)}
                                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDelete(customer.customerId)}
                                  disabled={deleting}
                                  className="rounded-lg border border-red-100 px-2.5 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50"
                                >
                                  {deleting ? 'Excluindo...' : 'Excluir'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </Layout>
  );
}

