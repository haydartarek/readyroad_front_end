import {
  parseYouTubeChannelResponse,
  parseYouTubePlaylistResponse,
  YOUTUBE_CHANNEL_HANDLE,
  YOUTUBE_CHANNEL_URL,
} from "@/lib/youtube";

const thumbnail = {
  high: {
    url: "https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg",
    width: 480,
    height: 360,
  },
};

describe("YouTube data normalization", () => {
  it("resolves channel metadata and the uploads playlist", () => {
    expect(
      parseYouTubeChannelResponse({
        items: [
          {
            id: "UC-readyroad",
            snippet: {
              title: "RijVia",
              description: "Belgian driving theory videos",
              thumbnails: thumbnail,
            },
            contentDetails: {
              relatedPlaylists: { uploads: "UU-readyroad" },
            },
          },
        ],
      }),
    ).toEqual({
      id: "UC-readyroad",
      handle: YOUTUBE_CHANNEL_HANDLE,
      title: "RijVia",
      description: "Belgian driving theory videos",
      thumbnail: thumbnail.high,
      uploadsPlaylistId: "UU-readyroad",
      url: YOUTUBE_CHANNEL_URL,
    });
  });

  it("keeps public videos, removes invalid duplicates, and sorts newest first", () => {
    const result = parseYouTubePlaylistResponse(
      {
        nextPageToken: "NEXT_PAGE",
        items: [
          {
            snippet: {
              title: "Older lesson",
              description: "First lesson",
              channelTitle: "RijVia",
              position: 2,
              thumbnails: thumbnail,
              resourceId: { videoId: "abcdefghijk" },
            },
            contentDetails: {
              videoId: "abcdefghijk",
              videoPublishedAt: "2026-06-01T12:00:00Z",
            },
            status: { privacyStatus: "public" },
          },
          {
            snippet: {
              title: "Newest lesson",
              thumbnails: {
                medium: {
                  url: "https://i.ytimg.com/vi/lmnopqrstuv/mqdefault.jpg",
                },
              },
              resourceId: { videoId: "lmnopqrstuv" },
            },
            contentDetails: {
              videoPublishedAt: "2026-07-01T12:00:00Z",
            },
            status: { privacyStatus: "public" },
          },
          {
            snippet: {
              title: "Private video",
              thumbnails: thumbnail,
              resourceId: { videoId: "12345678901" },
            },
            contentDetails: {
              videoPublishedAt: "2026-08-01T12:00:00Z",
            },
          },
          {
            snippet: {
              title: "Duplicate",
              thumbnails: thumbnail,
              resourceId: { videoId: "abcdefghijk" },
            },
            contentDetails: {
              videoPublishedAt: "2026-05-01T12:00:00Z",
            },
          },
          {
            snippet: {
              title: "Unlisted video",
              thumbnails: thumbnail,
              resourceId: { videoId: "zyxwvutsrqp" },
            },
            contentDetails: {
              videoPublishedAt: "2026-04-01T12:00:00Z",
            },
            status: { privacyStatus: "unlisted" },
          },
        ],
      },
      "RijVia",
    );

    expect(result.nextPageToken).toBe("NEXT_PAGE");
    expect(result.videos.map((video) => video.videoId)).toEqual([
      "lmnopqrstuv",
      "abcdefghijk",
    ]);
    expect(result.videos[0].embedUrl).toBe(
      "https://www.youtube-nocookie.com/embed/lmnopqrstuv",
    );
  });
});
