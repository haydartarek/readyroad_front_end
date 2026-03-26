import { redirect } from "next/navigation";

// /analytics -> canonical dashboard section
export default function AnalyticsPage() {
  redirect("/dashboard?section=weak-areas");
}
