/* eslint-disable @next/next/no-img-element */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import EditorialArticleImagePanel from "@/components/admin/marketing/EditorialArticleImagePanel";
import type { EditorialArticleImageAsset } from "@/lib/marketing-admin";

jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({ language: "ar" }),
}));

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
  beforeEach(() => {
    URL.createObjectURL = jest.fn(() => "blob:editorial-test-preview");
    URL.revokeObjectURL = jest.fn();
  });

  it("distinguishes a selected file from a saved image and unlocks upload when translated keywords arrive", async () => {
    const onUpload = jest.fn().mockResolvedValue(undefined);
    const props = {
      articleId: 17, suggestedFileName: "draft-image", image: null,
      busy: false, t, onUpload, onRemove: jest.fn(),
    };
    const { rerender } = render(<EditorialArticleImagePanel {...props} focusKeywords={{ AR: "Arabic keyword" }} />);
    const file = new File(["jpeg"], "selected.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByTestId("editorial-image-file-input"), { target: { files: [file] } });
    expect(screen.getByTestId("editorial-image-pending")).toBeInTheDocument();
    expect(screen.queryByText("المقال لا يحتوي على صورة")).not.toBeInTheDocument();
    expect(screen.getByTestId("editorial-image-missing-alt")).toHaveTextContent("NL, FR, EN");
    expect(screen.getByTestId("editorial-image-upload-action")).toBeDisabled();
    expect(onUpload).not.toHaveBeenCalled();

    rerender(<EditorialArticleImagePanel {...props} focusKeywords={{
      AR: "Arabic keyword", NL: "Dutch keyword", FR: "French keyword", EN: "English keyword",
    }} />);
    await waitFor(() => expect(screen.getByTestId("editorial-image-upload-action")).toBeEnabled());
    expect(screen.getByLabelText("admin.marketing.editorial_image_alt NL")).toHaveValue("Dutch keyword");
    expect(screen.getByTestId("editorial-image-pending")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("editorial-image-upload-action"));
    await waitFor(() => expect(onUpload).toHaveBeenCalledTimes(1));
    expect((onUpload.mock.calls[0][1] as FormData).get("file")).toBe(file);
  });

  it("keeps a failed upload available to retry and lets the writer clear the unuploaded selection", async () => {
    const onUpload = jest.fn().mockRejectedValue(new Error("Upload unavailable"));
    render(<EditorialArticleImagePanel articleId={17} suggestedFileName="draft-image" image={null}
      busy={false} t={t} onUpload={onUpload} onRemove={jest.fn()}
      focusKeywords={{ AR: "AR keyword", NL: "NL keyword", FR: "FR keyword", EN: "EN keyword" }} />);
    fireEvent.change(screen.getByTestId("editorial-image-file-input"), {
      target: { files: [new File(["jpeg"], "selected.jpg", { type: "image/jpeg" })] },
    });
    fireEvent.click(screen.getByTestId("editorial-image-upload-action"));
    await screen.findByText("Upload unavailable");
    expect(screen.getByTestId("editorial-image-pending")).toBeInTheDocument();
    expect(screen.getByTestId("editorial-image-upload-action")).toBeEnabled();
    fireEvent.click(screen.getByTestId("editorial-image-clear-selection"));
    expect(screen.queryByTestId("editorial-image-pending")).not.toBeInTheDocument();
    expect(screen.getByText("المقال لا يحتوي على صورة")).toBeInTheDocument();
  });

  it("shows the writer-first image UI and submits only useful image metadata", async () => {
    const onUpload = jest.fn().mockResolvedValue(undefined);
    render(
      <EditorialArticleImagePanel
        articleId={17}
        suggestedFileName="belgian-theory-ar-hero"
        focusKeywords={{
          AR: "Arabic focus keyword",
          NL: "Nederlandse focus keyword",
          FR: "Mot-clé français",
          EN: "English focus keyword",
        }}
        image={null}
        busy={false}
        t={t}
        onUpload={onUpload}
        onRemove={jest.fn()}
      />,
    );

    expect(screen.getByText("المقال لا يحتوي على صورة")).toBeInTheDocument();
    const upload = screen.getByRole("button", { name: "رفع صورة المقال" });
    expect(upload).toBeEnabled();

    expect(
      screen.getByLabelText("admin.marketing.editorial_image_alt AR"),
    ).toHaveValue("Arabic focus keyword");
    expect(
      screen.getByLabelText("admin.marketing.editorial_image_alt NL"),
    ).toHaveValue("Nederlandse focus keyword");
    expect(
      screen.getByLabelText("admin.marketing.editorial_image_alt FR"),
    ).toHaveValue("Mot-clé français");
    expect(
      screen.getByLabelText("admin.marketing.editorial_image_alt EN"),
    ).toHaveValue("English focus keyword");

    const fileInput = screen.getByTestId("editorial-image-file-input");
    const fileInputClick = jest.spyOn(fileInput, "click");

    fireEvent.click(upload);

    expect(fileInputClick).toHaveBeenCalledTimes(1);

    expect(screen.queryByText(/ترخيص|مالك الصورة|سبب اعتماد|نقطة التركيز/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/caption|التعليق/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("رفع صورة المقال"), {
      target: {
        files: [new File(["jpeg"], "belgian-road.jpg", { type: "image/jpeg" })],
      },
    });

    const values: Array<[string, string]> = [
      ["admin.marketing.editorial_image_alt AR", "طريق بلجيكي آمن"],
      ["admin.marketing.editorial_image_alt NL", "Een veilige Belgische weg"],
      ["admin.marketing.editorial_image_alt FR", "Une route belge sûre"],
      ["admin.marketing.editorial_image_alt EN", "A safe Belgian road"],
    ];
    for (const [label, value] of values) {
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    }

    expect(upload).toBeEnabled();
    fireEvent.click(upload);

    await waitFor(() => expect(onUpload).toHaveBeenCalledTimes(1));
    const [articleId, payload] = onUpload.mock.calls[0] as [number, FormData];
    expect(articleId).toBe(17);
    expect(payload.get("file")).toBeInstanceOf(File);

    const metadata = JSON.parse(
      await readBlob(payload.get("metadata") as Blob),
    ) as Record<string, unknown>;
    expect(metadata).toEqual({
      storedFileName: "belgian-theory-ar-hero",
      altTextAr: "طريق بلجيكي آمن",
      altTextNl: "Een veilige Belgische weg",
      altTextFr: "Une route belge sûre",
      altTextEn: "A safe Belgian road",
    });
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

    const input = screen.getByLabelText("رفع صورة المقال");
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

  it("shows change action for an attached image and removes only after confirmation", async () => {
    const onRemove = jest.fn().mockResolvedValue(undefined);
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

    const changeImage = screen.getByRole("button", { name: "تغيير صورة المقال" });
    expect(changeImage).toBeEnabled();
    fireEvent.click(
      screen.getByRole("button", {
        name: "admin.marketing.editorial_image_remove",
      }),
    );
    expect(onRemove).not.toHaveBeenCalled();

    const confirmRemove = screen.getByRole("button", {
      name: /editorial_image_remove_confirm_label|حذف الصورة|Remove image|Afbeelding verwijderen|Supprimer l’image/i,
    });

    fireEvent.click(confirmRemove);

    await waitFor(() => expect(onRemove).toHaveBeenCalledWith(17));
  });
});
