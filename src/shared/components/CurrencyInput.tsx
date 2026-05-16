import { useState } from 'react';

interface CurrencyInputProps {
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly placeholder?: string;
  readonly className?: string;
  readonly id?: string;
  readonly name?: string;
  readonly disabled?: boolean;
}

function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

export function CurrencyInput({ value, onChange, className, placeholder, ...rest }: CurrencyInputProps) {
  const [display, setDisplay] = useState<string>(() =>
    value > 0 ? formatBRL(Math.round(value * 100)) : '',
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '');
    const cents = digits.length > 0 ? parseInt(digits, 10) : 0;
    const formatted = cents > 0 ? formatBRL(cents) : '';
    setDisplay(formatted);
    onChange(cents / 100);
  }

  return (
    <input
      {...rest}
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      placeholder={placeholder ?? 'R$ 0,00'}
      className={className}
    />
  );
}
