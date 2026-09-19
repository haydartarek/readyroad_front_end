import { Suspense } from "react";
import { CheckoutSuccess } from "@/components/payment/checkout-success";

export const metadata = { robots: { index: false, follow: false } };
export default function CheckoutSuccessPage() {
  return <Suspense><CheckoutSuccess /></Suspense>;
}
