"use client";

import { addDoc, collection } from "firebase/firestore";
import { trackEvent, truncate } from "@/lib/trackingService";

import { StoredUser } from "@/contexts/AuthContext";
import axios from "axios";
import { db } from "@/lib/firebaseConfig";
import {
  SESSION_EXPIRED_KEY,
  handleSessionExpired,
  isSessionExpiredError,
} from "./sessionExpired";

const baseURL = process.env.NEXT_PUBLIC_API_URL;
const BLOCKED_URLS = ["/auth"];

// Reexportado para consumidores existentes (ex.: tela de login).
export { SESSION_EXPIRED_KEY };

let updateResponsesFn: (() => void) | null = null;

export function registerUpdateResponses(fn: () => void) {
  updateResponsesFn = fn;
}

const logErrorToFirebase = async (error: unknown, type: "request" | "response") => {
  updateResponsesFn?.();

  try {
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    const stored: StoredUser | null = storedUser ? JSON.parse(storedUser) : null;

    const anyError = error as Record<string, unknown>;
    const config = anyError?.config as Record<string, unknown> | undefined;
    const response = anyError?.response as Record<string, unknown> | undefined;

    const payload = {
      type,
      timestamp: new Date().toISOString(),
      message: (anyError?.message as string) || "Erro desconhecido",
      code: anyError?.code || null,
      config: {
        url: (config?.url as string) || null,
        method: (config?.method as string) || null,
        data: config?.data ? JSON.stringify(config.data) : null,
        params: config?.params ? JSON.stringify(config.params) : null,
        headers: config?.headers ? JSON.stringify(config.headers) : null,
      },
      response: {
        status: response?.status || null,
        statusText: (response?.statusText as string) || null,
        data: response?.data ? JSON.stringify(response.data) : null,
        headers: response?.headers ? JSON.stringify(response.headers) : null,
      },
      stack: (anyError?.stack as string) || null,
      user: stored ? stored.user : null,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      origin: typeof window !== "undefined" ? window.location.href : null,
    };

    await addDoc(collection(db, "api_errors"), payload);
  } catch (logErr) {
    console.error("Falha ao salvar log de erro no Firebase", logErr);
  }
};
export const api = axios.create({ baseURL, timeout: 10000 });

api.interceptors.request.use(
  async (config) => {
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    const stored: StoredUser | null = storedUser ? JSON.parse(storedUser) : null;
    if (!!stored?.user?.token) config.headers.Authorization = `Bearer ${stored.user.token}`;

    const isBlockedUrl = BLOCKED_URLS.some((u) => config.url?.includes(u));
    const safeHeaders = { ...(config.headers as Record<string, unknown>) };
    delete safeHeaders["Authorization"];
    delete safeHeaders["authorization"];
    void trackEvent({
      type: "api_request",
      userId: stored?.user?.id,
      userName: stored?.user?.name,
      timestamp: new Date().toISOString(),
      page: typeof window !== "undefined" ? window.location.pathname : "",
      data: {
        url: config.url ?? null,
        method: config.method ?? null,
        params: config.params ? truncate(config.params) : null,
        body: isBlockedUrl ? "[redacted]" : config.data ? truncate(config.data) : null,
        headers: truncate(safeHeaders),
      },
    });

    return config;
  }, async (error) => {
    await logErrorToFirebase(error, "request");
    return Promise.reject(error);
  });

api.interceptors.response.use(
  (response) => {
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    const stored: StoredUser | null = storedUser ? JSON.parse(storedUser) : null;

    void trackEvent({
      type: "api_response",
      userId: stored?.user?.id,
      userName: stored?.user?.name,
      timestamp: new Date().toISOString(),
      page: typeof window !== "undefined" ? window.location.pathname : "",
      data: {
        url: response.config.url ?? null,
        method: response.config.method ?? null,
        status: response.status,
        responseData: truncate(response.data),
      },
    });

    return response;
  },
  async (error) => {
    await logErrorToFirebase(error, "response");

    // Tratamento global de sessão expirada: HTTP 401 + { relogar: true }.
    if (isSessionExpiredError(error)) {
      const response = error?.response as { data?: { message?: string } } | undefined;
      handleSessionExpired(response?.data?.message);
    }

    return Promise.reject(error);
  }
);