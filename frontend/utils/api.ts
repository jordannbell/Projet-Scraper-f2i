import { supabase } from "@/utils/supabase/client";

const FALLBACK_API_BASE_URL = "http://127.0.0.1:8000";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || FALLBACK_API_BASE_URL;

type ApiFetchOptions = RequestInit & {
  requireAuth?: boolean;
};

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const { requireAuth = false, headers, ...rest } = options;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE_URL}${normalizedPath}`;

  const mergedHeaders = new Headers(headers || {});
  const isFormData = typeof FormData !== "undefined" && rest.body instanceof FormData;
  if (!isFormData && !mergedHeaders.has("Content-Type")) {
    mergedHeaders.set("Content-Type", "application/json");
  }

  if (requireAuth) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      throw new Error("Not authenticated");
    }
    mergedHeaders.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...rest,
    headers: mergedHeaders,
  });
}
