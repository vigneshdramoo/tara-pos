import { AlertTriangle } from "lucide-react";
import { Surface } from "@/components/ui/surface";

export function StatusNotice({
  title = "Live data is unavailable",
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <Surface className="tara-alert-warning">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(200,142,77,0.16)] text-[var(--brand-amber)]">
            <AlertTriangle className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--brand-amber)]">Setup required</p>
            <h3 className="mt-2 text-xl font-semibold text-foreground">{title}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--muted-strong)]">{message}</p>
          </div>
        </div>
        <div className="rounded-[20px] bg-[rgba(255,251,246,0.82)] px-4 py-3 text-sm leading-7 text-[var(--muted-strong)]">
          Set `DATABASE_URL`, run `pnpm exec prisma migrate deploy`, then `pnpm db:seed` if the
          store is empty.
        </div>
      </div>
    </Surface>
  );
}
