interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, children, className = '', ...props }: Readonly<CardProps>) {
  return (
    <div className={`card ${className}`} {...props}>
      {title && (
        <div className="card-header">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h2>
        </div>
      )}
      {children}
    </div>
  );
}
