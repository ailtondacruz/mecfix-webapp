import { useEffect, useState, type ComponentProps } from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { maskDocument, maskPhone, unmaskNumber } from '../utils/masks';

export interface CreateWorkshopPayload {
  name: string;
  address: string;
  documentType: 'cpf' | 'cnpj';
  documentNumber: string;
  email: string;
  phone: string;
  monthlyFee: number;
  billingDueDay: number;
  ownerName: string;
  ownerEmail: string;
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

type CreateWorkshopModalProps = Readonly<{
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWorkshopPayload) => Promise<void>;
}>;

export function CreateWorkshopModal({
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
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
        await onSubmit({
          ...formState,
          documentNumber: unmaskNumber(formState.documentNumber),
          phone: unmaskNumber(formState.phone),
          monthlyFee: Number(formState.monthlyFee),
          billingDueDay: Number(formState.billingDueDay),
        });
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
              O backend cria a oficina e provisiona o owner inicial com senha temporaria.
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
              placeholder="Ex: Mecanica Central"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="workshop-address" className="mb-2 block text-sm font-semibold text-slate-700">Endereco</label>
            <input
              id="workshop-address"
              value={formState.address}
              onChange={(event) => setFormState({ ...formState, address: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
              placeholder="Rua, numero, bairro, cidade - UF"
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
            <label htmlFor="workshop-document-number" className="mb-2 block text-sm font-semibold text-slate-700">Numero do documento</label>
            <input
              id="workshop-document-number"
              value={formState.documentNumber}
              onChange={(event) => setFormState({ ...formState, documentNumber: maskDocument(event.target.value, formState.documentType) })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
              placeholder={formState.documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0001-00'}
              inputMode="numeric"
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
              onChange={(event) => setFormState({ ...formState, phone: maskPhone(event.target.value) })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
              placeholder="(11) 99999-9999"
              inputMode="numeric"
            />
          </div>

          <div>
            <label htmlFor="workshop-monthly-fee" className="mb-2 block text-sm font-semibold text-slate-700">Valor mensal</label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-medium text-slate-500">R$</span>
              <input
                id="workshop-monthly-fee"
                inputMode="numeric"
                value={formState.monthlyFee === '0' ? '' : formState.monthlyFee}
                onChange={(event) => setFormState({ ...formState, monthlyFee: unmaskNumber(event.target.value) || '0' })}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 outline-none transition focus:border-mecfix-orange focus:ring-2 focus:ring-mecfix-orange/20"
                placeholder="99"
                required
              />
            </div>
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
            <p className="section-subtitle">Responsavel inicial</p>
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
