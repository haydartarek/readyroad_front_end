"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  ExternalLink,
  Loader2,
  Play,
  RefreshCw,
  Search,
  Video,
  Youtube,
} from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  PageHeroDescription,
  PageHeroEyebrow,
  PageHeroSurface,
  PageHeroTitle,
} from "@/components/ui/page-surface";
import { useLanguage } from "@/contexts/language-context";
import {
  YOUTUBE_CHANNEL_URL,
  type YouTubeVideo,
  type YouTubeVideoPage,
} from "@/lib/youtube";

type VideoGalleryProps = {
  initialData: YouTubeVideoPage | null;
  initialError: boolean;
};

const DATE_LOCALES = {
  en: "en-BE-u-ca-gregory",
  nl: "nl-BE-u-ca-gregory",
  fr: "fr-BE-u-ca-gregory",
  ar: "ar-BE-u-ca-gregory",
} as const;

function mergeVideos(
  current: YouTubeVideo[],
  incoming: YouTubeVideo[],
): YouTubeVideo[] {
  const byId = new Map(current.map((video) => [video.videoId, video]));
  for (const video of incoming) byId.set(video.videoId, video);
  return [...byId.values()].sort(
    (left, right) =>
      Date.parse(right.publishedAt) - Date.parse(left.publishedAt),
  );
}

