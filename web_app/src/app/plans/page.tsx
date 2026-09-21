import { redirect } from "next/navigation";
import { getRequestLocale } from "@/lib/server/request-locale";
import { localizeHref } from "@/lib/i18n-routing";

export default async function PlansPage() {
  const locale = await getRequestLocale();
  redirect(localizeHref("/#pricing", locale));
}
