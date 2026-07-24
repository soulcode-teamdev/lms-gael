'use client';

import { Button, Col, Form, Row } from "react-bootstrap";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";
import { Suspense, useContext, useEffect, useState } from "react";

import { AuthContext } from "@/contexts/AuthContext";
import EsqueciSenha from "./EsqueciSenha";
import Image from "next/image";
import { SESSION_EXPIRED_KEY } from "@/shared/api/api";
import logo1 from "/public/gael/logo.png";

function formatRetry(seconds: number): string {
    if (!seconds || seconds <= 0) return "alguns instantes";
    if (seconds < 60) return `${seconds} segundo${seconds > 1 ? "s" : ""}`;
    const min = Math.ceil(seconds / 60);
    return `${min} minuto${min > 1 ? "s" : ""}`;
}

export default function FormLogin({ forgotPassword = false }: { forgotPassword?: boolean }) {

    const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [rememberMe, setRememberMe] = useState<boolean>(false);
    const [esqueciSenha, setEsqueciSenha] = useState<boolean>(forgotPassword);
    const [error, setError] = useState<string>();
    const [info, setInfo] = useState<string>();
    const [blockedUntil, setBlockedUntil] = useState<number>(0);
    const [now, setNow] = useState<number>(Date.now());

    const { signIn } = useContext(AuthContext);

    const remainingSeconds = Math.max(0, Math.ceil((blockedUntil - now) / 1000));
    const isBlocked = remainingSeconds > 0;

    // Aviso curto quando redirecionado por sessão expirada.
    useEffect(() => {
        try {
            const msg = sessionStorage.getItem(SESSION_EXPIRED_KEY);
            if (msg) {
                setInfo(msg);
                sessionStorage.removeItem(SESSION_EXPIRED_KEY);
            }
        } catch { }
    }, []);

    // Contador regressivo enquanto durar o bloqueio (429/423).
    useEffect(() => {
        if (blockedUntil <= Date.now()) return;
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, [blockedUntil]);

    const togglePasswordVisible = () => {
        setPasswordVisible(!passwordVisible);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isBlocked) return;
        setInfo(undefined);
        const res = await signIn(email, password, rememberMe);

        if (!res) {
            setError(undefined);
            return;
        }

        if (res.status === "not_enrolled") {
            setError("Você não está inscrito no programa");
        } else if (res.status === "invalid_credentials") {
            setError("Credenciais inválidas");
        } else if (res.status === "rate_limited") {
            setBlockedUntil(Date.now() + res.retryAfter * 1000);
            setNow(Date.now());
            setError(`Muitas tentativas de login. Tente novamente em ${formatRetry(res.retryAfter)}.`);
        } else if (res.status === "account_locked") {
            setBlockedUntil(Date.now() + res.retryAfter * 1000);
            setNow(Date.now());
            setError(`Conta temporariamente bloqueada por excesso de tentativas. Tente novamente em ${formatRetry(res.retryAfter)}.`);
        }
    }

    const openZendesk = () => {
        if (window.zE) {
            window.zE("messenger", "open");
        }
    };

    function validate(): boolean {
        if (isBlocked) return true;
        if (!email || !password) return true;
        return false;
    }

    return (
        <Row className="container-login d-flex align-items-center justify-content-center row-gap-5">
            <Col xl={4} md={8} className="p-0 d-flex flex-column gap-3">
                <Image src={logo1.src} width={300} height={150} alt="logo Gael" className="object-fit-contain" style={{ maxWidth: '300px', height: 'auto' }} />
                <h1 className="fs-38 fw-700 text-primary">Bem-vindo(a)</h1>
                <span className="fs-21 text-white mb-3">
                    Para acessar nossos cursos, você deverá realizar login. Caso não tenha acesso, visite o <a href="https://criamaisfinancas.com.br/" target="_blank" rel="noopener noreferrer" className="text-white">site do programa</a> para realizar sua inscrição.
                </span>
            </Col>
            <Col className="bg-white offset-xl-3 d-flex flex-column gap-3 p-4 rounded-3" xxl={4} xl={5} md={8} style={{ minHeight: 324 }}>
                {
                    esqueciSenha
                        ?
                        <Suspense>
                            <EsqueciSenha setEsqueciSenha={setEsqueciSenha} />
                        </Suspense>
                        :
                        <>
                            <Form.Control className="form-input-login" type="email" placeholder="E-mail" onChange={(e) => setEmail(e.target.value)} />
                            <div className="position-relative">
                                <Form.Control className="form-input-login" type={passwordVisible ? 'text' : 'password'} placeholder="Senha" onChange={(e) => setPassword(e.target.value)} />
                                {
                                    passwordVisible
                                        ?
                                        <FaRegEyeSlash className="form-password-icon-login" onClick={togglePasswordVisible} />
                                        :
                                        <FaRegEye className="form-password-icon-login" onClick={togglePasswordVisible} />
                                }
                            </div>
                            {info && <div className="w-100 text-primary fs-12">{info}</div>}
                            <div className="text-end w-100 text-danger fs-12">{error}</div>
                            {isBlocked && <div className="text-end w-100 text-danger fs-12">Aguarde {remainingSeconds}s para tentar novamente.</div>}

                            <div className="d-flex justify-content-between flex-wrap">
                                <Form.Check
                                    className="fw-300 text-auxiliary2-project cursor-pointer fs-15"
                                    type="checkbox"
                                    id="remember-me"
                                    label="Manter logado"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span className="fw-300 text-auxiliary2-project cursor-pointer fs-15" onClick={() => setEsqueciSenha(true)}>Esqueci a senha</span>
                            </div>

                            <Button className="fs-15" disabled={validate()} onClick={e => handleSubmit(e)}>Acessar</Button>
                            <Button variant="secondary" className="fs-15 border-1 border-black" href="https://criamaisfinancas.com.br/" target="_blank">Inscreva-se agora</Button>
                            <span className="text-center fs-14">Precisa de ajuda? <a className="cursor-pointer" onClick={() => openZendesk()}>Fale Conosco</a></span>
                        </>
                }
            </Col>
        </Row>
    )
}
