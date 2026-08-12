import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { CartDrawer } from "@/components/commerce/CartDrawer";
import { CartUIProvider } from "@/components/commerce/CartUIProvider";
import { getCartView } from "@/services/cart";

/**
 * Struttura del negozio e delle pagine editoriali.
 *
 * Il carrello viene letto qui una volta sola e passato sia alla navbar sia al
 * pannello laterale: `getCartView` è avvolta in `cache()`, quindi la query non
 * si ripete. Leggere il cookie del carrello rende dinamiche le rotte sotto
 * questo layout — è il prezzo di avere il contatore corretto già nell'HTML,
 * senza il salto da zero a tre dopo l'idratazione.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const cart = await getCartView();

  return (
    <CartUIProvider>
      <AnnouncementBar />
      <Navbar cartCount={cart.itemCount} />
      <main id="contenuto">{children}</main>
      <Footer />
      <CartDrawer cart={cart} />
    </CartUIProvider>
  );
}
