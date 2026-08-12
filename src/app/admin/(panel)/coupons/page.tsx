import { CouponEditor } from "@/components/admin/CrudForms";
import { PageHeader, Panel } from "@/components/admin/ui";
import { db } from "@/lib/db";

export default async function AdminCouponsPage() {
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <>
      <PageHeader
        title="Codici sconto"
        description="Un codice si crea spento. Attivarlo è una decisione separata dal crearlo, e va presa consapevolmente."
      />

      <Panel>
        <CouponEditor
          coupons={coupons.map((coupon) => ({
            id: coupon.id,
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            minSubtotalCents: coupon.minSubtotalCents,
            usageLimit: coupon.usageLimit,
            usedCount: coupon.usedCount,
            expiresAt: coupon.expiresAt?.toISOString() ?? null,
            isActive: coupon.isActive,
          }))}
        />
      </Panel>
    </>
  );
}
