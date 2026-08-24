"use client";

// Tratamento centralizado de "sessão expirada".
//
// Contrato com o back-end: qualquer resposta HTTP 401 cujo corpo contenha
// { "relogar": true } deve ser tratada como sessão expirada — limpar o token
// salvo, avisar o usuário e redirecionar para a tela de login.
//
// Este módulo é a fonte única desse comportamento, consumida por todas as
// instâncias axios da aplicação (api, apiTutor, apiConteudo, ...).

// Chave usada para a tela de login exibir um aviso curto após sessão expirada.
export const SESSION_EXPIRED_KEY = "session_expired_message";

const DEFAULT_MESSAGE = "Sua sessão expirou. Faça login novamente.";

// Limpa qualquer vestígio de sessão salvo em local/session storage.
export const clearStoredSession = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("user");
  sessionStorage.removeItem("user");
  localStorage.removeItem("profile");
  sessionStorage.removeItem("profile");
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
};

// Detecta o contrato "sessão expirada": HTTP 401 + { relogar: true }.
export const isSessionExpiredError = (error: unknown): boolean => {
  const response = (error as { response?: { status?: number; data?: unknown } })?.response;
  if (response?.status !== 401) return false;
  const data = response?.data as { relogar?: boolean } | undefined;
  return data?.relogar === true;
};

// Evita múltiplos redirecionamentos simultâneos ao receber vários 401.
let handlingSessionExpired = false;

export const handleSessionExpired = (message?: string) => {
  if (typeof window === "undefined") return;
  if (handlingSessionExpired) return;
  handlingSessionExpired = true;

  clearStoredSession();

  try {
    sessionStorage.setItem(SESSION_EXPIRED_KEY, message || DEFAULT_MESSAGE);
  } catch {
    // ignora falhas de storage
  }

  if (!window.location.pathname.includes("/login")) {
    window.location.href = "/login";
  }
};
