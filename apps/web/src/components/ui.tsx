import type { HTMLAttributes, ReactNode } from 'react';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={`mf-card ${className}`} {...props} />;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mf-section-header">
      <div>
        {eyebrow && <p className="mf-eyebrow">{eyebrow}</p>}
        <h2 className="mf-section-title">{title}</h2>
        {description && <p className="mf-section-description">{description}</p>}
      </div>
      {action && <div className="mf-section-action">{action}</div>}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mf-page-header">
      <div>
        {eyebrow && <p className="mf-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="mf-page-action">{action}</div>}
    </header>
  );
}

export function Metric({
  label,
  value,
  unit,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  unit?: ReactNode;
  tone?: 'default' | 'lime' | 'orange' | 'blue';
}) {
  return (
    <div className={`mf-metric mf-metric-${tone}`}>
      <span className="mf-metric-label">{label}</span>
      <strong>{value}</strong>
      {unit && <span className="mf-metric-unit">{unit}</span>}
    </div>
  );
}

export function StatusPill({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning';
}) {
  return <span className={`mf-pill mf-pill-${tone}`}>{children}</span>;
}
