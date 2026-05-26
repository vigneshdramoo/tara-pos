import type { ReactNode } from "react";

type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function PageIntro({ eyebrow, title, description, actions }: PageIntroProps) {
  return (
    <header className="tara-surface grid gap-4 rounded-[22px] p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-6 md:p-8">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--brand-gold)] sm:tracking-[0.38em]">
          {eyebrow}
        </p>
        <h2 className="mt-2 font-display text-4xl leading-none text-foreground sm:mt-3 sm:text-5xl md:text-6xl">
          {title}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)] sm:text-base md:mt-4 md:text-lg md:leading-7">
          {description}
        </p>
      </div>
      {actions ? <div className="flex items-center justify-start md:justify-end">{actions}</div> : null}
    </header>
  );
}
