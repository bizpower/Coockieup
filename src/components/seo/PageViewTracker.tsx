"use client";

import { useEffect } from "react";

/**
 * Conteggio visite di prima parte.
 *
 * Nessun cookie, nessun identificatore, nessun dato personale: una riga con
 * percorso e istante. Serve al KPI "traffico magazine" della dashboard, che
 * altrimenti sarebbe un numero inventato in attesa di Google Analytics.
 *
 * `keepalive` fa sopravvivere la richiesta al cambio pagina: senza, chi legge
 * il titolo e clicca subito altrove non verrebbe contato.
 */
export function PageViewTracker({ path }: { path: string }) {
  useEffect(() => {
    const controller = new AbortController();

    // Un attimo di attesa esclude i rimbalzi immediati e le anteprime
    // caricate dal prefetch del router.
    const timer = setTimeout(() => {
      void fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, referrer: document.referrer || null }),
        keepalive: true,
        signal: controller.signal,
      }).catch(() => {
        // Un conteggio mancato non è un problema che meriti di disturbare chi legge.
      });
    }, 1200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [path]);

  return null;
}
