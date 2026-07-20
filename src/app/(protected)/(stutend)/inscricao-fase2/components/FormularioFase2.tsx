"use client";

import React, { useContext, useEffect, useRef, useState } from "react";
import { Form, Button, ProgressBar, Spinner } from "react-bootstrap";
import { useRouter } from "next/navigation";
import { api } from "@/shared/api/api";
import { AuthContext } from "@/contexts/AuthContext";
import axios from "axios";
import {
    MdCheckCircle,
    MdError,
    MdWarning,
    MdCloudUpload,
    MdSend,
    MdPerson,
    MdBusiness,
    MdVideoFile,
    MdShield,
} from "react-icons/md";

const SETORES = [
    "Artes plásticas",
    "Artes visuais",
    "Artesanato",
    "Audiovisual e cinema",
    "Circo",
    "Comunicação e Mkt",
    "Dança",
    "Design de interiores",
    "Design de produto",
    "Design gráfico",
    "Gastronomia",
    "Jogos digitais e aplicativos",
    "Mercado editorial",
    "Moda e beleza",
    "Música",
    "Patrimônio Histórico e Cultural",
    "Produção de Eventos Culturais",
    "Teatro",
    "Outro",
] as const;

type Setor = (typeof SETORES)[number];
const VIDEO_MAX_BYTES = 500 * 1024 * 1024;

interface FormState {
    nome_completo: string;
    email: string;
    telefone: string;
    cpf: string;
    is_empreendedor_criativo: boolean;
    mora_no_brasil: boolean;
    idade_maior_18: boolean;
    setor_empreendimento: Setor | "";
    setor_outros: string;
    tempo_existencia: string;
    formalizacao: string;
    num_pessoas_envolvidas: string;
    renda_responsavel: string;
    aceite_termo_lgpd: boolean;
}

type SubmitResult =
    | { type: "ok"; inscricao_id: string }
    | { type: "inelegivel"; criterios_reprovados: string[] }
    | { type: "erro"; motivo: string; campos_invalidos?: string[] };

const CRITERIO_LABEL: Record<string, string> = {
    is_empreendedor_criativo: "Ser empreendedor criativo",
    mora_no_brasil: "Residir no Brasil",
    idade_maior_18: "Ter 18 anos ou mais",
    aceite_termo_lgpd: "Aceite dos termos LGPD",
};

interface StatusResponse {
    ja_inscrito: boolean;
    inscricao_id?: string;
}

/* ── helpers de estilo ── */
const sectionCard: React.CSSProperties = {
    background: "#2a2a28",
    borderRadius: 12,
    borderLeft: "3px solid #EC6508",
    padding: "20px 24px",
    marginBottom: 16,
};

const sectionTitle: React.CSSProperties = {
    color: "#F9F8F1",
    fontWeight: 700,
    fontSize: 15,
    marginBottom: 16,
    display: "flex",
    alignItems: "center",
    gap: 8,
};

const labelStyle: React.CSSProperties = { color: "#c8c8c4", fontSize: 13, marginBottom: 4 };

