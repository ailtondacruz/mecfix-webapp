interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  readonly label?: string;
  readonly error?: string;
  readonly helperText?: string;
}

export function Input({ label, error, helperText, ...props }: Readonly<InputProps>) {
  return (
    <div className="mb-4">
      {label && (
        <label className="mb-2 block text-sm font-semibold text-slate-800">
          {label}
        </label>
      )}
      <input className="input-field" {...props} />
      {error && <p className="mt-1 text-sm font-medium text-red-600">{error}</p>}
      {helperText && <p className="mt-1 text-sm text-slate-500">{helperText}</p>}
    </div>
  );
}
