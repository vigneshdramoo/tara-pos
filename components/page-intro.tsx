import type { ReactNode } from "react";

type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function PageIntro({ eyebrow, title, description, actions }: PageIntroProps) {
  return (
    <header className="tara-surface grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:p-8">
      <div>
        <p className="text-xs uppercase tracking-[0.38em] text-[var(--brand-gold)]">{eyebrow}</p>
        <h2 className="mt-3 font-display text-5xl leading-none text-foreground md:text-6xl">
          {title}
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)] md:text-lg">
          {description}
        </p>
      </div>
      {actions ? <div className="flex items-center justify-start md:justify-end">{actions}</div> : null}
    </header>
  );
}
