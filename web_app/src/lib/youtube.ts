export const YOUTUBE_CHANNEL_HANDLE = "@RijBewijsBe";
export const YOUTUBE_CHANNEL_URL =
  "https://www.youtube.com/@RijBewijsBe/featured";
export const YOUTUBE_REVALIDATE_SECONDS = 24 * 60 * 60;
export const YOUTUBE_PAGE_SIZE = 13;

const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const UNAVAILABLE_TITLES = new Set(["private video", "deleted video"]);

export type YouTubeThumbnail = {
  url: string;
  width?: number;
  height?: number;
};

export type YouTubeChannel = {
  id: string;
  handle: string;
  title: string;
  description: string;
  thumbnail: YouTubeThumbnail | null;
  uploadsPlaylistId: string;
  url: string;
};

export type YouTubeVideo = {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnail: YouTubeThumbnail;
  channelTitle: string;
  position: number;
  watchUrl: string;
  embedUrl: string;
};

export type YouTubeVideoPage = {
  channel: YouTubeChannel;
  videos: YouTubeVideo[];
  nextPageToken: string | null;
  stale: boolean;
};

type RawThumbnail = {
  url?: unknown;
  width?: unknown;
  height?: unknown;
};

type RawThumbnailSet = Record<string, RawThumbnail | undefined>;

type RawChannelResponse = {
  items?: Array<{
    id?: unknown;
    snippet?: {
      title?: unknown;
      description?: unknown;
      thumbnails?: RawThumbnailSet;
    };
    contentDetails?: {
      relatedPlaylists?: { uploads?: unknown };
    };
  }>;
};

type RawPlaylistResponse = {
  nextPageToken?: unknown;
  items?: Array<{
    snippet?: {
      title?: unknown;
      description?: unknown;
      publishedAt?: unknown;
      channelTitle?: unknown;
      position?: unknown;
      thumbnails?: RawThumbnailSet;
      resourceId?: { videoId?: unknown };
    };
    contentDetails?: {
      videoId?: unknown;
      videoPublishedAt?: unknown;
    };
    status?: { privacyStatus?: unknown };
  }>;
};

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function asPositiveNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

function selectThumbnail(
  thumbnails: RawThumbnailSet | undefined,
): YouTubeThumbnail | null {
  for (const key of ["maxres", "standard", "high", "medium", "default"]) {
    const candidate = thumbnails?.[key];
    const url = asNonEmptyString(candidate?.url);
    if (!url?.startsWith("https://")) continue;

    return {
      url,
      width: asPositiveNumber(candidate?.width),
      height: asPositiveNumber(candidate?.height),
    };
  }

  return null;
}

function normalizeDescription(value: unknown): string {
  const description = asNonEmptyString(value)?.replace(/\s+/g, " ") ?? "";
  if (description.length <= 500) return description;
  return `${description.slice(0, 497).trimEnd()}...`;
}

function normalizePublishedAt(value: unknown): string | null {
  const publishedAt = asNonEmptyString(value);
  if (!publishedAt || Number.isNaN(Date.parse(publishedAt))) return null;
  return new Date(publishedAt).toISOString();
}

export function isValidYouTubeVideoId(value: string): boolean {
  return VIDEO_ID_PATTERN.test(value);
}

export function parseYouTubeChannelResponse(
  payload: unknown,
): YouTubeChannel | null {
  const response = payload as RawChannelResponse;
  const item = response.items?.[0];
  const id = asNonEmptyString(item?.id);
  const title = asNonEmptyString(item?.snippet?.title);
  const uploadsPlaylistId = asNonEmptyString(
    item?.contentDetails?.relatedPlaylists?.uploads,
  );

  if (!id || !title || !uploadsPlaylistId) return null;

  return {
    id,
    handle: YOUTUBE_CHANNEL_HANDLE,
    title,
    description: normalizeDescription(item?.snippet?.description),
    thumbnail: selectThumbnail(item?.snippet?.thumbnails),
    uploadsPlaylistId,
    url: YOUTUBE_CHANNEL_URL,
  };
}

export function parseYouTubePlaylistResponse(
  payload: unknown,
  channelTitle: string,
): Pick<YouTubeVideoPage, "videos" | "nextPageToken"> {
  const response = payload as RawPlaylistResponse;
  const seen = new Set<string>();
  const videos: YouTubeVideo[] = [];

  for (const item of response.items ?? []) {
    const privacyStatus = asNonEmptyString(item.status?.privacyStatus);
    if (privacyStatus && privacyStatus !== "public") continue;

    const videoId =
      asNonEmptyString(item.contentDetails?.videoId) ??
      asNonEmptyString(item.snippet?.resourceId?.videoId);
    const title = asNonEmptyString(item.snippet?.title);
    const publishedAt = normalizePublishedAt(
      item.contentDetails?.videoPublishedAt ?? item.snippet?.publishedAt,
    );
    const thumbnail = selectThumbnail(item.snippet?.thumbnails);

    if (
      !videoId ||
      !isValidYouTubeVideoId(videoId) ||
      seen.has(videoId) ||
      !title ||
      UNAVAILABLE_TITLES.has(title.toLowerCase()) ||
      !publishedAt ||
      !thumbnail
    ) {
      continue;
    }

    seen.add(videoId);
    videos.push({
      videoId,
      title,
      description: normalizeDescription(item.snippet?.description),
      publishedAt,
      thumbnail,
      channelTitle:
        asNonEmptyString(item.snippet?.channelTitle) ?? channelTitle,
      position:
        typeof item.snippet?.position === "number" &&
        Number.isInteger(item.snippet.position)
          ? item.snippet.position
          : videos.length,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
    });
  }

  videos.sort(
    (left, right) =>
      Date.parse(right.publishedAt) - Date.parse(left.publishedAt),
  );

  return {
    videos,
    nextPageToken: asNonEmptyString(response.nextPageToken),
  };
}
