import { NextRequest, NextResponse } from "next/server";
import { getYouTubeVideoPage } from "@/lib/server/youtube";
import { YOUTUBE_REVALIDATE_SECONDS } from "@/lib/youtube";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PAGE_TOKEN_PATTERN = /^[A-Za-z0-9._~-]{1,256}$/;

export async function GET(request: NextRequest) {
  const pageToken = request.nextUrl.searchParams.get("pageToken")?.trim() ?? "";

  if (pageToken && !PAGE_TOKEN_PATTERN.test(pageToken)) {
    return NextResponse.json(
      { error: "invalid_page_token" },
      { status: 400 },
    );
  }

  try {
    const page = await getYouTubeVideoPage(pageToken);
    return NextResponse.json(page, {
      headers: {
        "Cache-Control": `public, s-maxage=${YOUTUBE_REVALIDATE_SECONDS}, stale-while-revalidate=86400`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "youtube_temporarily_unavailable" },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