function FileZone({
    label,
    accept,
    file,
    onChange,
    error,
    required,
    hint,
    inputRef,
}: {
    label: string;
    accept?: string;
    file: File | null;
    onChange: (f: File | null) => void;
    error?: string;
    required?: boolean;
    hint?: string;
    inputRef?: React.RefObject<HTMLInputElement>;
}) {
    const inner = useRef<HTMLInputElement>(null);
    const ref = inputRef ?? inner;

    return (
        <div className="mb-3">
            <p style={labelStyle}>
                {label}
                {required && <span style={{ color: "#EC6508" }}> *</span>}
            </p>
            <div
                onClick={() => ref.current?.click()}
                style={{
                    border: `2px dashed ${error ? "#FF3B30" : file ? "#93C01F" : "#555"}`,
                    borderRadius: 10,
                    padding: "18px 16px",
                    cursor: "pointer",
                    background: "#1D1D1B",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    transition: "border-color .2s",
                }}
            >
                <MdCloudUpload size={28} color={file ? "#93C01F" : "#EC6508"} />
                <div>
                    <p style={{ color: file ? "#93C01F" : "#aaa", fontSize: 13, margin: 0, fontWeight: file ? 600 : 400 }}>
                        {file ? file.name : "Clique para selecionar o arquivo"}
                    </p>
                    {hint && !file && <p style={{ color: "#666", fontSize: 11, margin: 0 }}>{hint}</p>}
                    {file && (
                        <p style={{ color: "#666", fontSize: 11, margin: 0 }}>
                            {(file.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                    )}
                </div>
            </div>
            {error && <p style={{ color: "#FF3B30", fontSize: 12, marginTop: 4 }}>{error}</p>}
            <input
                type="file"
                ref={ref}
                accept={accept}
                style={{ display: "none" }}
                onChange={(e) => onChange(e.target.files?.[0] ?? null)}
                required={required}
            />
        </div>
    );
}

function EligCheck({
    id,
    name,
    label,
    checked,
    onChange,
}: {
    id: string;
    name: string;
    label: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
    return (
        <label
            htmlFor={id}
            style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: checked ? "rgba(236,101,8,.12)" : "#1D1D1B",
                border: `1.5px solid ${checked ? "#EC6508" : "#444"}`,
                borderRadius: 10,
                padding: "12px 16px",
                cursor: "pointer",
                transition: "all .2s",
                marginBottom: 10,
            }}
        >
            <input
                type="checkbox"
                id={id}
                name={name}
                checked={checked}
                onChange={onChange}
                style={{ display: "none" }}
            />
            <span
                style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    border: `2px solid ${checked ? "#EC6508" : "#555"}`,
                    background: checked ? "#EC6508" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all .2s",
                }}
            >
                {checked && <MdCheckCircle size={14} color="#fff" />}
            </span>
            <span style={{ color: "#F9F8F1", fontSize: 14 }}>{label}</span>
        </label>
    );
}

/* ── telas de estado ── */
function CardEstado({ children }: { children: React.ReactNode }) {
    return (
        <div
            style={{
                background: "#2a2a28",
                borderRadius: 16,
                padding: "48px 32px",
                textAlign: "center",
                margin: "40px 0",
            }}
        >
            {children}
        </div>
    );
}

