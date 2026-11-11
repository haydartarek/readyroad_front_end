import { apiClient } from "@/lib/api";

/** Canonical favorites belong to the authenticated backend user, not browser storage. */
export const ROAD_SIGN_FAVORITES_PATH = "/users/me/favorites";

export function validFavoriteId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function checkedOwner(ownerId: number): string {
  if (!validFavoriteId(ownerId)) {
    throw new Error("A valid authenticated account is required");
  }
  return String(ownerId);
}

function checkedSign(signId: number): number {
  if (!validFavoriteId(signId)) {
    throw new Error("A valid road-sign ID is required");
  }
  return signId;
}

const requestOptions = (ownerId: number) => ({
  skipAuthRedirect: true,
  headers: { "X-Expected-User-Id": checkedOwner(ownerId) },
});

export async function listRoadSignFavorites(ownerId: number): Promise<number[]> {
  const response = await apiClient.get<unknown>(
    ROAD_SIGN_FAVORITES_PATH,
    undefined,
    requestOptions(ownerId),
  );
  if (!Array.isArray(response.data) || !response.data.every(validFavoriteId)) {
    throw new Error("Unexpected favorites response from backend");
  }
  return response.data as number[];
}

export async function addRoadSignFavorite(ownerId: number, signId: number): Promise<void> {
  await apiClient.put<void>(
    `${ROAD_SIGN_FAVORITES_PATH}/${checkedSign(signId)}`,
    undefined,
    requestOptions(ownerId),
  );
}

export async function removeRoadSignFavorite(ownerId: number, signId: number): Promise<void> {
  await apiClient.delete<void>(
    `${ROAD_SIGN_FAVORITES_PATH}/${checkedSign(signId)}`,
    requestOptions(ownerId),
  );
}

export type FavoriteLocale = "ar" | "nl" | "fr" | "en";

export const favoriteCopy: Record<FavoriteLocale, {
  add: string;
  remove: string;
  login: string;
  checking: string;
  unavailable: string;
  error: string;
  collection: string;
  collectionDescription: string;
  empty: string;
  back: string;
  retry: string;
}> = {
  ar: {
    add: "حفظ في المفضلة",
    remove: "إزالة من المفضلة",
    login: "سجّل الدخول لحفظ العلامة",
    checking: "جارٍ تحميل المفضلة…",
    unavailable: "لا يمكن حفظ هذه العلامة حاليًا",
    error: "تعذّر تحديث المفضلة. حاول مجددًا.",
    collection: "علاماتي المفضلة",
    collectionDescription: "علامات المرور التي حفظتها في حسابك على Rijvia.",
    empty: "لم تحفظ أي علامة بعد. افتح تفاصيل علامة وأضفها إلى المفضلة.",
    back: "كل العلامات المرورية",
    retry: "إعادة المحاولة",
  },
  nl: {
    add: "Opslaan als favoriet",
    remove: "Verwijderen uit favorieten",
    login: "Meld je aan om dit bord te bewaren",
    checking: "Favorieten laden…",
    unavailable: "Dit verkeersbord kan momenteel niet worden opgeslagen",
    error: "Favorieten bijwerken mislukt. Probeer opnieuw.",
    collection: "Mijn favoriete verkeersborden",
    collectionDescription: "De verkeersborden die je in je Rijvia-account hebt bewaard.",
    empty: "Nog geen favorieten. Open een verkeersbord en sla het op.",
    back: "Alle verkeersborden",
    retry: "Opnieuw proberen",
  },
  fr: {
    add: "Ajouter aux favoris",
    remove: "Retirer des favoris",
    login: "Connectez-vous pour enregistrer ce panneau",
    checking: "Chargement des favoris…",
    unavailable: "Ce panneau ne peut pas être enregistré pour le moment",
    error: "Impossible de modifier les favoris. Réessayez.",
    collection: "Mes panneaux favoris",
    collectionDescription: "Les panneaux enregistrés dans votre compte Rijvia.",
    empty: "Aucun favori pour le moment. Ouvrez un panneau et enregistrez-le.",
    back: "Tous les panneaux",
    retry: "Réessayer",
  },
  en: {
    add: "Save to favorites",
    remove: "Remove from favorites",
    login: "Sign in to save this sign",
    checking: "Loading favorites…",
    unavailable: "This sign cannot be saved right now",
    error: "Could not update favorites. Please try again.",
    collection: "My favorite road signs",
    collectionDescription: "Road signs saved to your Rijvia account.",
    empty: "No favorites yet. Open a road sign and save it here.",
    back: "All traffic signs",
    retry: "Try again",
  },
};

export function favoriteLocale(language: string): FavoriteLocale {
  return language === "ar" || language === "nl" || language === "fr"
    ? language
    : "en";
}
