import { Container, Section } from "@/components/ui/Layout";

/**
 * Stato di caricamento del negozio.
 *
 * Blocchi grigi della forma del contenuto in arrivo, non uno spinner al
 * centro: la pagina non salta quando i dati arrivano, e chi guarda capisce
 * già cosa sta per comparire.
 */
export default function Loading() {
  return (
    <Section aria-busy="true" aria-label="Caricamento in corso">
      <Container>
        <div className="animate-pulse">
          <div className="bg-crema h-3 w-24 rounded-full" />
          <div className="bg-crema mt-6 h-12 w-3/4 rounded-2xl sm:h-16" />
          <div className="bg-crema mt-4 h-5 w-full max-w-xl rounded-full" />
          <div className="bg-crema mt-2.5 h-5 w-2/3 max-w-md rounded-full" />

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <div key={index} className="bg-crema rounded-card h-72" />
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
