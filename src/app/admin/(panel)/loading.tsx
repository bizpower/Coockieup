/** Caricamento del pannello: la stessa struttura delle pagine che sostituisce. */
export default function AdminLoading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Caricamento in corso">
      <div className="bg-crema-deep h-9 w-56 rounded-xl" />
      <div className="bg-crema-deep mt-3 h-4 w-96 max-w-full rounded-full" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="bg-crema-deep h-28 rounded-2xl" />
        ))}
      </div>

      <div className="bg-crema-deep mt-6 h-80 rounded-2xl" />
    </div>
  );
}
