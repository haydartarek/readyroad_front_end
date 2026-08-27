/* eslint-disable @next/next/no-img-element */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import EditorialArticleImagePanel from "@/components/admin/marketing/EditorialArticleImagePanel";
import type { EditorialArticleImageAsset } from "@/lib/marketing-admin";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (
    props: React.ImgHTMLAttributes<HTMLImageElement> & {
      fill?: boolean;
      priority?: boolean;
      unoptimized?: boolean;
      sizes?: string;
    },
  ) => {
    const { fill, priority, unoptimized, sizes, ...imageProps } = props;
    void fill;
    void priority;
    void unoptimized;
    void sizes;
    return <img {...imageProps} alt={imageProps.alt ?? ""} />;
  },
}));

const t = (key: string) => key;

function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

describe("EditorialArticleImagePanel", () => {
  it("submits one local JPEG upload with the 5 MB contract and reviewed rights metadata", async () => {
    const onUpload = jest.fn().mockResolvedValue(undefined);
    render(
      <EditorialArticleImagePanel
        articleId={17}
        suggestedFileName="belgian-theory-ar-hero"
        image={null}
        busy={false}
        t={t}
        onUpload={onUpload}
        onRemove={jest.fn()}
      />,
    );

    const upload = screen.getByRole("button", {
      name: "admin.marketing.editorial_image_upload",
    });
    expect(upload).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/editorial_image_file/), {
      target: {
        files: [new File(["jpeg"], "belgian-road.jpg", { type: "image/jpeg" })],
      },
    });

    const values: Array<[RegExp, string]> = [
      [/editorial_image_source_name/, "RijVia owner upload"],
      [/editorial_image_license \*/, "Owned media"],
      [/editorial_image_alt AR/, "طريق بلجيكي آمن"],
      [/editorial_image_alt NL/, "Een veilige Belgische weg"],
      [/editorial_image_alt FR/, "Une route belge sûre"],
      [/editorial_image_alt EN/, "A safe Belgian road"],
      [/editorial_image_approval_reason/, "Ownership and publication rights verified"],
    ];
    for (const [label, value] of values) {
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    }
    fireEvent.click(
      screen
        .getByText("admin.marketing.editorial_image_confirm")
        .closest("label")!
        .querySelector("input")!,
    );

    expect(upload).toBeEnabled();
    fireEvent.click(upload);

    await waitFor(() => expect(onUpload).toHaveBeenCalledTimes(1));
    const [articleId, payload] = onUpload.mock.calls[0] as [number, FormData];
    expect(articleId).toBe(17);
    expect(payload.get("file")).toBeInstanceOf(File);

    const metadata = JSON.parse(
      await readBlob(payload.get("metadata") as Blob),
    ) as Record<string, unknown>;
    expect(metadata).toMatchObject({
      storedFileName: "belgian-theory-ar-hero",
      sourceName: "RijVia owner upload",
      sourceUrl: null,
      licenseName: "Owned media",
      licenseUrl: null,
      rightsConfirmed: true,
      altTextEn: "A safe Belgian road",
    });
    expect(metadata).not.toHaveProperty("sourcePlatform");
  });

  it("rejects unsupported files and files larger than 5 MB before upload", () => {
    render(
      <EditorialArticleImagePanel
        articleId={17}
        suggestedFileName="article-hero"
        image={null}
        busy={false}
        t={t}
        onUpload={jest.fn()}
        onRemove={jest.fn()}
      />,
    );

    const input = screen.getByLabelText(/editorial_image_file/);
    fireEvent.change(input, {
      target: {
        files: [new File(["gif"], "animated.gif", { type: "image/gif" })],
      },
    });
    expect(
      screen.getByText("admin.marketing.editorial_image_invalid_type"),
    ).toBeInTheDocument();

    fireEvent.change(input, {
      target: {
        files: [
          new File([new Uint8Array(5 * 1024 * 1024 + 1)], "too-large.png", {
            type: "image/png",
          }),
        ],
      },
    });
    expect(
      screen.getByText("admin.marketing.editorial_image_too_large"),
    ).toBeInTheDocument();
  });

  it("removes the current local image only after confirmation", async () => {
    const onRemove = jest.fn().mockResolvedValue(undefined);
    jest.spyOn(window, "confirm").mockReturnValue(true);
    const image: EditorialArticleImageAsset = {
      id: 4,
      articleId: 17,
      status: "APPROVED",
      originalFileName: "road.jpg",
      storedFileName: "road-hero",
      originalWidth: 1920,
      originalHeight: 1080,
      focalPointX: 0.5,
      focalPointY: 0.5,
      variants: [
        {
          type: "HERO",
          format: "JPEG",
          publicPath: "/images/articles/road-hero.jpg",
          width: 1920,
          height: 1080,
          byteSize: 1000,
        },
      ],
      localizations: [
        { language: "EN", altText: "Belgian road", caption: null },
      ],
      license: null,
      createdAt: "2026-08-26T00:00:00Z",
      createdBy: "admin@rijvia.be",
    };

    render(
      <EditorialArticleImagePanel
        articleId={17}
        suggestedFileName="article-hero"
        image={image}
        busy={false}
        t={t}
        onUpload={jest.fn()}
        onRemove={onRemove}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "admin.marketing.editorial_image_remove",
      }),
    );
    await waitFor(() => expect(onRemove).toHaveBeenCalledWith(17));
  });
});
