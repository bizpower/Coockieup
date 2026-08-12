import type { Metadata } from "next";
import { PackStack } from "@/components/brand/PackShot";
import { CartLines } from "@/components/commerce/CartLines";
import { CouponForm } from "@/components/commerce/CouponForm";
import { FreeShippingMeter } from "@/components/commerce/FreeShippingMeter";
import { OrderSummary } from "@/components/commerce/OrderSummary";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Container, Section } from "@/components/ui/Layout";
import { getCartView } from "@/services/cart";

export const metadata: Metadata = {
  title: "Carrello",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const cart = await getCartView();

  if (cart.lines.length === 0) {
    return (
      <Section>
        <Container size="narrow" className="text-center">
          <div className="mx-auto w-40 opacity-40">
            <PackStack count={1} />
          </div>
          <h1 className="text-display mt-8">Il carrello è vuoto.</h1>
          <p className="text-lead text-cacao-soft mt-4">
            Situazione reversibile: servono trenta secondi.
          </p>
          <ButtonLink href="/shop" size="lg" className="mt-8">
            Vai allo shop
            <ArrowRightIcon />
          </ButtonLink>
        </Container>
      </Section>
    );
  }

  return (
    <Section>
      <Container>
        <h1 className="text-display">Carrello</h1>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
          <div>
            {cart.totals.freeShippingThresholdCents !== null && (
              <FreeShippingMeter
                missingCents={cart.totals.toFreeShippingCents}
                thresholdCents={cart.totals.freeShippingThresholdCents}
                className="mb-6"
              />
            )}

            <CartLines lines={cart.lines} />

            <div className="mt-6 max-w-sm">
              <CouponForm
                appliedCode={cart.couponCode}
                errorFromTotals={cart.totals.couponError}
              />
            </div>
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <OrderSummary totals={cart.totals} couponCode={cart.couponCode}>
              <ButtonLink href="/checkout" size="lg" className="mt-6 w-full">
                Vai alla cassa
                <ArrowRightIcon />
              </ButtonLink>
              <ButtonLink href="/shop" variant="ghost" size="sm" className="mt-2 w-full">
                Continua a comprare
              </ButtonLink>
            </OrderSummary>
          </div>
        </div>
      </Container>
    </Section>
  );
}
