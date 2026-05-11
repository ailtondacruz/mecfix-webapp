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
          <div>
            <p className="section-title">Seção</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">{title}</h2>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
