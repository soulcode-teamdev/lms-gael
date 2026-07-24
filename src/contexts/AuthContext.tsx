"use client";

import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { createContext, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { StaticImageData } from "next/image";
import axios from "axios";
import { api } from "@/shared/api/api";
import { db } from "@/lib/firebaseConfig";
import { jwtDecode } from "jwt-decode";

interface User {
    name: string;
    token: string;
    database: string;
    id: string;
    type_render?: "curso" | "carreira";
    isAdmin: boolean;
}

interface UserData {
    userid?: number;
    xp_total?: number;
    level?: number;
    user?: UserDetails;
}

interface UserDetails {
    firstname?: string;
    lastname?: string;
    city?: string;
    imagealt?: string | StaticImageData;
}

interface DecodedToken {
    userid: number;
    username: string;
    database: string;
    type_render: "curso" | "carreira";
    iat: number;
    exp: number;
}

export interface Profile {
    firstname: string;
    lastname: string;
    imagealt: string;
}

interface ApiResponse {
    data: Profile;
}

export type SignInResult =
    | null
    | { status: "not_enrolled" | "invalid_credentials" }
    | { status: "rate_limited" | "account_locked"; retryAfter: number };

type AuthContextData = {
    user: User;
    userLevel: number | null;
    setUserLevel: (level: number) => void;
    signIn: (email: string, password: string, rememberMe: boolean, origin?: string) => Promise<SignInResult>;
    signOut: () => Promise<void>;
    signInByRecoveryPassword: (user: User) => void;
    perfil: Profile;
};

interface Props {
    children: React.ReactNode;
}

export type StoredUser = { user: User; expiry: number };

export const AuthContext = createContext({} as AuthContextData);

export function AuthContextProvider({ children }: Props) {
    const [user, setUser] = useState<User>({} as User);
    const [userLevel, setUserLevel] = useState<number | null>(null);
    const [perfil, setPerfil] = useState<Profile>({} as Profile);

    const router = useRouter();
    const pathname = usePathname();

    function isTokenExpired(token: string) {
        if (!token) return true;
        try {
            const decoded: any = jwtDecode(token);
            if (!decoded?.exp) return true;
            return Date.now() >= decoded.exp * 1000;
        } catch {
            return true;
        }
    }

    function readStoredUser(): StoredUser | null {
        const raw = localStorage.getItem("user") ?? sessionStorage.getItem("user");
        if (!raw) return null;

        try {
            const parsed = JSON.parse(raw);

            if (parsed?.user?.token) {
                return parsed as StoredUser;
            }

            if (parsed?.token) {
                const decoded: any = jwtDecode(parsed.token);
                const expiry = (decoded?.exp ?? 0) * 1000;
                return { user: parsed as User, expiry };
            }

            return null;
        } catch {
            return null;
        }
    }

    function clearStoredUser() {
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
        localStorage.removeItem("profile");
        sessionStorage.removeItem("profile");
    }

    function saveUser(userObj: User, rememberMe: boolean) {
        const decoded: any = jwtDecode(userObj.token);
        const expiry = (decoded?.exp ?? 0) * 1000;
        const payload: StoredUser = { user: userObj, expiry };

        if (rememberMe) {
            localStorage.setItem("user", JSON.stringify(payload));
            sessionStorage.removeItem("user");
        } else {
            sessionStorage.setItem("user", JSON.stringify(payload));
            localStorage.removeItem("user");
        }
    }

    const fetchUserLevel = useCallback(async (userid: string | number, database: string, token: string) => {
        try {
            const res = await api.get<UserData>("/ranking/me", {
                headers: {
                    database
                }
            });
            const currentUser = res.data;
            if (currentUser && currentUser.level !== undefined) {
                setUserLevel(currentUser.level);
            }
        } catch (err) {
            console.error("Erro ao buscar o nível do usuário:", err);
        }
    }, []);

    function getPerfil(userObj: User) {
        api
            .get("/profile", {
                headers: {
                    database: userObj.database
                }
            })
            .then((res: ApiResponse) => {
                setPerfil(res.data);
                localStorage.setItem("profile", JSON.stringify(res.data));
                sessionStorage.setItem("profile", JSON.stringify(res.data));
            })
            .catch((err) => {
                console.log(err);
            });
    }

    const loadUserFromStorage = useCallback(() => {
        const stored = readStoredUser();
        const profile = localStorage.getItem("profile") ?? sessionStorage.getItem("profile");

        if (!stored) return;

        if (isTokenExpired(stored.user.token)) {
            clearStoredUser();
            return;
        }

        if (profile) {
            try {
                setPerfil(JSON.parse(profile));
            } catch { }
        }

        setUser(stored.user);
        fetchUserLevel(stored.user.id, stored.user.database, stored.user.token);
    }, [fetchUserLevel]);

    useEffect(() => {
        loadUserFromStorage();
    }, [loadUserFromStorage]);

    useEffect(() => {
        function checkAuth() {
            const stored = readStoredUser();
            const publicPaths = ["/login", "/validar-certificado", "/user-logado", "/perfil/alterar-senha"];

            if (stored?.user) {
                const u = stored.user;

                if (isTokenExpired(u.token)) {
                    clearStoredUser();
                    if (!publicPaths.some((p) => pathname.includes(p))) {
                        router.replace("/login");
                    }
                    return;
                }

                if (!u.isAdmin && pathname.includes("/admin")) {
                    router.replace("/");
                    return;
                }

                if (u.isAdmin && !pathname.includes("/admin")) {
                    router.replace("/admin");
                    return;
                }

                if (pathname.includes("/login")) {
                    router.replace(u.isAdmin ? "/admin" : "/");
                    return;
                }

                return;
            }

            if (!publicPaths.some((p) => pathname.includes(p))) {
                router.replace("/login");
                return;
            }
        }

        checkAuth();
    }, [router, pathname]);

    async function checkEmailInFirestore(email: string): Promise<boolean> {
        const collections = ["preInscricaoGael", "inscricaoGael"];
        for (const col of collections) {
            const q = query(collection(db, col), where("email", "==", email), limit(1));
            const snap = await getDocs(q);
            if (!snap.empty) return true;
        }
        return false;
    }

    async function signIn(email: string, password: string, rememberMe: boolean, origin?: string): Promise<SignInResult> {
        const userObj = {} as User;

        try {
            // const isAllowed = await checkEmailInFirestore(email);
            // if (!isAllowed) return { status: "not_enrolled" };

            const authResponse = await api.post("/auth", {
                username: email,
                password,
                database: process.env.NEXT_PUBLIC_DATABASE,
                institution: "Gael"
            });

            if (authResponse.data.error) {
                return { status: "invalid_credentials" };
            }

            userObj.id = authResponse.data.data.userid;
            userObj.name = authResponse.data.data.username;
            userObj.database = authResponse.data.data.database!;
            userObj.token = authResponse.data.token;
            userObj.isAdmin = authResponse.data.data.isAdmin;

            const decoded: DecodedToken = jwtDecode<DecodedToken>(userObj.token);
            userObj.type_render = decoded.type_render;

            getPerfil(userObj);
            setUser(userObj);
            saveUser(userObj, rememberMe);

            await fetchUserLevel(userObj.id, userObj.database, userObj.token);

            if (authResponse.data.data.forcepasswordchange == 1) {
                router.replace("/perfil/alterar-senha");
                return null;
            }

            router.replace("/");
            return null;
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const status = err.response?.status;
                const data = err.response?.data as { retry_after?: number } | undefined;
                const headerRetry = Number(err.response?.headers?.["retry-after"]);
                const retryAfter = data?.retry_after ?? (Number.isFinite(headerRetry) ? headerRetry : 0);

                if (status === 429) return { status: "rate_limited", retryAfter };
                if (status === 423) return { status: "account_locked", retryAfter };
            }

            if (origin === "autoLogin") {
                router.replace("/login");
            }
            return { status: "invalid_credentials" };
        }
    }

    function signInByRecoveryPassword(userObj: User) {
        setUser(userObj);
        saveUser(userObj, true);
        fetchUserLevel(userObj.id, userObj.database, userObj.token);
        router.replace("/");
    }

    async function signOut() {
        // Tenta invalidar o token no servidor antes de limpar o storage local.
        // O logout local deve ocorrer mesmo se a chamada falhar (rede/401).
        try {
            await api.post("/auth/logout");
        } catch {
            // 401 (token já inválido) ou erro de rede: seguimos com o logout local.
        }

        clearStoredUser();
        setUserLevel(null);
        setUser({} as User);
        router.replace("/login");
    }

    return (
        <AuthContext.Provider value={{ user, userLevel, setUserLevel, signOut, signIn, signInByRecoveryPassword, perfil }}>
            {children}
        </AuthContext.Provider>
    );
}