export default function FormularioFase2() {
    const { signOut, user } = useContext(AuthContext);
    const router = useRouter();

    const [statusCheck, setStatusCheck] = useState<"loading" | "inscrito" | "livre">("loading");
    const [inscricaoExistente, setInscricaoExistente] = useState<string | null>(null);
    const [programaConcluido, setProgramaConcluido] = useState<boolean>(false);
    const [progressoGeral, setProgressoGeral] = useState<number>(0);
    const hasChecked = useRef(false);

    useEffect(() => {
        if (!user.id || hasChecked.current) return;
        hasChecked.current = true;

        const userId = user.id;

        const checkStatus = api.get<StatusResponse>("/gael/inscricoes/fase2/status");

        const checkProgresso = api.get("/progress/user-cohort", {
            headers: {
                userid: userId,
                cohortid: 160,
                subcourse_scope: "all",
                scope: "cohort",
                exclude_courses: "513,514",
            },
        });

        Promise.allSettled([checkStatus, checkProgresso]).then(([statusRes, progressoRes]) => {
            // status
            if (statusRes.status === "fulfilled") {
                const data = statusRes.value.data;
                if (data.ja_inscrito) {
                    setInscricaoExistente(data.inscricao_id ?? null);
                    setStatusCheck("inscrito");
                } else {
                    setStatusCheck("livre");
                }
            } else {
                const err = statusRes.reason;
                if (axios.isAxiosError(err) && err.response?.status === 401) {
                    signOut();
                    router.replace("/login");
                    return;
                }
                setStatusCheck("livre");
            }

            // progresso
            if (progressoRes.status === "fulfilled") {
                const overall = progressoRes.value.data?.progress?.overall ?? 0;
                setProgressoGeral(overall);
                setProgramaConcluido(overall >= 100);
            } else {
                // em caso de erro na checagem de progresso, não bloqueia o usuário
                setProgramaConcluido(true);
            }
        });
    }, [user.id, signOut, router]);

    const [form, setForm] = useState<FormState>({
        nome_completo: "",
        email: "",
        telefone: "",
        cpf: "",
        is_empreendedor_criativo: false,
        mora_no_brasil: false,
        idade_maior_18: false,
        setor_empreendimento: "",
        setor_outros: "",
        tempo_existencia: "",
        formalizacao: "",
        num_pessoas_envolvidas: "",
        renda_responsavel: "",
        aceite_termo_lgpd: false,
    });

    const [certificado, setCertificado] = useState<File | null>(null);
    const [video, setVideo] = useState<File | null>(null);
    const [docComplementar, setDocComplementar] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SubmitResult | null>(null);
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

    const certRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLInputElement>(null);
    const docRef = useRef<HTMLInputElement>(null);

    const handleText = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: checked }));
    };

    const validate = (): boolean => {
        const erros: Record<string, string> = {};
        if (!certificado) erros.certificado_fase1 = "Certificado da Fase 1 é obrigatório.";
        if (!video) {
            erros.video_pitch = "Vídeo de pitch é obrigatório.";
        } else if (video.size > VIDEO_MAX_BYTES) {
            erros.video_pitch = "O vídeo não pode exceder 500MB.";
        }
        if (form.setor_empreendimento === "Outro" && !form.setor_outros.trim()) {
            erros.setor_outros = "Informe o setor quando selecionar 'Outro'.";
        }
        setClientErrors(erros);
        return Object.keys(erros).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setResult(null);
        if (!validate()) return;

        const fd = new FormData();
        fd.append("nome_completo", form.nome_completo);
        fd.append("email", form.email);
        fd.append("telefone", form.telefone);
        fd.append("cpf", form.cpf);
        fd.append("is_empreendedor_criativo", String(form.is_empreendedor_criativo));
        fd.append("mora_no_brasil", String(form.mora_no_brasil));
        fd.append("idade_maior_18", String(form.idade_maior_18));
        fd.append("setor_empreendimento", form.setor_empreendimento);
        if (form.setor_empreendimento === "Outro") fd.append("setor_outros", form.setor_outros);
        fd.append("tempo_existencia", form.tempo_existencia);
        fd.append("formalizacao", form.formalizacao);
        fd.append("num_pessoas_envolvidas", form.num_pessoas_envolvidas);
        fd.append("renda_responsavel", form.renda_responsavel);
        fd.append("aceite_termo_lgpd", String(form.aceite_termo_lgpd));
        fd.append("certificado_fase1", certificado!);
        fd.append("video_pitch", video!);
        if (docComplementar) fd.append("documentacao_complementar", docComplementar);

        setLoading(true);
        setUploadProgress(0);

        try {
            const response = await api.post("/gael/inscricoes/fase2", fd, {
                timeout: 30 * 60 * 1000,
                onUploadProgress: (evt) => {
                    if (evt.total) setUploadProgress(Math.round((evt.loaded * 100) / evt.total));
                },
            });

            if (response.data.status === "ok") {
                setResult({ type: "ok", inscricao_id: response.data.inscricao_id });
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const status = err.response?.status;
                const data = err.response?.data;

                if (status === 401) { signOut(); router.replace("/login"); return; }

                if (data?.status === "inelegivel") {
                    setResult({ type: "inelegivel", criterios_reprovados: data.criterios_reprovados ?? [] });
                } else if (data?.status === "erro") {
                    setResult({ type: "erro", motivo: data.motivo ?? "Erro ao enviar inscrição.", campos_invalidos: data.campos_invalidos });
                    if (data.campos_invalidos?.length) {
                        const ce: Record<string, string> = {};
                        (data.campos_invalidos as string[]).forEach((c: string) => { ce[c] = "Campo inválido segundo o servidor."; });
                        setClientErrors(ce);
                    }
                } else {
                    setResult({ type: "erro", motivo: "Erro inesperado. Tente novamente." });
                }
            } else {
                setResult({ type: "erro", motivo: "Erro inesperado. Verifique sua conexão." });
            }
        } finally {
            setLoading(false);
        }
    };

    const fe = (name: string) => clientErrors[name];
    const he = (name: string) => !!clientErrors[name];

    /* ── estados de tela ── */
    if (statusCheck === "loading") {
        return (
            <CardEstado>
                <Spinner animation="border" style={{ color: "#EC6508", width: 40, height: 40 }} />
                <p style={{ color: "#aaa", marginTop: 16, fontSize: 14 }}>Verificando sua inscrição…</p>
            </CardEstado>
        );
    }

    if (statusCheck === "inscrito") {
        return (
            <CardEstado>
                <MdCheckCircle size={64} color="#93C01F" />
                <h2 style={{ color: "#F9F8F1", fontWeight: 700, marginTop: 16 }}>Você já se inscreveu!</h2>
                <p style={{ color: "#aaa", fontSize: 14, marginTop: 8 }}>Sua inscrição foi registrada com o número:</p>
                {inscricaoExistente && (
                    <div
                        style={{
                            background: "#1D1D1B",
                            borderRadius: 8,
                            padding: "12px 24px",
                            display: "inline-block",
                            marginTop: 12,
                        }}
                    >
                        <span style={{ color: "#EC6508", fontWeight: 700, fontSize: 18, letterSpacing: 1 }}>
                            {inscricaoExistente}
                        </span>
                    </div>
                )}
                <p style={{ color: "#666", fontSize: 12, marginTop: 16 }}>Guarde este código para acompanhamento.</p>
            </CardEstado>
        );
    }

    if (result?.type === "ok") {
        return (
            <CardEstado>
                <MdCheckCircle size={64} color="#93C01F" />
                <h2 style={{ color: "#F9F8F1", fontWeight: 700, marginTop: 16 }}>Inscrição enviada!</h2>
                <p style={{ color: "#aaa", fontSize: 14, marginTop: 8 }}>Número de inscrição:</p>
                <div style={{ background: "#1D1D1B", borderRadius: 8, padding: "12px 24px", display: "inline-block", marginTop: 12 }}>
                    <span style={{ color: "#EC6508", fontWeight: 700, fontSize: 18, letterSpacing: 1 }}>{result.inscricao_id}</span>
                </div>
                <p style={{ color: "#666", fontSize: 12, marginTop: 16 }}>Guarde este código para acompanhamento.</p>
            </CardEstado>
        );
    }

    if (result?.type === "inelegivel") {
        return (
            <CardEstado>
                <MdWarning size={64} color="#F9B040" />
                <h2 style={{ color: "#F9F8F1", fontWeight: 700, marginTop: 16 }}>Critérios não atendidos</h2>
                <p style={{ color: "#aaa", fontSize: 14, marginTop: 8, marginBottom: 20 }}>
                    Você não atende aos seguintes critérios de elegibilidade:
                </p>
                <div style={{ display: "inline-flex", flexDirection: "column", gap: 8, textAlign: "left" }}>
                    {result.criterios_reprovados.map((c) => (
                        <div key={c} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <MdError size={16} color="#FF3B30" />
                            <span style={{ color: "#F9F8F1", fontSize: 14 }}>{CRITERIO_LABEL[c] ?? c}</span>
                        </div>
                    ))}
                </div>
                <br />
                <Button
                    variant="outline-light"
                    className="mt-4 fs-12 fw-700"
                    onClick={() => setResult(null)}
                >
                    Voltar ao formulário
                </Button>
            </CardEstado>
        );
    }

    /* ── formulário principal ── */
    const inputCls = (name: string) => `form-input-login${he(name) ? " is-invalid" : ""}`;

    return (
        <div style={{ margin: "40px 0" }}>

            {/* cabeçalho */}
            <div
                style={{
                    background: "linear-gradient(135deg, #EC6508 0%, #d96215 100%)",
                    borderRadius: "16px 16px 0 0",
                    padding: "32px 28px 24px",
                }}
            >
                <p style={{ color: "rgba(255,255,255,.7)", fontSize: 12, margin: "0 0 4px", letterSpacing: 1, textTransform: "uppercase" }}>
                    Cria Mais
                </p>
                <h2 style={{ color: "#fff", fontWeight: 700, fontSize: 24, margin: 0 }}>Inscrição — Fase 2</h2>
                <p style={{ color: "rgba(255,255,255,.8)", fontSize: 13, marginTop: 6, marginBottom: 0 }}>
                    Preencha todos os campos obrigatórios (<span style={{ color: "#fff" }}>*</span>) e envie sua inscrição.
                </p>
            </div>

            <Form
                onSubmit={handleSubmit}
                style={{ background: "#232321", borderRadius: "0 0 16px 16px", padding: "28px 28px 32px" }}
            >

                {result?.type === "erro" && (
                    <div
                        style={{
                            background: "rgba(255,59,48,.1)",
                            border: "1px solid rgba(255,59,48,.4)",
                            borderRadius: 10,
                            padding: "14px 16px",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 20,
                        }}
                    >
                        <MdError size={20} color="#FF3B30" style={{ flexShrink: 0 }} />
                        <span style={{ color: "#ff6b6b", fontSize: 14 }}>{result.motivo}</span>
                    </div>
                )}

                {/* ── 1. Dados pessoais ── */}
                <div style={sectionCard}>
                    <p style={sectionTitle}>
                        <MdPerson size={18} color="#EC6508" />
                        Dados pessoais
                    </p>
                    <div className="row">
                        <Form.Group className="mb-3 col-lg-6" controlId="nome_completo">
                            <Form.Label style={labelStyle}>Nome completo <span style={{ color: "#EC6508" }}>*</span></Form.Label>
                            <Form.Control type="text" name="nome_completo" className={inputCls("nome_completo")}
                                value={form.nome_completo} onChange={handleText} placeholder="Nome completo" required />
                            {fe("nome_completo") && <div className="invalid-feedback">{fe("nome_completo")}</div>}
                        </Form.Group>

                        <Form.Group className="mb-3 col-lg-6" controlId="email">
                            <Form.Label style={labelStyle}>E-mail <span style={{ color: "#EC6508" }}>*</span></Form.Label>
                            <Form.Control type="email" name="email" className={inputCls("email")}
                                value={form.email} onChange={handleText} placeholder="seuemail@exemplo.com" required />
                            {fe("email") && <div className="invalid-feedback">{fe("email")}</div>}
                        </Form.Group>

                        <Form.Group className="mb-3 col-lg-6" controlId="telefone">
                            <Form.Label style={labelStyle}>Telefone <span style={{ color: "#EC6508" }}>*</span></Form.Label>
                            <Form.Control type="tel" name="telefone" className={inputCls("telefone")}
                                value={form.telefone} onChange={handleText} placeholder="(11) 99999-9999" required />
                            {fe("telefone") && <div className="invalid-feedback">{fe("telefone")}</div>}
                        </Form.Group>

                        <Form.Group className="mb-0 col-lg-6" controlId="cpf">
                            <Form.Label style={labelStyle}>CPF <span style={{ color: "#EC6508" }}>*</span></Form.Label>
                            <Form.Control type="text" name="cpf" className={inputCls("cpf")}
                                value={form.cpf} onChange={handleText} placeholder="000.000.000-00" required />
                            {fe("cpf") && <div className="invalid-feedback">{fe("cpf")}</div>}
                        </Form.Group>
                    </div>
                </div>

                {/* ── 2. Elegibilidade ── */}
                <div style={sectionCard}>
                    <p style={sectionTitle}>
                        <MdShield size={18} color="#EC6508" />
                        Critérios de elegibilidade
                    </p>
                    <EligCheck id="is_empreendedor_criativo" name="is_empreendedor_criativo"
                        label="Sou empreendedor(a) criativo(a)" checked={form.is_empreendedor_criativo} onChange={handleCheck} />
                    <EligCheck id="mora_no_brasil" name="mora_no_brasil"
                        label="Resido no Brasil" checked={form.mora_no_brasil} onChange={handleCheck} />
                    <EligCheck id="idade_maior_18" name="idade_maior_18"
                        label="Tenho 18 anos ou mais" checked={form.idade_maior_18} onChange={handleCheck} />
                </div>

                {/* ── 3. Empreendimento ── */}
                <div style={sectionCard}>
                    <p style={sectionTitle}>
                        <MdBusiness size={18} color="#EC6508" />
                        Sobre o empreendimento
                    </p>
                    <div className="row">
                        <Form.Group className="mb-3 col-lg-6" controlId="setor_empreendimento">
                            <Form.Label style={labelStyle}>Setor <span style={{ color: "#EC6508" }}>*</span></Form.Label>
                            <Form.Select name="setor_empreendimento" className={inputCls("setor_empreendimento")}
                                value={form.setor_empreendimento} onChange={handleText} required>
                                <option value="">Selecione…</option>
                                {SETORES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </Form.Select>
                            {fe("setor_empreendimento") && <div className="invalid-feedback">{fe("setor_empreendimento")}</div>}
                        </Form.Group>

                        {form.setor_empreendimento === "Outro" && (
                            <Form.Group className="mb-3 col-lg-6" controlId="setor_outros">
                                <Form.Label style={labelStyle}>Qual setor? <span style={{ color: "#EC6508" }}>*</span></Form.Label>
                                <Form.Control type="text" name="setor_outros" className={inputCls("setor_outros")}
                                    value={form.setor_outros} onChange={handleText} placeholder="Descreva o setor" required />
                                {fe("setor_outros") && <div className="invalid-feedback">{fe("setor_outros")}</div>}
                            </Form.Group>
                        )}

                        <Form.Group className="mb-3 col-lg-6" controlId="tempo_existencia">
                            <Form.Label style={labelStyle}>Tempo de existência <span style={{ color: "#EC6508" }}>*</span></Form.Label>
                            <Form.Select name="tempo_existencia" className={inputCls("tempo_existencia")}
                                value={form.tempo_existencia} onChange={handleText} required>
                                <option value="">Selecione…</option>
                                <option value="Até 3 anos">Até 3 anos</option>
                                <option value="De 3 a 5 anos">De 3 a 5 anos</option>
                                <option value="De 5 a 10 anos">De 5 a 10 anos</option>
                                <option value="Mais de 10 anos">Mais de 10 anos</option>
                            </Form.Select>
                            {fe("tempo_existencia") && <div className="invalid-feedback">{fe("tempo_existencia")}</div>}
                        </Form.Group>

                        <Form.Group className="mb-3 col-lg-6" controlId="formalizacao">
                            <Form.Label style={labelStyle}>Formalização <span style={{ color: "#EC6508" }}>*</span></Form.Label>
                            <Form.Select name="formalizacao" className={inputCls("formalizacao")}
                                value={form.formalizacao} onChange={handleText} required>
                                <option value="">Selecione…</option>
                                <option value="MEI">MEI</option>
                                <option value="Microempresa">Microempresa</option>
                                <option value="Não formalizado">Não formalizado</option>
                            </Form.Select>
                            {fe("formalizacao") && <div className="invalid-feedback">{fe("formalizacao")}</div>}
                        </Form.Group>

                        <Form.Group className="mb-3 col-lg-6" controlId="num_pessoas_envolvidas">
                            <Form.Label style={labelStyle}>Pessoas envolvidas <span style={{ color: "#EC6508" }}>*</span></Form.Label>
                            <Form.Select name="num_pessoas_envolvidas" className={inputCls("num_pessoas_envolvidas")}
                                value={form.num_pessoas_envolvidas} onChange={handleText} required>
                                <option value="">Selecione…</option>
                                <option value="Até 2 pessoas">Até 2 pessoas</option>
                                <option value="De 2 a 5 pessoas">De 2 a 5 pessoas</option>
                                <option value="De 5 a 10 pessoas">De 5 a 10 pessoas</option>
                                <option value="Mais de 10 pessoas">Mais de 10 pessoas</option>
                            </Form.Select>
                            {fe("num_pessoas_envolvidas") && <div className="invalid-feedback">{fe("num_pessoas_envolvidas")}</div>}
                        </Form.Group>

                        <Form.Group className="mb-0 col-lg-6" controlId="renda_responsavel">
                            <Form.Label style={labelStyle}>Renda do responsável (R$) <span style={{ color: "#EC6508" }}>*</span></Form.Label>
                            <Form.Control type="text" name="renda_responsavel" className={inputCls("renda_responsavel")}
                                value={form.renda_responsavel} onChange={handleText} placeholder="Ex: 3500" required />
                            {fe("renda_responsavel") && <div className="invalid-feedback">{fe("renda_responsavel")}</div>}
                        </Form.Group>
                    </div>
                </div>

                {/* ── 4. Documentos ── */}
                <div style={sectionCard}>
                    <p style={sectionTitle}>
                        <MdVideoFile size={18} color="#EC6508" />
                        Documentos e vídeo
                    </p>
                    <div className="row">
                        <div className="col-lg-6">
                            <FileZone
                                label="Certificado da Fase 1"
                                accept="image/*,.pdf"
                                file={certificado}
                                onChange={setCertificado}
                                error={fe("certificado_fase1")}
                                required
                                hint="Imagem ou PDF"
                                inputRef={certRef as React.RefObject<HTMLInputElement>}
                            />
                        </div>
                        <div className="col-lg-6">
                            <FileZone
                                label="Vídeo de pitch (3–5 min, máx. 500 MB)"
                                accept="video/*"
                                file={video}
                                onChange={setVideo}
                                error={fe("video_pitch")}
                                required
                                hint="MP4, MOV ou qualquer formato de vídeo"
                                inputRef={videoRef as React.RefObject<HTMLInputElement>}
                            />
                        </div>
                        <div className="col-lg-6">
                            <FileZone
                                label="Documentação complementar"
                                file={docComplementar}
                                onChange={setDocComplementar}
                                hint="Opcional — qualquer formato"
                                inputRef={docRef as React.RefObject<HTMLInputElement>}
                            />
                        </div>
                    </div>
                </div>

                {/* ── 5. LGPD ── */}
                <div style={{ ...sectionCard, marginBottom: 24 }}>
                    <EligCheck
                        id="aceite_termo_lgpd"
                        name="aceite_termo_lgpd"
                        label="Li e aceito os termos de uso e a política de privacidade (LGPD)."
                        checked={form.aceite_termo_lgpd}
                        onChange={handleCheck}
                    />
                </div>

                {/* ── aviso de progresso insuficiente ── */}
                {!programaConcluido && (
                    <div
                        style={{
                            background: "rgba(249,176,64,.1)",
                            border: "1px solid rgba(249,176,64,.4)",
                            borderRadius: 10,
                            padding: "14px 16px",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            marginBottom: 16,
                        }}
                    >
                        <MdWarning size={22} color="#F9B040" style={{ flexShrink: 0 }} />
                        <div>
                            <p style={{ color: "#F9B040", fontSize: 14, fontWeight: 600, margin: 0 }}>
                                Programa não concluído
                            </p>
                            <p style={{ color: "#c8a84a", fontSize: 13, margin: "2px 0 0" }}>
                                Você precisa concluir 100% do programa para enviar sua inscrição.
                                Seu progresso atual é de <strong>{Math.round(progressoGeral)}%</strong>.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── upload progress ── */}
                {loading && (
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ color: "#aaa", fontSize: 13 }}>
                                {uploadProgress < 100 ? "Enviando arquivos…" : "Processando inscrição…"}
                            </span>
                            <span style={{ color: "#EC6508", fontSize: 13, fontWeight: 600 }}>{uploadProgress}%</span>
                        </div>
                        <ProgressBar now={uploadProgress} animated={uploadProgress < 100} striped variant="warning" style={{ height: 8, borderRadius: 4 }} />
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={loading || !form.aceite_termo_lgpd || !programaConcluido}
                    style={{
                        width: "100%",
                        background: form.aceite_termo_lgpd && !loading && programaConcluido ? "linear-gradient(135deg,#EC6508,#d96215)" : "#444",
                        border: "none",
                        borderRadius: 10,
                        padding: "14px 0",
                        fontWeight: 700,
                        fontSize: 15,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        transition: "opacity .2s",
                        opacity: loading || !form.aceite_termo_lgpd || !programaConcluido ? 0.7 : 1,
                    }}
                >
                    {loading
                        ? <><Spinner animation="border" size="sm" style={{ marginRight: 8 }} />Enviando…</>
                        : <><MdSend size={18} />Enviar inscrição</>
                    }
                </Button>
            </Form>
        </div>
    );
}
