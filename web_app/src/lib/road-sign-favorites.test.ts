import { apiClient } from "@/lib/api";
import {
  addRoadSignFavorite,
  favoriteCopy,
  favoriteLocale,
  listRoadSignFavorites,
  removeRoadSignFavorite,
  validFavoriteId,
} from "@/lib/road-sign-favorites";

jest.mock("@/lib/api", () => ({
  apiClient: {
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const getMock = apiClient.get as jest.Mock;
const putMock = apiClient.put as jest.Mock;
const deleteMock = apiClient.delete as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("road-sign favorites API", () => {
  it("reads only server-owned IDs using the authenticated account guard", async () => {
    getMock.mockResolvedValue({ data: [4, 9] });
    await expect(listRoadSignFavorites(27)).resolves.toEqual([4, 9]);
    expect(getMock).toHaveBeenCalledWith(
      "/users/me/favorites",
      undefined,
      expect.objectContaining({
        skipAuthRedirect: true,
        headers: { "X-Expected-User-Id": "27" },
      }),
    );
  });

  it("does not accept a malformed favorites response", async () => {
    getMock.mockResolvedValue({ data: ["A39"] });
    await expect(listRoadSignFavorites(27)).rejects.toThrow(
      "Unexpected favorites response",
    );
  });

  it("uses idempotent backend PUT and DELETE and never sends an owner in the body", async () => {
    putMock.mockResolvedValue({ status: 204 });
    deleteMock.mockResolvedValue({ status: 204 });
    await addRoadSignFavorite(27, 15);
    await removeRoadSignFavorite(27, 15);
    expect(putMock).toHaveBeenCalledWith(
      "/users/me/favorites/15",
      undefined,
      expect.objectContaining({ headers: { "X-Expected-User-Id": "27" } }),
    );
    expect(deleteMock).toHaveBeenCalledWith(
      "/users/me/favorites/15",
      expect.objectContaining({ headers: { "X-Expected-User-Id": "27" } }),
    );
  });

  it("rejects non-positive and non-integer sign and user IDs", async () => {
    expect(validFavoriteId(5)).toBe(true);
    expect(validFavoriteId(0)).toBe(false);
    expect(validFavoriteId(1.5)).toBe(false);
    await expect(addRoadSignFavorite(27, 0)).rejects.toThrow();
    await expect(listRoadSignFavorites(0)).rejects.toThrow();
    expect(putMock).not.toHaveBeenCalled();
  });

  it("exposes nonempty four-language labels and canonical Rijvia naming", () => {
    for (const locale of ["ar", "nl", "fr", "en"] as const) {
      expect(favoriteCopy[locale].add.length).toBeGreaterThan(0);
      expect(favoriteCopy[locale].remove.length).toBeGreaterThan(0);
      expect(favoriteCopy[locale].collectionDescription).toContain("Rijvia");
    }
    expect(favoriteLocale("xx")).toBe("en");
  });
});
