interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: 'primary' | 'secondary' | 'outline';
  readonly size?: 'sm' | 'md' | 'lg';
  readonly isLoading?: boolean;
  readonly children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  disabled,
  className,
  ...props
}: Readonly<ButtonProps>) {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
  }[variant];

  const sizeClass = {
    sm: 'btn-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  }[size];

  return (
    <button
      className={[variantClass, sizeClass, className].filter(Boolean).join(' ')}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <span className="opacity-80">Carregando...</span> : children}
    </button>
  );
}
