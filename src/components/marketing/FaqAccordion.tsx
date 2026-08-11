import type { FaqItem } from "@prisma/client";
import { UnconfirmedBadge } from "@/components/ui/Badge";
import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * FAQ costruite su <details>/<summary>.
 *
 * L'apertura, la navigazione da tastiera e l'annuncio dello stato sono nativi
 * del browser: zero JavaScript spedito al client e un comportamento che non si
 * rompe se lo script non arriva.
 */
export function FaqAccordion({ items, className }: { items: FaqItem[]; className?: string }) {
  if (items.length === 0) return null;

  return (
    <div className={cn("border-cacao-line border-t", className)}>
      {items.map((item) => (
        <details key={item.id} className="group border-cacao-line border-b">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
            <span className="font-display group-hover:text-fiamma text-lg font-bold tracking-tight transition-colors sm:text-xl">
              {item.question}
            </span>
            <ChevronDownIcon className="shrink-0 text-xl transition-transform duration-300 group-open:rotate-180" />
          </summary>
          <div className="pb-6">
            <p className="text-cacao-soft measure leading-relaxed">{item.answer}</p>
            {!item.isConfirmed && <UnconfirmedBadge className="mt-4" />}
          </div>
        </details>
      ))}
    </div>
  );
}
