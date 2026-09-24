import { apiClient } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";

export type LessonEditorState =
  | "PUBLISHED"
  | "PUBLISHED_WITH_DRAFT"
  | "UNPUBLISHED"
  | "UNPUBLISHED_WITH_DRAFT";

export interface AdminLessonSummary {
  id: number;
  lessonCode: string;
  titleAr: string;
  titleNl: string;
  titleFr: string;
  titleEn: string;
  active: boolean;
  editorState: LessonEditorState;
  displayOrder: number;
  estimatedMinutes: number;
  pageCount: number;
  currentVersion: number;
  hasDraft: boolean;
  draftRevision: number | null;
  categoryCount: number;
  mediaCount: number;
  updatedAt: string;
}

export interface AdminLessonDocumentLanguageMap {
  ar: string | null;
  nl: string | null;
  fr: string | null;
  en: string | null;
}

export interface AdminLessonDocumentPage {
  pageNumber: number;
  title: {
    ar: string;
    nl: string;
    fr: string;
    en: string;
  };
  content: AdminLessonDocumentLanguageMap;
  bulletPointsRaw: AdminLessonDocumentLanguageMap;
}

export interface AdminLessonDocument {
  schemaVersion: 1;
  lesson: {
    lessonCode: string;
    title: {
      ar: string;
      nl: string;
      fr: string;
      en: string;
    };
    description: AdminLessonDocumentLanguageMap;
    icon: string | null;
    displayOrder: number;
    estimatedMinutes: number;
    isActive: boolean;
  };
  pages: AdminLessonDocumentPage[];
  structuredSections: unknown[];
  seo: {
    ar: Record<string, unknown>;
    nl: Record<string, unknown>;
    fr: Record<string, unknown>;
    en: Record<string, unknown>;
  };
  media: unknown[];
  categoryLinks: unknown[];
}

export interface AdminLessonDraft {
  lessonId: number;
  baseVersionNumber: number;
  revision: number;
  document: AdminLessonDocument;
  createdByUserId: number | null;
  updatedByUserId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLessonVersion {
  id: number;
  versionNumber: number;
  source: string;
  changeNote: string | null;
  publishedByUserId: number | null;
  publishedAt: string;
}

export interface AdminLessonCategory {
  id: number;
  code: string;
  nameAr: string;
  nameNl: string;
  nameFr: string;
  nameEn: string;
  displayOrder: number;
}

export interface AdminLessonCategoryLink {
  categoryId: number;
  code: string;
  nameAr: string;
  nameNl: string;
  nameFr: string;
  nameEn: string;
  primary: boolean;
  displayOrder: number;
}

export interface AdminLessonMediaAsset {
  id: number;
  storageKey: string;
  storageProvider: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  sha256: string;
  status: string;
  uploadedByUserId: number | null;
  createdAt: string;
  archivedAt: string | null;
}

export interface AdminLessonDetail {
  id: number;
  lessonCode: string;
  titleAr: string;
  titleNl: string;
  titleFr: string;
  titleEn: string;
  active: boolean;
  displayOrder: number;
  estimatedMinutes: number;
  pageCount: number;
  currentVersion: number;
  publishedDocument: AdminLessonDocument;
  draft: AdminLessonDraft | null;
  categoryLinks: AdminLessonCategoryLink[];
  mediaAssets: AdminLessonMediaAsset[];
  versions: AdminLessonVersion[];
}

export async function getAdminLessons(): Promise<AdminLessonSummary[]> {
  const { data } = await apiClient.get<AdminLessonSummary[]>(
    API_ENDPOINTS.ADMIN.LESSONS.LIST,
  );

  return data;
}

export async function getAdminLesson(
  idOrCode: number | string,
): Promise<AdminLessonDetail> {
  const { data } = await apiClient.get<AdminLessonDetail>(
    API_ENDPOINTS.ADMIN.LESSONS.DETAIL(idOrCode),
  );

  return data;
}

export async function getAdminLessonCategories(): Promise<
  AdminLessonCategory[]
> {
  const { data } = await apiClient.get<AdminLessonCategory[]>(
    API_ENDPOINTS.ADMIN.LESSONS.CATEGORIES,
  );

  return data;
}

export async function getAdminLessonVersions(
  idOrCode: number | string,
): Promise<AdminLessonVersion[]> {
  const { data } = await apiClient.get<AdminLessonVersion[]>(
    API_ENDPOINTS.ADMIN.LESSONS.VERSIONS(
      idOrCode,
    ),
  );

  return data;
}
export async function getOrCreateAdminLessonDraft(
  idOrCode: number | string,
): Promise<AdminLessonDraft> {
  const { data } =
    await apiClient.post<AdminLessonDraft>(
      API_ENDPOINTS.ADMIN.LESSONS.DRAFT(
        idOrCode,
      ),
    );

  return data;
}
export interface SaveAdminLessonDraftRequest {
  expectedRevision: number;
  document: AdminLessonDocument;
}

export async function saveAdminLessonDraft(
  idOrCode: number | string,
  request: SaveAdminLessonDraftRequest,
): Promise<AdminLessonDraft> {
  const { data } =
    await apiClient.put<AdminLessonDraft>(
      API_ENDPOINTS.ADMIN.LESSONS.DRAFT(
        idOrCode,
      ),
      request,
    );

  return data;
}