export function VideoGallery({
  initialData,
  initialError,
}: VideoGalleryProps) {
  const { t, language, isRTL } = useLanguage();
  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(initialError);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(DATE_LOCALES[language], {
        day: "numeric",
        month: "long",
        year: "numeric",
        calendar: "gregory",
      }),
    [language],
  );

  const filteredVideos = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(language);
    if (!normalizedQuery) return data?.videos ?? [];

    return (data?.videos ?? []).filter((video) =>
      `${video.title} ${video.description}`
        .toLocaleLowerCase(language)
        .includes(normalizedQuery),
    );
  }, [data?.videos, language, query]);

  const requestPage = async (pageToken = "") => {
    setIsLoading(true);
    setHasError(false);
    try {
      const endpoint = pageToken
        ? `/api/youtube/videos?pageToken=${encodeURIComponent(pageToken)}`
        : "/api/youtube/videos";
      const response = await fetch(endpoint, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("youtube_unavailable");

      const nextPage = (await response.json()) as YouTubeVideoPage;
      setData((current) =>
        current && pageToken
          ? {
              ...nextPage,
              videos: mergeVideos(current.videos, nextPage.videos),
            }
          : nextPage,
      );
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const featuredVideo = filteredVideos[0] ?? null;
  const remainingVideos = filteredVideos.slice(1);
  const channelUrl = data?.channel.url ?? YOUTUBE_CHANNEL_URL;

  return (
    <main
      className="min-h-screen bg-background text-foreground"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <Breadcrumb
          items={[
            { label: t("nav.home"), href: "/" },
            { label: t("videos.page_name"), isCurrentPage: true },
          ]}
        />

        <PageHeroSurface className="mb-8">
          <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 max-w-3xl space-y-3">
              <PageHeroEyebrow>{t("videos.page_name")}</PageHeroEyebrow>
              <PageHeroTitle>{t("videos.hero_title")}</PageHeroTitle>
              <PageHeroDescription className="max-w-2xl text-base leading-7">
                {t("videos.hero_description")}
              </PageHeroDescription>
            </div>
            <Button size="lg" variant="outline" asChild>
              <a
                href={channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
              >
                <Youtube className="h-5 w-5" aria-hidden="true" />
                {t("videos.visit_channel")}
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
          </div>
        </PageHeroSurface>

        {data?.stale ? (
          <div
            role="status"
            className="mb-6 flex min-w-0 items-start gap-3 rounded-xl border border-amber-300/60 bg-amber-50/70 p-4 text-sm text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-100"
          >
            <RefreshCw className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="min-w-0 break-words">{t("videos.stale_notice")}</p>
          </div>
        ) : null}

        {data && data.videos.length >= 4 ? (
          <div className="relative mb-6 max-w-xl">
            <Search
              className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("videos.search_placeholder")}
              aria-label={t("videos.search_label")}
              className="h-11 ps-11"
            />
          </div>
        ) : null}

        {!data && hasError ? (
          <VideoErrorState
            isLoading={isLoading}
            onRetry={() => void requestPage()}
            channelUrl={channelUrl}
          />
        ) : null}

        {data && data.videos.length === 0 && !hasError ? (
          <VideoEmptyState channelUrl={channelUrl} />
        ) : null}

        {data && data.videos.length > 0 && filteredVideos.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-sm">
            <Search className="mx-auto h-9 w-9 text-muted-foreground" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-black">
              {t("videos.no_search_results")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("videos.no_search_results_description")}
            </p>
          </div>
        ) : null}

        {featuredVideo ? (
          <section aria-labelledby="latest-video-heading" className="space-y-6">
            {!query ? (
              <FeaturedVideoCard
                video={featuredVideo}
                formattedDate={dateFormatter.format(
                  new Date(featuredVideo.publishedAt),
                )}
                onPlay={setSelectedVideo}
              />
            ) : null}

            <div className="flex min-w-0 items-end justify-between gap-4">
              <div className="min-w-0">
                <h2
                  id="latest-video-heading"
                  className="break-words text-xl font-black sm:text-2xl"
                >
                  {query
                    ? t("videos.search_results")
                    : t("videos.latest_videos")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("videos.video_count", {
                    count: filteredVideos.length,
                  })}
                </p>
              </div>
            </div>

            <div
              data-testid="videos-grid"
              className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
            >
              {(query ? filteredVideos : remainingVideos).map((video) => (
                <VideoCard
                  key={video.videoId}
                  video={video}
                  formattedDate={dateFormatter.format(
                    new Date(video.publishedAt),
                  )}
                  onPlay={setSelectedVideo}
                />
              ))}
            </div>

            {!query && data?.nextPageToken ? (
              <div className="flex justify-center pt-2">
                <Button
                  data-testid="videos-load-more"
                  type="button"
                  size="lg"
                  variant="outline"
                  disabled={isLoading}
                  onClick={() => void requestPage(data?.nextPageToken ?? "")}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  )}
                  {isLoading ? t("videos.loading_more") : t("videos.load_more")}
                </Button>
              </div>
            ) : null}

            {hasError && (data?.videos.length ?? 0) > 0 ? (
              <p role="alert" className="text-center text-sm text-destructive">
                {t("videos.load_more_error")}
              </p>
            ) : null}
          </section>
        ) : null}
      </div>

      <Dialog
        open={selectedVideo !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedVideo(null);
        }}
      >
        <DialogContent
          className="w-[calc(100%-1.5rem)] max-w-4xl gap-4 p-3 sm:p-5"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <DialogHeader className="pe-9 text-start">
            <DialogTitle className="break-words leading-6">
              {selectedVideo?.title}
            </DialogTitle>
            <DialogDescription>
              {t("videos.external_media_notice")}
            </DialogDescription>
          </DialogHeader>
          {selectedVideo ? (
            <div className="aspect-video min-h-[200px] w-full overflow-hidden rounded-xl bg-black">
              <iframe
                data-testid="youtube-player"
                src={`${selectedVideo.embedUrl}?rel=0`}
                title={t("videos.player_title", {
                  title: selectedVideo.title,
                })}
                className="h-full w-full border-0"
                loading="lazy"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function FeaturedVideoCard({
  video,
  formattedDate,
  onPlay,
}: {
  video: YouTubeVideo;
  formattedDate: string;
  onPlay: (video: YouTubeVideo) => void;
}) {
  const { t } = useLanguage();

  return (
    <Card className="overflow-hidden p-0 lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <VideoThumbnail
        video={video}
        label={t("videos.watch_video")}
        sizes="(max-width: 1024px) 100vw, 60vw"
        onPlay={onPlay}
      />
      <CardContent className="flex min-w-0 flex-col justify-center p-5 sm:p-7">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          <Video className="h-3.5 w-3.5" aria-hidden="true" />
          {t("videos.featured_label")}
        </span>
        <h2 className="mt-4 break-words text-xl font-black leading-8 sm:text-2xl">
          {video.title}
        </h2>
        <PublishedDate value={formattedDate} />
        {video.description ? (
          <p className="mt-4 line-clamp-3 break-words text-sm leading-6 text-muted-foreground">
            {video.description}
          </p>
        ) : null}
        <Button
          type="button"
          size="lg"
          className="mt-6 w-full sm:w-fit"
          onClick={() => onPlay(video)}
        >
          <Play className="h-4 w-4" aria-hidden="true" />
          {t("videos.watch_video")}
        </Button>
      </CardContent>
    </Card>
  );
}

function VideoCard({
  video,
  formattedDate,
  onPlay,
}: {
  video: YouTubeVideo;
  formattedDate: string;
  onPlay: (video: YouTubeVideo) => void;
}) {
  const { t } = useLanguage();

  return (
    <Card data-testid="video-card" className="h-full overflow-hidden p-0">
      <VideoThumbnail
        video={video}
        label={t("videos.watch_video")}
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        onPlay={onPlay}
      />
      <CardContent className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-3 break-words text-base font-black leading-6">
          {video.title}
        </h3>
        <PublishedDate value={formattedDate} />
        {video.description ? (
          <p className="mt-3 line-clamp-3 break-words text-sm leading-6 text-muted-foreground">
            {video.description}
          </p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="mt-5 w-full"
          onClick={() => onPlay(video)}
        >
          <Play className="h-4 w-4" aria-hidden="true" />
          {t("videos.watch_video")}
        </Button>
      </CardContent>
    </Card>
  );
}

function VideoThumbnail({
  video,
  label,
  sizes,
  onPlay,
}: {
  video: YouTubeVideo;
  label: string;
  sizes: string;
  onPlay: (video: YouTubeVideo) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPlay(video)}
      aria-label={`${label}: ${video.title}`}
      className="group relative block aspect-video w-full overflow-hidden bg-muted text-start focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-primary/30"
    >
      <Image
        src={video.thumbnail.url}
        alt={video.title}
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />
      <span className="absolute inset-0 bg-foreground/15 transition-colors group-hover:bg-foreground/25" />
      <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background/95 text-primary shadow-lg ring-1 ring-border/50 transition-transform group-hover:scale-105">
        <Play className="ms-0.5 h-6 w-6" fill="currentColor" aria-hidden="true" />
      </span>
    </button>
  );
}

function PublishedDate({ value }: { value: string }) {
  const { t } = useLanguage();
  return (
    <p className="mt-3 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
      <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="break-words">
        {t("videos.published_on", { date: value })}
      </span>
    </p>
  );
}

function VideoErrorState({
  isLoading,
  onRetry,
  channelUrl,
}: {
  isLoading: boolean;
  onRetry: () => void;
  channelUrl: string;
}) {
  const { t } = useLanguage();
  return (
    <section
      role="alert"
      className="rounded-2xl border border-border/60 bg-card p-6 text-center shadow-sm sm:p-10"
    >
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Video className="h-7 w-7" aria-hidden="true" />
      </span>
      <h2 className="mt-5 text-xl font-black">{t("videos.error_title")}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        {t("videos.error_description")}
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button
          data-testid="videos-retry"
          type="button"
          disabled={isLoading}
          onClick={onRetry}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          )}
          {t("common.retry")}
        </Button>
        <Button variant="outline" asChild>
          <a href={channelUrl} target="_blank" rel="noopener noreferrer">
            <Youtube className="h-4 w-4" aria-hidden="true" />
            {t("videos.visit_channel")}
          </a>
        </Button>
      </div>
    </section>
  );
}

function VideoEmptyState({ channelUrl }: { channelUrl: string }) {
  const { t } = useLanguage();
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-sm">
      <Video className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-black">{t("videos.empty_title")}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        {t("videos.empty_description")}
      </p>
      <Button className="mt-5" variant="outline" asChild>
        <a href={channelUrl} target="_blank" rel="noopener noreferrer">
          <Youtube className="h-4 w-4" aria-hidden="true" />
          {t("videos.visit_channel")}
        </a>
      </Button>
    </section>
  );
}
