import { useContext, useEffect, useRef, useState } from "react";

import { AuthContext } from "@/contexts/AuthContext";
import { FaCheckCircle } from "react-icons/fa";
import Image from "next/image";
import { api } from "@/shared/api/api";
import playImg from "/public/play.png";

interface Sequence {
    cmid: number;
    module: string;
    complete: boolean;
    data_module: {
        name: string;
        course: number;
        content: string;
        externalurl: string;
        id: number;
    };
}

interface Props {
    sequence: Sequence;
    paused: boolean;
    setPaused: (newPaused: boolean) => void;
    setbuttons: () => React.ReactElement;
}

export default function MdlPage({ sequence, paused, setPaused, setbuttons }: Props) {

    const videoRef = useRef<HTMLVideoElement>(null);

    const [progress, setProgress] = useState<number>(0);
    const [completed, setCompleted] = useState<boolean>(false);
    const [isSeeking, setIsSeeking] = useState<boolean>(false);
    const [videoError, setVideoError] = useState<boolean>(false);
    const [videoErrorMsg, setVideoErrorMsg] = useState<string>("");

    const watchedSeconds = useRef<number>(0);
    const lastTime = useRef<number>(0);

    const { user } = useContext(AuthContext);

    function getVideoLink(): string {
        const content = sequence.data_module.content;

        // Primeiro tenta <source src="...">; se não houver, aceita <video src="...">.
        const sourceMatch = /<source\s+[^>]*src="([^"]+)"/i.exec(content);
        if (sourceMatch) return sourceMatch[1];

        const videoMatch = /<video\s+[^>]*src="([^"]+)"/i.exec(content);
        return videoMatch ? videoMatch[1] : "";
    }

    function getDownloadLink(): string {
        const url = getVideoLink();
        if (!url) return url;

        // URLs de arquivo do Moodle (pluginfile.php) aceitam forcedownload=1,
        // que força o download em vez de tentar reproduzir inline no navegador.
        try {
            const parsed = new URL(url);
            if (parsed.pathname.includes("pluginfile.php")) {
                parsed.searchParams.set("forcedownload", "1");
                return parsed.toString();
            }
        } catch {
            // URL relativa ou malformada: retorna como está.
        }
        return url;
    }

    function getContentWithoutVideo(): string {
        return sequence.data_module.content
            .replace(/<video[\s\S]*?<\/video>/gi, "")
            .trim();
    }

    function hasVideo(): boolean {
        return (
            sequence.data_module.content.includes("<video") ||
            sequence.data_module.content.includes("<source")
        );
    }

    function isLinkOrText(): string {
        if (
            sequence.data_module.content.includes("<video") ||
            sequence.data_module.content.includes("<source")
        ) {
            return "link";
        }
        return "texto";
    }

    function handleVideoError(): void {
        const err = videoRef.current?.error;

        // Códigos definidos pela especificação HTMLMediaElement (MediaError)
        let msg: string;
        switch (err?.code) {
            case 1: // MEDIA_ERR_ABORTED
                msg = "A reprodução foi interrompida. Tente recarregar a página.";
                break;
            case 2: // MEDIA_ERR_NETWORK
                msg = "Houve um problema de conexão ao carregar o vídeo. Verifique sua internet e tente novamente.";
                break;
            case 3: // MEDIA_ERR_DECODE
                msg = "Ocorreu um erro ao decodificar o vídeo neste navegador.";
                break;
            case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
            default:
                msg = "Este vídeo não é suportado por este navegador.";
                break;
        }

        setVideoErrorMsg(msg);
        setVideoError(true);
    }

    function handleDownloadComplete(): void {
        // Quando o vídeo não reproduz no navegador e o usuário baixa o arquivo
        // pelo fallback, consideramos a aula concluída.
        if (!completed) {
            completeModule();
            setCompleted(true);
            setProgress(80); // preenche a barra de progresso (capada em 80%)
        }
    }

    function play(): void {
        const video = videoRef.current;
        if (!video) return;

        if (paused) {
            video.play();
            setPaused(false);
        }
    }

    function handleTimeUpdate() {
        const video = videoRef.current;
        if (!video || isSeeking || !isFinite(video.duration) || video.duration <= 0)
            return;

        const current = video.currentTime;
        const delta = Math.max(0, current - lastTime.current);
        lastTime.current = current;

        watchedSeconds.current += delta;

        const percentWatched = (watchedSeconds.current / video.duration) * 100;
        setProgress(percentWatched);

        if (percentWatched >= 80 && !completed) {
            completeModule();
            setCompleted(true);
        }
    }

    function handleSeeking() {
        setIsSeeking(true);
    }

    function handleSeeked() {
        setIsSeeking(false);
        const video = videoRef.current;
        if (video) lastTime.current = video.currentTime;
    }

    function completeModule() {
        api
            .post("/module/completion",
                {
                    cmid: sequence.cmid,
                    course: sequence.data_module.course
                },
                {
                    headers: {
                        database: user.database
                    }
                }
            )
            .then((res) => {
                console.log("Módulo concluído via vídeo!", res);
            })
            .catch((err) => {
                console.error("Erro ao concluir módulo:", err);
            });
    }

    const cappedProgress = progress >= 80 ? 80 : progress;
    const displayedProgress = (cappedProgress / 80) * 100;

    useEffect(() => {
        console.log(sequence.data_module.content)
        setProgress(0);
        setCompleted(false);
        setIsSeeking(false);
        setVideoError(false);
        setVideoErrorMsg("");

        watchedSeconds.current = 0;
        lastTime.current = 0;

        const video = videoRef.current;
        if (video) {
            video.pause();
            video.currentTime = 0;
            video.load();
        }
    }, [sequence]);

    return isLinkOrText() === "link" ? (
        <div className="position-relative w-100">
            {hasVideo() && (
                <>
                    <div className="position-relative">
                        <video
                            src={getVideoLink()}
                            controls={!paused}
                            ref={videoRef}
                            className="w-100 rounded-3 position-relative bg-auxiliary6-project"
                            onClick={play}
                            onTimeUpdate={handleTimeUpdate}
                            onSeeking={handleSeeking}
                            onSeeked={handleSeeked}
                            onError={handleVideoError}
                            style={videoError ? { display: "none" } : undefined}
                        ></video>

                        {videoError && (
                            <div
                                className="rounded-3 bg-auxiliary6-project d-flex flex-column align-items-center justify-content-center text-center p-4"
                                style={{ minHeight: 240, gap: 12 }}
                            >
                                <p style={{ color: "#F9F8F1", fontWeight: 600, margin: 0 }}>
                                    {videoErrorMsg || "Não foi possível reproduzir o vídeo neste navegador."}
                                </p>
                                <p style={{ color: "#aaa", fontSize: 14, margin: 0 }}>
                                    Você pode abrir ou baixar o vídeo e assistir pelo player do seu
                                    dispositivo.
                                </p>
                                <a
                                    href={getDownloadLink()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={handleDownloadComplete}
                                    style={{
                                        background: "rgba(236,101,8,.1)",
                                        border: "1px solid rgba(236,101,8,.4)",
                                        borderRadius: 10,
                                        padding: "10px 20px",
                                        color: "#EC6508",
                                        fontSize: 14,
                                        fontWeight: 600,
                                        textDecoration: "none",
                                    }}
                                >
                                    Abrir / baixar o vídeo
                                </a>
                            </div>
                        )}

                        {paused && !videoError && (
                            <div
                                className="position-absolute top-50 start-50 translate-middle cursor-pointer"
                                onClick={play}
                            >
                                <Image src={playImg.src} width={150} height={150} alt="play" />
                            </div>
                        )}
                    </div>

                    <div className="d-flex align-items-center mt-3 gap-3">
                        <div className="progress flex-grow-1" style={{ height: '10px' }}>
                            <div
                                className="progress-bar bg-success"
                                role="progressbar"
                                style={{ width: `${displayedProgress}%` }}
                                aria-valuenow={displayedProgress}
                                aria-valuemin={0}
                                aria-valuemax={100}
                            ></div>
                        </div>
                        {completed && <FaCheckCircle size={24} color="green" />}
                    </div>
                    {setbuttons()}
                </>
            )}


            <span
                className="dangerouslySetInnerHTML"
                dangerouslySetInnerHTML={{ __html: getContentWithoutVideo() }}
            ></span>
        </div>) :
        <div className="w-100" >
            {(() => {
                const match = /<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(sequence.data_module.content);
                if (match) {
                    const href = match[1];
                    const label = match[2].replace(/<[^>]+>/g, "").trim() || "Download";
                    return (
                        <>
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary d-inline-flex mb-2 align-items-center justify-content-center gap-2 w-100 text-center"
                                download
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
                                </svg>
                                {label}
                            </a>
                            {setbuttons()}  
                        </>
                    );
                }
                return (
                    <span
                        className="dangerouslySetInnerHTML"
                        dangerouslySetInnerHTML={{ __html: sequence.data_module.content }}
                    ></span>
                );
            })()}
        </div >

}