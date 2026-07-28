import { api } from "@/shared/api/api";
import { Button, Form } from "react-bootstrap";
import { FaRegCheckCircle, FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { FormEvent, useContext, useEffect, useState } from "react";

import { AuthContext } from "@/contexts/AuthContext";
import axios from "axios";
import { useRouter } from "next/navigation";

interface PasswordValidationResult {
    hasMinLength: boolean;
    hasNumber: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasSpecialChar: boolean;
    strengthLevel: "Fraca" | "Média" | "Forte";
};

export default function AlterarSenha() {

    const [oldPasswrod, setOldPassword] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [validationResult, setValidationResult] = useState<PasswordValidationResult | null>(null);
    const [error, setError] = useState("");
    const [passwordVisible, setPasswordVisible] = useState<boolean[]>([false, false, false]);

    const { user } = useContext(AuthContext);
    const router = useRouter();

    useEffect(() => {
        const validatePassword = (): PasswordValidationResult => {
            setError("");
            const hasMinLength = password.length >= 8;
            const hasNumber = /\d/.test(password);
            const hasUppercase = /[A-Z]/.test(password);
            const hasLowercase = /[a-z]/.test(password);
            const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

            const passedChecks = [
                hasMinLength,
                hasNumber,
                hasUppercase,
                hasLowercase,
                hasSpecialChar,
            ].filter(Boolean).length;

            let strengthLevel: "Fraca" | "Média" | "Forte";
            if (passedChecks <= 2) {
                strengthLevel = "Fraca";
            } else if (passedChecks === 3 || passedChecks === 4) {
                strengthLevel = "Média";
            } else {
                strengthLevel = "Forte";
            }

            return {
                hasMinLength,
                hasNumber,
                hasUppercase,
                hasLowercase,
                hasSpecialChar,
                strengthLevel};
        };

        setValidationResult(validatePassword());
    }, [password]);

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

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("As senhas devem ser iguais");
            return;
        }
        if (!validationResult?.hasLowercase || !validationResult.hasMinLength || !validationResult.hasNumber || !validationResult.hasSpecialChar || !validationResult.hasUppercase) {
            setError("Senha fraca");
            return;
        }

        api.post("/auth/resetpassword", {
            password: oldPasswrod,
            new_password: password
        }, {
            
        })
            .then(() => {
                router.push("/carreiras");
            })
            .catch((err) => {
                // 401: sessao expirada -> redireciona ao login (tambem tratado globalmente).
                if (axios.isAxiosError(err) && err.response?.status === 401) {
                    router.push("/login");
                    return;
                }

                // 400: senha rejeitada pelo backend (fraca/comum/sem numero) -> exibir mensagem.
                setError(err?.response?.data?.error ?? "Não foi possível alterar a senha. Tente novamente.");
            });
    }

    return (
        <div className="px-2 mt-5 mt-lg-0">
            <div className="">
                <h2 className="fw-700 fs-28 mb-4">Redefinir Senha</h2>
                <p>Para proteger sua conta, crie uma senha com pelo menos 8 caracteres, misturando letras maiúsculas, minúsculas, números e símbolos.</p>
                <p>Evite sequências óbvias e informações pessoais. <br />Segurança em primeiro lugar!</p>
                <p>Se este é o seu primeiro acesso, utilize a senha padrão <b>Mudar@123</b> para alterar sua senha.</p>
            </div>
            <div className="row gap-5 mt-5 pt-4">
                <div className="col-xl-4 col-xl-5 col-12 bg-white rounded rounded-3 px-4 py-5">
                    <Form onSubmit={(e) => handleSubmit(e)}>
                        <Form.Group className="mb-3" controlId="firstname">
                            <Form.Label className="fs-14">Senha atual</Form.Label>
                            <div className="position-relative">
                                <Form.Control
                                    type={passwordVisible[0] ? 'text' : 'password'}
                                    name="senha_atual"
                                    className="form-input-login"
                                    value={oldPasswrod}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                />
                                {iconEye(0)}
                            </div>
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="firstname">
                            <Form.Label className="fs-14">Nova senha</Form.Label>
                            <div className="position-relative">
                                <Form.Control
                                    type={passwordVisible[1] ? 'text' : 'password'}
                                    name="nova_senha"
                                    className="form-input-login"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                {iconEye(1)}
                            </div>
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="firstname">
                            <Form.Label className="fs-14">Confirme a nova senha</Form.Label>
                            <div className="position-relative">
                                <Form.Control
                                    type={passwordVisible[2] ? 'text' : 'password'}
                                    name="confirmar_nova_senha"
                                    className="form-input-login"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                {iconEye(2)}
                            </div>
                        </Form.Group>
                        <div className="text-end w-100 text-danger">{error}</div>
                        <Button className="w-100 mt-2" type="submit">Salvar</Button>
                        <div className="d-flex justify-content-center gap-2 mt-3">
                            <span>Precisa de ajuda?</span>
                            <a href="">Fale Conosco</a>
                        </div>
                    </Form>
                </div>
                <div className="col-xl-4 col-xl-5 col-12">

                    <div className="d-flex flex-column row-gap-3">
                        <span className="fw-700">Sua senha deve:</span>
                        <div className="d-flex gap-2 align-items-center">
                            <FaRegCheckCircle size={20} className={validationResult?.hasMinLength ? "text-auxiliary9-project" : "text-auxiliary1-project"} />
                            No mínimo ter 8 caracteres
                        </div>
                        <div className="d-flex gap-2 align-items-center" >
                            <FaRegCheckCircle size={20} className={validationResult?.hasNumber ? "text-auxiliary9-project" : "text-auxiliary1-project"} />
                            No mínimo ter 1 número
                        </div>
                        <div className="d-flex gap-2 align-items-center">
                            <FaRegCheckCircle size={20} className={validationResult?.hasUppercase ? "text-auxiliary9-project" : "text-auxiliary1-project"} />
                            No mínimo ter 1 letra maiúscula
                        </div>
                        <div className="d-flex gap-2 align-items-center">
                            <FaRegCheckCircle size={20} className={validationResult?.hasLowercase ? "text-auxiliary9-project" : "text-auxiliary1-project"} />
                            No mínimo ter 1 letra minúscula
                        </div>
                        <div className="d-flex gap-2 align-items-center">
                            <FaRegCheckCircle size={20} className={validationResult?.hasSpecialChar ? "text-auxiliary9-project" : "text-auxiliary1-project"} />
                            No mínimo ter 1 caractere especial
                        </div>
                        <div className="fs-13 text-auxiliary1-project">
                            Evite senhas comuns ou previsíveis (ex.: <b>Password!</b>, <b>Senha@123</b>) — elas são rejeitadas.
                        </div>
                        <div className="d-flex gap-2 align-items-center fw-700">
                            Nível de segurança:
                            <span className={validationResult?.strengthLevel == "Forte" ? "text-auxiliary9-project" : "text-danger"}>{validationResult?.strengthLevel}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}