import { redirect } from "next/navigation";

// /analytics → redirect to weak-areas
// Both sub-pages are directly accessible from the sidebar.
export default function AnalyticsPage() {
  redirect("/analytics/weak-areas");
}
