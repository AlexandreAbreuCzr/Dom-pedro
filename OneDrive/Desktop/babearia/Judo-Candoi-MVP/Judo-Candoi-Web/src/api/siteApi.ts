import type {
  ExperimentalClassLeadRequestDTO,
  ExperimentalClassLeadResponseDTO,
  SiteContentResponseDTO
} from "../types/site";

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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(`${RESOLVED_API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {})
      },
      signal: controller.signal
    });

    if (!response.ok) {
      const fallbackMessage = `Falha na requisicao (${response.status})`;
      let message = fallbackMessage;

      try {
        const body = (await response.json()) as { message?: string };
        message = body.message ?? fallbackMessage;
      } catch (_error) {
        message = fallbackMessage;
      }

      throw new Error(message);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export function getSiteContent(): Promise<SiteContentResponseDTO> {
  return request<SiteContentResponseDTO>("/site/content", { method: "GET" });
}

export function createExperimentalClassLead(
  payload: ExperimentalClassLeadRequestDTO
): Promise<ExperimentalClassLeadResponseDTO> {
  return request<ExperimentalClassLeadResponseDTO>("/leads/experimental-class", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function resolveSiteAssetUrl(url?: string | null): string {
  if (!url) {
    return "";
  }

  const normalizedUrl = url.trim();

  if (normalizedUrl.startsWith("data:") || normalizedUrl.startsWith("blob:")) {
    return normalizedUrl;
  }

  // Some older records may store local dev absolute URLs. Re-map them to the
  // configured API origin when the path is an uploaded asset.
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
