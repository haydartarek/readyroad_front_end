/* eslint-disable @next/next/no-img-element */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import EditorialArticleImagePanel from "@/components/admin/marketing/EditorialArticleImagePanel";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} alt={props.alt ?? ""} />,
}));

const t = (key: string) => key;

describe("EditorialArticleImagePanel", () => {
  it("submits a reviewed licensed image only after every required field is present", async () => {
    const onUpload = jest.fn().mockResolvedValue(undefined);
    render(
      <EditorialArticleImagePanel
        articleId={17}
        image={null}
        busy={false}
        t={t}
        onUpload={onUpload}
      />,
    );

    const upload = screen.getByRole("button", { name: "admin.marketing.editorial_image_upload" });
    expect(upload).toBeDisabled();
    expect(screen.getByRole("combobox")).toHaveAttribute("dir", "auto");
    expect(screen.getByRole("combobox")).toHaveClass("min-w-0", "max-w-full", "pe-10", "text-start");

    fireEvent.change(screen.getByLabelText(/editorial_image_file/), {
      target: { files: [new File(["jpeg"], "belgian-road.jpg", { type: "image/jpeg" })] },
    });
    const values: Array<[string, string]> = [
      ["admin.marketing.editorial_image_source_id *", "unsplash-17"],
      ["admin.marketing.editorial_image_source_url *", "https://unsplash.com/photos/unsplash-17"],
      ["admin.marketing.editorial_image_photographer *", "Road Photographer"],
      ["admin.marketing.editorial_image_photographer_url *", "https://unsplash.com/@road-photographer"],
      ["admin.marketing.editorial_image_license *", "Unsplash License"],
      ["admin.marketing.editorial_image_license_url *", "https://unsplash.com/license"],
      ["admin.marketing.editorial_image_license_verified *", "2026-08-24T01:00"],
      ["admin.marketing.editorial_image_downloaded *", "2026-08-24T01:30"],
      ["admin.marketing.editorial_image_alt AR *", "طريق بلجيكي آمن"],
      ["admin.marketing.editorial_image_alt NL *", "Een veilige Belgische weg"],
      ["admin.marketing.editorial_image_alt FR *", "Une route belge sûre"],
      ["admin.marketing.editorial_image_alt EN *", "A safe Belgian road"],
      ["admin.marketing.editorial_image_approval_reason *", "Source, license, privacy and Belgian relevance verified"],
    ];
    for (const [label, value] of values) {
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    }
    fireEvent.click(screen.getByLabelText("admin.marketing.editorial_image_confirm"));

    expect(upload).toBeEnabled();
    fireEvent.click(upload);

    await waitFor(() => expect(onUpload).toHaveBeenCalledTimes(1));
    const [articleId, payload] = onUpload.mock.calls[0] as [number, FormData];
    expect(articleId).toBe(17);
    expect(payload.get("file")).toBeInstanceOf(File);
    expect(payload.get("metadata")).toBeInstanceOf(Blob);
  });
});
