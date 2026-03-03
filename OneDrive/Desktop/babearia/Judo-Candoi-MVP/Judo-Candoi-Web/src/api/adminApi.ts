import type {
  AdminImageUploadResponseDTO,
  BlogPostAdminResponseDTO,
  BlogPostUpsertDTO,
  PrideStudentAdminResponseDTO,
  PrideStudentUpsertDTO,
  SponsorAdminResponseDTO,
  SponsorUpsertDTO,
  SiteSettingsAdminResponseDTO,
  SiteSettingsUpdateDTO
} from "../types/admin";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1";
const RESOLVED_API_BASE_URL = (() => {
  const normalizedBaseUrl = API_BASE_URL.trim();

  if (normalizedBaseUrl.startsWith("//")) {
    if (typeof window !== "undefined") {
      return `${window.location.protocol}${normalizedBaseUrl}`;
    }
    return `https:${normalizedBaseUrl}`;
  }

  return normalizedBaseUrl;
})();
const API_ASSET_ORIGIN = (() => {
  try {
    return new URL(RESOLVED_API_BASE_URL).origin;
  } catch (_error) {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "http://localhost:8080";
  }
})();

async function request<T>(path: string, password: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const headers = new Headers(init?.headers ?? {});
    headers.set("X-Admin-Password", password);

    const isFormDataBody = typeof FormData !== "undefined" && init?.body instanceof FormData;
    if (!isFormDataBody && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${RESOLVED_API_BASE_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal
    });

    if (!response.ok) {
      const fallbackMessage = `Falha na requisicao (${response.status})`;
      let message = fallbackMessage;

      try {
        const body = (await response.json()) as {
          message?: string;
          details?: Record<string, unknown> | string;
        };

        if (body.details && typeof body.details === "object" && !Array.isArray(body.details)) {
          const detailMessage = Object.entries(body.details)
            .map(([field, detail]) => `${field}: ${String(detail)}`)
            .join(" | ");
          message = detailMessage || body.message || fallbackMessage;
        } else if (typeof body.details === "string" && body.details.trim().length > 0) {
          message = `${body.message ?? "Erro"}: ${body.details}`;
        } else {
          message = body.message ?? fallbackMessage;
        }
      } catch (_error) {
        message = fallbackMessage;
      }

      throw new Error(message);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export function resolveApiAssetUrl(url?: string | null): string {
  if (!url) {
    return "";
  }

  const normalizedUrl = url.trim();

  if (normalizedUrl.startsWith("data:") || normalizedUrl.startsWith("blob:")) {
    return normalizedUrl;
  }

  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/uploads\//i.test(normalizedUrl)) {
    try {
      const parsed = new URL(normalizedUrl);
      return `${API_ASSET_ORIGIN}${parsed.pathname}`;
    } catch (_error) {
      return normalizedUrl;
    }
  }

  if (/^(https?:)?\/\//i.test(normalizedUrl)) {
    return normalizedUrl;
  }

  if (normalizedUrl.startsWith("/uploads/")) {
    return `${API_ASSET_ORIGIN}${normalizedUrl}`;
  }

  if (normalizedUrl.startsWith("uploads/")) {
    return `${API_ASSET_ORIGIN}/${normalizedUrl}`;
  }

  return normalizedUrl;
}

export function checkAdminPassword(password: string): Promise<{ status: string }> {
  return request<{ status: string }>("/admin/auth/check", password, { method: "GET" });
}

export function getSiteSettings(password: string): Promise<SiteSettingsAdminResponseDTO> {
  return request<SiteSettingsAdminResponseDTO>("/admin/site-settings", password, { method: "GET" });
}

export function updateSiteSettings(
  password: string,
  payload: SiteSettingsUpdateDTO
): Promise<SiteSettingsAdminResponseDTO> {
  return request<SiteSettingsAdminResponseDTO>("/admin/site-settings", password, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function listBlogPosts(password: string): Promise<BlogPostAdminResponseDTO[]> {
  return request<BlogPostAdminResponseDTO[]>("/admin/blog-posts", password, { method: "GET" });
}

export function createBlogPost(
  password: string,
  payload: BlogPostUpsertDTO
): Promise<BlogPostAdminResponseDTO> {
  return request<BlogPostAdminResponseDTO>("/admin/blog-posts", password, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateBlogPost(
  password: string,
  id: number,
  payload: BlogPostUpsertDTO
): Promise<BlogPostAdminResponseDTO> {
  return request<BlogPostAdminResponseDTO>(`/admin/blog-posts/${id}`, password, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteBlogPost(password: string, id: number): Promise<void> {
  return request<void>(`/admin/blog-posts/${id}`, password, { method: "DELETE" });
}

export function listPrideStudents(password: string): Promise<PrideStudentAdminResponseDTO[]> {
  return request<PrideStudentAdminResponseDTO[]>("/admin/pride-students", password, { method: "GET" });
}

export function createPrideStudent(
  password: string,
  payload: PrideStudentUpsertDTO
): Promise<PrideStudentAdminResponseDTO> {
  return request<PrideStudentAdminResponseDTO>("/admin/pride-students", password, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updatePrideStudent(
  password: string,
  id: number,
  payload: PrideStudentUpsertDTO
): Promise<PrideStudentAdminResponseDTO> {
  return request<PrideStudentAdminResponseDTO>(`/admin/pride-students/${id}`, password, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deletePrideStudent(password: string, id: number): Promise<void> {
  return request<void>(`/admin/pride-students/${id}`, password, { method: "DELETE" });
}

export function listSponsors(password: string): Promise<SponsorAdminResponseDTO[]> {
  return request<SponsorAdminResponseDTO[]>("/admin/sponsors", password, { method: "GET" });
}

export function createSponsor(
  password: string,
  payload: SponsorUpsertDTO
): Promise<SponsorAdminResponseDTO> {
  return request<SponsorAdminResponseDTO>("/admin/sponsors", password, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateSponsor(
  password: string,
  id: number,
  payload: SponsorUpsertDTO
): Promise<SponsorAdminResponseDTO> {
  return request<SponsorAdminResponseDTO>(`/admin/sponsors/${id}`, password, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteSponsor(password: string, id: number): Promise<void> {
  return request<void>(`/admin/sponsors/${id}`, password, { method: "DELETE" });
}

export function uploadAdminImage(
  password: string,
  file: File,
  folder?: "blog" | "sponsors" | "site" | "gallery" | "general"
): Promise<AdminImageUploadResponseDTO> {
  const formData = new FormData();
  formData.append("file", file);

  if (folder) {
    formData.append("folder", folder);
  }

  return request<AdminImageUploadResponseDTO>("/admin/uploads/images", password, {
    method: "POST",
    body: formData
  });
}
