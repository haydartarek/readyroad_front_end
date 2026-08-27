import "server-only";

import { unstable_cache } from "next/cache";
import {
  parseYouTubeChannelResponse,
  parseYouTubePlaylistResponse,
  YOUTUBE_CHANNEL_HANDLE,
  YOUTUBE_PAGE_SIZE,
  YOUTUBE_REVALIDATE_SECONDS,
  type YouTubeChannel,
  type YouTubeVideoPage,
} from "@/lib/youtube";
import { getPublicBackendApiUrl } from "@/lib/server/public-catalog";

const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";
const YOUTUBE_CACHE_TAG = "rijvia-youtube-videos";

let lastSuccessfulChannel: YouTubeChannel | null = null;
const lastSuccessfulPages = new Map<string, YouTubeVideoPage>();

export class YouTubeDataError extends Error {
  constructor(
    public readonly code:
      | "missing_api_key"
      | "channel_not_found"
      | "invalid_response"
      | "upstream_error",
  ) {
    super(code);
    this.name = "YouTubeDataError";
  }
}

function getYouTubeApiKey(): string {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (!apiKey) throw new YouTubeDataError("missing_api_key");
  return apiKey;
}

async function requestYouTubeApi(
  resource: "channels" | "playlistItems",
  params: Record<string, string>,
): Promise<unknown> {
  const url = new URL(`${YOUTUBE_API_BASE_URL}/${resource}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("key", getYouTubeApiKey());

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    throw new YouTubeDataError("upstream_error");
  }

  if (!response.ok) {
    throw new YouTubeDataError("upstream_error");
  }

  try {
    return await response.json();
  } catch {
    throw new YouTubeDataError("invalid_response");
  }
}

async function fetchChannel(): Promise<YouTubeChannel> {
  const payload = await requestYouTubeApi("channels", {
    part: "snippet,contentDetails",
    forHandle: YOUTUBE_CHANNEL_HANDLE,
  });
  const channel = parseYouTubeChannelResponse(payload);
  if (!channel) throw new YouTubeDataError("channel_not_found");
  return channel;
}

async function fetchVideoPage(
  uploadsPlaylistId: string,
  pageToken: string,
): Promise<YouTubeVideoPage> {
  const channel = await getYouTubeChannel();
  const payload = await requestYouTubeApi("playlistItems", {
    part: "snippet,contentDetails,status",
    playlistId: uploadsPlaylistId,
    maxResults: String(YOUTUBE_PAGE_SIZE),
    ...(pageToken ? { pageToken } : {}),
  });
  const parsed = parseYouTubePlaylistResponse(payload, channel.title);

  return {
    channel,
    ...parsed,
    stale: false,
  };
}

async function fetchPersistedVideoPage(
  pageToken: string,
): Promise<YouTubeVideoPage | null> {
  const url = new URL(`${getPublicBackendApiUrl()}/youtube/videos`);
  if (pageToken) url.searchParams.set("pageToken", pageToken);

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as YouTubeVideoPage;
  } catch {
    return null;
  }
}

const getCachedYouTubeChannel = unstable_cache(
  fetchChannel,
  ["rijvia", "youtube", "channel", YOUTUBE_CHANNEL_HANDLE],
  {
    revalidate: YOUTUBE_REVALIDATE_SECONDS,
    tags: [YOUTUBE_CACHE_TAG],
  },
);

const getCachedYouTubeVideoPage = unstable_cache(
  fetchVideoPage,
  ["rijvia", "youtube", "uploads", String(YOUTUBE_PAGE_SIZE)],
  {
    revalidate: YOUTUBE_REVALIDATE_SECONDS,
    tags: [YOUTUBE_CACHE_TAG],
  },
);

export async function getYouTubeChannel(): Promise<YouTubeChannel> {
  try {
    const channel = await getCachedYouTubeChannel();
    lastSuccessfulChannel = channel;
    return channel;
  } catch (error) {
    if (lastSuccessfulChannel) return lastSuccessfulChannel;
    if (error instanceof YouTubeDataError) throw error;
    throw new YouTubeDataError("upstream_error");
  }
}

export async function getYouTubeVideoPage(
  pageToken = "",
): Promise<YouTubeVideoPage> {
  const persisted = await fetchPersistedVideoPage(pageToken);
  if (persisted) {
    lastSuccessfulChannel = persisted.channel;
    lastSuccessfulPages.set(
      `${persisted.channel.uploadsPlaylistId}:${pageToken}`,
      persisted,
    );
    return persisted;
  }

  const channel = await getYouTubeChannel();
  const cacheKey = `${channel.uploadsPlaylistId}:${pageToken}`;

  try {
    const page = await getCachedYouTubeVideoPage(
      channel.uploadsPlaylistId,
      pageToken,
    );
    lastSuccessfulPages.set(cacheKey, page);
    return page;
  } catch (error) {
    const fallback = lastSuccessfulPages.get(cacheKey);
    if (fallback) return { ...fallback, stale: true };
    if (error instanceof YouTubeDataError) throw error;
    throw new YouTubeDataError("upstream_error");
  }
}
