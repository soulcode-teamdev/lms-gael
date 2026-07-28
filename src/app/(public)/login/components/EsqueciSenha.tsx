import { api } from "@/shared/api/api";
import { Button, Form } from "react-bootstrap";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";
import { useContext, useEffect, useState } from "react";

import { AuthContext } from "@/contexts/AuthContext";
import axios from "axios";
import { useSearchParams } from "next/navigation";

interface Props {
    setEsqueciSenha: (newEsqueciSenha: boolean) => void;
}

export default function EsqueciSenha({ setEsqueciSenha }: Props) {

    const [email, setEmail] = useState<string>("");
    const [senha, setSenha] = useState<string>("");
    const [confirmarSenha, setConfirmarSenha] = useState<string>("");
    const [passwordVisible, setPasswordVisible] = useState<boolean[]>([false, false, false]);
    const [error, setError] = useState("");
    const [mensagem, setMensagem] = useState("");
    const [blockedUntil, setBlockedUntil] = useState<number>(0);
    const [now, setNow] = useState<number>(Date.now());

    const { signInByRecoveryPassword } = useContext(AuthContext);

    const searchParams = useSearchParams();

    const token = searchParams.get('token');

    const remainingSeconds = Math.max(0, Math.ceil((blockedUntil - now) / 1000));
    const isBlocked = remainingSeconds > 0;

    // Contador regressivo enquanto durar o bloqueio (429).
    useEffect(() => {
        if (blockedUntil <= Date.now()) return;
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, [blockedUntil]);

    const togglePasswordVisible = (index: number) => {
        setPasswordVisible((prevData) => (
            prevData.map((data, idx) => {
                if (index == idx) {
                    return !data;
                }
                return data;
            })
        ));
    }

    const iconEye = (index: number) => {
        return (
            passwordVisible[index]
                ?
                <FaRegEyeSlash className="form-password-icon-login" onClick={() => togglePasswordVisible(index)} />
                :
                <FaRegEye className="form-password-icon-login" onClick={() => togglePasswordVisible(index)} />
        )
    }

    const validatePassword = (): boolean | undefined => {
        setError("");
        const hasMinLength = senha.length >= 8;
        const hasNumber = /\d/.test(senha);
        const hasUppercase = /[A-Z]/.test(senha);
        const hasLowercase = /[a-z]/.test(senha);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(senha);

        if (senha !== confirmarSenha) {
            setError("As senhas devem ser iguais");
            return;
        }

        if (!hasMinLength) {
            setError("No mínimo ter 8 caracteres");
            return;
        }

        if (!hasNumber) {
            setError("No mínimo ter 1 número");
            return;
        }

        if (!hasUppercase) {
            setError("No mínimo ter 1 letra maiúscula");
            return;
        }

        if (!hasLowercase) {
            setError("No mínimo ter 1 letra minúscula");
            return;
        }

        if (!hasSpecialChar) {
            setError("No mínimo ter 1 caractere especial");
            return;
        }

        return true;
    }

    const handleForgotPassword = () => {
        if (!validatePassword()) return;

        api.post("/user/recoverpassword", {
            token,
            database: process.env.NEXT_PUBLIC_DATABASE,
            new_password: senha
        })
            .then((res) => {
                console.log(res)
                signInByRecoveryPassword({
                    id: res.data.data.userid,
                    token: res.data.token,
                    name: res.data.data.username,
                    database: res.data.data.database
                })
            })
            .catch((err) => {
                // 400: senha rejeitada pelo backend (fraca/comum/sem numero) -> exibir mensagem.
                setError(err?.response?.data?.error ?? "Não foi possível redefinir a senha. Tente novamente.");
            });
    }

    const handleRecoveryPassword = () => {
        if (isBlocked) return;

        api.post("/v2/user/forgotpassword", {
            username: email,
            database: process.env.NEXT_PUBLIC_DATABASE,
            plataform: `gael`
        })
            .then((res) => {
                setMensagem(res.data.message);
            })
            .catch((err) => {
                // 429: muitas solicitações de recuperação.
                if (axios.isAxiosError(err) && err.response?.status === 429) {
                    const data = err.response?.data as { retry_after?: number } | undefined;
                    const headerRetry = Number(err.response?.headers?.["retry-after"]);
                    const retryAfter = data?.retry_after ?? (Number.isFinite(headerRetry) ? headerRetry : 0);

                    setBlockedUntil(Date.now() + retryAfter * 1000);
                    setNow(Date.now());
                    setMensagem(
                        `Você já solicitou a recuperação. Aguarde ${retryAfter > 0 ? `${retryAfter} segundos` : "alguns instantes"} antes de tentar novamente.`
                    );
                    return;
                }

                setMensagem(err.response?.data?.error ?? "Não foi possível enviar o e-mail. Tente novamente mais tarde.");
            })
    }

    return (
        token
            ?
            <>
                <Form.Group controlId="firstname">
                    <div className="position-relative">
                        <Form.Control
                            type={passwordVisible[0] ? 'text' : 'password'}
                            name="senha_atual"
                            className="form-input-login"
                            value={senha}
                            placeholder="Nova senha"
                            onChange={(e) => setSenha(e.target.value)}
                        />
                        {iconEye(0)}
                    </div>
                </Form.Group>
                <Form.Group controlId="firstname">
                    <div className="position-relative">
                        <Form.Control
                            type={passwordVisible[1] ? 'text' : 'password'}
                            name="nova_senha"
                            className="form-input-login"
                            placeholder="Confirmar nova senha"
                            value={confirmarSenha}
                            onChange={(e) => setConfirmarSenha(e.target.value)}
                        />
                        {iconEye(1)}
                    </div>
                </Form.Group>
                <div className="fs-12 text-auxiliary2-project">
                    Use ao menos 8 caracteres com maiúscula, minúscula, número e símbolo. Senhas comuns ou previsíveis (ex.: Password!, Senha@123) são rejeitadas.
                </div>
                <div className="text-end w-100 text-danger fs-12">{error}</div>
                <Button className="fs-15 mt-auto" onClick={handleForgotPassword}>Alterar senha</Button>
                <Button className="btn-secondary fs-15" onClick={() => setEsqueciSenha(false)}>Voltar ao login</Button>
                <span className="text-center fs-14">Precisa de ajuda? <a href="">Fale Conosco</a></span>
            </>
            :
            <>
                <Form.Control className="form-input-login" type="email" placeholder="E-mail" onChange={(e) => setEmail(e.target.value)} />
                <div className="text-end w-100 fs-12">{mensagem}</div>
                {isBlocked && <div className="text-end w-100 text-danger fs-12">Aguarde {remainingSeconds}s para tentar novamente.</div>}
                <Button className="fs-15 mt-auto" onClick={handleRecoveryPassword} disabled={isBlocked}>Enviar e-mail</Button>
                <Button className="btn-secondary fs-15" onClick={() => setEsqueciSenha(false)}>Voltar ao login</Button>
                <span className="text-center fs-14">Precisa de ajuda? <a href="">Fale Conosco</a></span>
            </>
    );
}