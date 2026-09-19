import { getBackendUrl } from "@/lib/server/auth";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response(null, { status: 400 });
  try {
    // Forward the exact signed bytes. This endpoint trusts only backend signature verification.
    const response = await fetch(`${getBackendUrl()}/stripe/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Stripe-Signature": signature },
      body: await request.arrayBuffer(),
      cache: "no-store",
      signal: AbortSignal.timeout(25_000),
    });
    return new Response(null, { status: response.status });
  } catch {
    // Non-2xx lets Stripe retry; never acknowledge a payment that the backend did not commit.
    return new Response(null, { status: 503 });
  }
}
