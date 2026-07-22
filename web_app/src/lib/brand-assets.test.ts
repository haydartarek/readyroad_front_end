import fs from "node:fs";
import path from "node:path";

type ManifestIcon = {
  src: string;
  sizes: string;
  type: string;
  purpose: string;
};

type WebManifest = {
  name: string;
  short_name: string;
  id: string;
  start_url: string;
  scope: string;
  display: string;
  background_color: string;
  theme_color: string;
  lang: string;
  icons: ManifestIcon[];
};

const publicPath = (...parts: string[]) =>
  path.join(process.cwd(), "public", ...parts);

function readPngDimensions(filePath: string) {
  const buffer = fs.readFileSync(filePath);
  expect(buffer.subarray(1, 4).toString("ascii")).toBe("PNG");
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readIcoDimensions(filePath: string) {
  const buffer = fs.readFileSync(filePath);
  const count = buffer.readUInt16LE(4);
  return Array.from({ length: count }, (_, index) => {
    const offset = 6 + index * 16;
    return {
      width: buffer[offset] || 256,
      height: buffer[offset + 1] || 256,
    };
  });
}

describe("ReadyRoad brand assets", () => {
  it("provides a genuine multi-size favicon", () => {
    expect(readIcoDimensions(publicPath("favicon.ico"))).toEqual([
      { width: 16, height: 16 },
      { width: 32, height: 32 },
      { width: 48, height: 48 },
    ]);
  });

  it("provides the correctly sized Apple touch icon", () => {
    expect(readPngDimensions(publicPath("apple-touch-icon.png"))).toEqual({
      width: 180,
      height: 180,
    });
  });

  it("uses dedicated valid any and maskable PWA icons", () => {
    const manifest = JSON.parse(
      fs.readFileSync(publicPath("manifest.json"), "utf8"),
    ) as WebManifest;

    expect(manifest).toMatchObject({
      name: "ReadyRoad - Belgian Driving Theory",
      short_name: "ReadyRoad",
      id: "/",
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#F7F8FA",
      theme_color: "#DF5830",
      lang: "en",
    });
    expect(manifest.icons).toHaveLength(4);
    expect(new Set(manifest.icons.map((icon) => icon.src)).size).toBe(4);
    expect(manifest.icons.map((icon) => icon.purpose).sort()).toEqual([
      "any",
      "any",
      "maskable",
      "maskable",
    ]);

    for (const icon of manifest.icons) {
      const [width, height] = icon.sizes.split("x").map(Number);
      expect(icon.type).toBe("image/png");
      expect(
        readPngDimensions(publicPath(...icon.src.replace(/^\//, "").split("/"))),
      ).toEqual({ width, height });
    }
  });

  it("references only existing branding files from root metadata", () => {
    const layoutSource = fs.readFileSync(
      path.join(process.cwd(), "src", "app", "layout.tsx"),
      "utf8",
    );

    for (const asset of [
      "/favicon.ico",
      "/favicon-16x16.png",
      "/favicon-32x32.png",
      "/icons/icon-192.png",
      "/icons/icon-512.png",
      "/apple-touch-icon.png",
      "/manifest.json",
    ]) {
      expect(layoutSource).toContain(asset);
      expect(fs.existsSync(publicPath(...asset.slice(1).split("/")))).toBe(true);
    }
  });
});
