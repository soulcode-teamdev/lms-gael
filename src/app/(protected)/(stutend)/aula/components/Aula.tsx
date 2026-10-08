import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useContext, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AuthContext } from "@/contexts/AuthContext";
import { LoaderContext } from "@/contexts/LoaderContext";
import MdlCustomcert from "./MdlCustomcert";
import MdlPage from "./MdlPage";
import MdlQuiz from "./MdlQuiz";
import MdlUrl from "./MdlUrl";
import SendLesson from "./sendLesson";
import Tutor from "./Tutor";
import { api } from "@/shared/api/api";

interface Module {
    name: string;
    id: number;
    course: number;
    availability: string;
    sequence: Sequence[];
}

interface Sequence {
    cmid: number,
    module: string;
    complete: boolean;
    data_module: {
        name: string;
        course: number;
        content: string;
        externalurl: string;
        id: number;
        templateid: number;
    }
}

interface ApiResponse {
    data: Module[];
}

function decodeQueryParam(value: string) {
    return decodeURIComponent(value.replace(/\+/g, " "));
}

export default function Aula() {

    const [aulas, setAulas] = useState<Sequence[]>([]);
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const [paused, setPaused] = useState<boolean>(true);
    const [nextStepIsCertificate, setNextStepIsCertificate] = useState<boolean>(false);

    const { user } = useContext(AuthContext);
    const { updateResponses } = useContext(LoaderContext);

    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const id = searchParams.get('id');
    const cursoId = searchParams.get('cursoId');
    const carreiraId = searchParams.get('carreiraId');
    const carreira = searchParams.get('carreira');
    const curso = searchParams.get('curso');
    const nextModule = searchParams.get('nextModule');
    const carreiraDecoded = decodeQueryParam(String(carreira));
    const cursoDecoded = decodeQueryParam(String(curso));
    let receiveLesson: boolean = false;

    console.log({ id, cursoId, carreiraId, carreiraDecoded, cursoDecoded })

    if (id == "10450" && cursoId == "395" && carreiraId == "396") {
        receiveLesson = true;
    }

    function notifyCohortProgress() {
        if (!user?.id) return;
        // fire and forget: usa fetch direto (fora dos interceptors do `api`) para
        // não logar erro no Firebase nem acionar o logout global de sessão expirada.
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/progress/user-cohort`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(user.token ? { "Authorization": `Bearer ${user.token}` } : {})
            },
            body: JSON.stringify({
                userid: user.id,
                cohortid: 160,
                subcourse_scope: "all",
                exclude_courses: "513,514"
            })
        }).catch(() => { /* ignora: não bloqueia a UX */ });
    }

    function safeAtob(value?: string | null) {
        try {
            return value ? atob(value) : "";
        } catch {
            return "";
        }
    }

    useEffect(() => {
        function getModule() {
            api.get("/module", {
                headers: {
                    "course": cursoId,
                    "Authorization": `Bearer ${user?.token}`
                }
            })
                .then((res: ApiResponse) => {
                    const sequence: Sequence[] = [];
                    res.data.map((item) => {
                        if (item.name) {
                            sequence.push(...item.sequence);
                        }
                    });
                    setActiveIndex(sequence.findIndex((item) => item.cmid == parseInt(id || "0")));
                    setAulas(sequence);
                })
                .catch((err) => {
                    console.error(err);
                })
                .finally(() => {
                    updateResponses();
                });
        }

        if (user?.database && user?.id && id && cursoId && !aulas.length) {
            return getModule();
        }

    }, [id, updateResponses, user, cursoId, aulas]);

    useEffect(() => {
        if (!user?.token || !user?.database || aulas.length === 0) return;

        const sequence = aulas[activeIndex];
        if (!sequence || !sequence.data_module) return;

        const { module, data_module } = sequence;

        const shouldComplete = () => {
            if (module === "mdl_page") {
                const content = data_module.content;
                const isVideo = content?.includes("<video") || content?.includes("<source");
                return content && !isVideo;
            }

            return true;
        };

        if (shouldComplete()) {
            api.post("/module/completion", {
                cmid: sequence.cmid,
                course: data_module.course
            }, {
                headers: {
                    "database": user.database,
                    "Authorization": `Bearer ${user.token}`
                }
            })
                .then((res) => {
                    console.log("Módulo concluído:", res);
                    notifyCohortProgress();
                })
                .catch((err) => console.error("Erro ao concluir módulo:", err));
        }

    }, [aulas, activeIndex, user?.token, user?.database]);

    useEffect(() => {
        function updateIdSearchParam() {
            const params = new URLSearchParams(window.location.search);
            params.set('id', aulas[activeIndex].cmid.toString());

            setNextStepIsCertificate(aulas[activeIndex + 1]?.module == "mdl_customcert")

            window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
        }

        if (aulas[activeIndex]) {
            updateIdSearchParam();
        }

    }, [activeIndex, aulas, pathname, replace, searchParams]);

    function setbuttons() {
        return <div className="d-flex  d-md-none justify-content-between gap-3">

            <button disabled={activeIndex < 1} className="d-flex gap-3 align-items-center text-auxiliary1-project pe-3 border-0 cursor-pointer rounded-5 bg-white" onClick={() => prevOrNext(false)}>
                <div className="p-2 bg-auxiliary6-project rounded-5">
                    <FaChevronLeft className="mx-1" />
                </div>
                Anterior
            </button>
            <button disabled={activeIndex > aulas.length - 2} className="d-flex gap-3 align-items-center text-auxiliary1-project ps-3 border-0 cursor-pointer rounded-5 bg-white" onClick={() => prevOrNext(true)}>
                Próximo
                <div className="p-2 bg-auxiliary6-project rounded-5">
                    <FaChevronRight className="mx-1" />
                </div>
            </button>
        </div>
    }
    function prevOrNext(next: boolean) {
        setPaused(true);
        if (next) {
            setActiveIndex(activeIndex + 1)
        }
        else {
            setActiveIndex(activeIndex - 1)
        }
    }

    function getDisplay(): React.ReactNode {
        switch (aulas[activeIndex]?.module) {
            case "mdl_page":
                return <MdlPage sequence={aulas[activeIndex]} paused={paused} setPaused={setPaused} setbuttons={setbuttons} />;
            case "mdl_url":
                return <MdlUrl sequence={aulas[activeIndex]} setbuttons={setbuttons} />;
            case "mdl_quiz":
                return <MdlQuiz cmid={aulas[activeIndex].cmid} setbuttons={setbuttons} database={user.database} instance={aulas[activeIndex].data_module.id} userid={user.id} sequence={aulas[activeIndex + (nextStepIsCertificate ? 1 : 0)]} nexturl={safeAtob(nextModule)} />;
            case "mdl_customcert":
                return <MdlCustomcert setbuttons={setbuttons} sequence={aulas[activeIndex]} />;
            default:
                return <></>;
        }
    }

    return (
        aulas
        &&
        <div className="row mt-2">
            <a
                href={user.type_render === 'curso' ? `/cursos/${cursoId}` : `/curso?id=${carreiraId}`}
                className="col-12 mt-2 mb-4 text-decoration-none d-flex align-items-center gap-2"
            >
                <FaChevronLeft size={16} />
                {user.type_render === 'curso' ? 'Voltar para curso' : 'Voltar para conteúdo'}
            </a>
            <div className="col-xxl-8 col-12">
                <h2 className="fs-18 fw-700">
                    {aulas[activeIndex]?.data_module.name}
                </h2>
                <div className="d-flex  justify-content-between mt-4">
                    <a href="#tutor" className="d-flex bg-primary px-4 gap-2 align-items-center p-2 rounded text-decoration-none text-white ">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 64 64" id="ai-powered-robot">
                            <g id="AI powered robot">
                                <g id="Union">
                                    <path fill="#000" fill-rule="evenodd" d="M27 12C24.7909 12 23 13.7909 23 16 23 18.2091 24.7909 20 27 20 29.2091 20 31 18.2091 31 16 31 13.7909 29.2091 12 27 12ZM25 16C25 14.8954 25.8954 14 27 14 28.1046 14 29 14.8954 29 16 29 17.1046 28.1046 18 27 18 25.8954 18 25 17.1046 25 16ZM33 16C33 13.7909 34.7909 12 37 12 39.2091 12 41 13.7909 41 16 41 18.2091 39.2091 20 37 20 34.7909 20 33 18.2091 33 16ZM37 14C35.8954 14 35 14.8954 35 16 35 17.1046 35.8954 18 37 18 38.1046 18 39 17.1046 39 16 39 14.8954 38.1046 14 37 14Z" clip-rule="evenodd" />
                                    <path fill="#000" d="M29.3162 22.0513C28.7923 21.8767 28.226 22.1599 28.0513 22.6838C27.8767 23.2077 28.1598 23.7741 28.6838 23.9487C30.8364 24.6662 33.1636 24.6662 35.3162 23.9487C35.8402 23.7741 36.1233 23.2077 35.9487 22.6838C35.774 22.1599 35.2077 21.8767 34.6838 22.0513C32.9417 22.632 31.0583 22.632 29.3162 22.0513Z" />
                                    <path fill="#000" fill-rule="evenodd" d="M25 31C24.4477 31 24 31.4477 24 32V41C24 41.5523 24.4477 42 25 42H39C39.5523 42 40 41.5523 40 41V32C40 31.4477 39.5523 31 39 31H25ZM26 40V33H38V40H26Z" clip-rule="evenodd" />
                                    <path fill="#000" fill-rule="evenodd" d="M19 23C19 24.1256 19.3719 25.1643 19.9996 26H18C17.4477 26 17 26.4477 17 27H12C12 26.4477 11.5523 26 11 26H7C5.34315 26 4 27.3431 4 29V33C4 33.5523 4.44772 34 5 34V38C4.44772 38 4 38.4477 4 39V47C4 47.5523 4.44772 48 5 48H11C11.5523 48 12 47.5523 12 47V39C12 38.4477 11.5523 38 11 38V34C11.5523 34 12 33.5523 12 33H17V37C17 39.7614 18.0175 42.2851 19.698 44.2167C18.1281 44.7569 17 46.2467 17 48V53C17 53.1575 17.0364 53.3066 17.1013 53.4391C15.8152 54.5396 15 56.1746 15 58V58.4545C15 59.3081 15.6919 60 16.5455 60H25.4545C26.3081 60 27 59.3081 27 58.4545V58C27 56.1746 26.1848 54.5396 24.8987 53.4391C24.9636 53.3066 25 53.1575 25 53V48C25 47.8581 24.9926 47.7179 24.9782 47.5797C25.9383 47.8535 26.952 48 28 48H36C37.048 48 38.0617 47.8535 39.0218 47.5797C39.0074 47.7179 39 47.8581 39 48V53C39 53.1575 39.0364 53.3066 39.1013 53.4391C37.8152 54.5396 37 56.1746 37 58V58.4545C37 59.3081 37.6919 60 38.5455 60H47.4545C48.3081 60 49 59.3081 49 58.4545V58C49 56.1746 48.1848 54.5396 46.8987 53.4391C46.9636 53.3066 47 53.1575 47 53V48C47 46.2467 45.8719 44.7569 44.302 44.2167C45.9825 42.2851 47 39.7614 47 37V33H52C52 33.5523 52.4477 34 53 34V38C52.4477 38 52 38.4477 52 39V47C52 47.5523 52.4477 48 53 48H59C59.5523 48 60 47.5523 60 47V39C60 38.4477 59.5523 38 59 38V34C59.5523 34 60 33.5523 60 33V29C60 27.3431 58.6569 26 57 26H53C52.4477 26 52 26.4477 52 27H47C47 26.4477 46.5523 26 46 26H44.0004C44.6281 25.1643 45 24.1256 45 23V22C46.6569 22 48 20.6569 48 19V15C48 13.3431 46.6569 12 45 12H44.9C44.4694 9.87894 42.6962 8.24545 40.5061 8.0253C38.4224 5.48371 35.3032 4 32 4C28.6968 4 25.5776 5.48371 23.4939 8.0253C21.3038 8.24546 19.5306 9.87895 19.1 12H19C17.3431 12 16 13.3431 16 15V19C16 20.6569 17.3431 22 19 22V23ZM32 6C29.9191 6 27.9274 6.71968 26.343 8H37.657C36.0726 6.71968 34.0809 6 32 6ZM43 13C43 11.3465 41.6623 10.0054 40.01 10H23.99C22.3377 10.0054 21 11.3465 21 13V23C21 24.6569 22.3431 26 24 26H40C41.6569 26 43 24.6569 43 23V13ZM54 46V40H58V46H54ZM55 38H57V34H55V38ZM9 38V34H7V38H9ZM6 40V46H10V40H6ZM58 32H54V28H57C57.5523 28 58 28.4477 58 29V32ZM10 32V28H7C6.44772 28 6 28.4477 6 29V32H10ZM52 31H47V29H52V31ZM45 28V37C45 41.9706 40.9706 46 36 46H28C23.0294 46 19 41.9706 19 37V28H45ZM17 31H12V29H17V31ZM43 52C42.2987 52 41.6256 52.1203 41 52.3414V48C41 46.8954 41.8954 46 43 46C44.1046 46 45 46.8954 45 48V52.3414C44.3744 52.1203 43.7013 52 43 52ZM23 52.3414V48C23 46.8954 22.1046 46 21 46C19.8954 46 19 46.8954 19 48V52.3414C19.6256 52.1203 20.2987 52 21 52C21.7013 52 22.3744 52.1203 23 52.3414ZM19 14V20C18.4477 20 18 19.5523 18 19V15C18 14.4477 18.4477 14 19 14ZM45 14V20C45.5523 20 46 19.5523 46 19V15C46 14.4477 45.5523 14 45 14ZM17 58C17 55.7909 18.7909 54 21 54C23.2091 54 25 55.7909 25 58H17ZM43 54C40.7909 54 39 55.7909 39 58H47C47 55.7909 45.2091 54 43 54Z" clip-rule="evenodd" />
                                </g>
                            </g>
                        </svg>
                        Tutor IA
                    </a>
                    <div className="d-none d-md-flex justify-content-end gap-3">

                        <button disabled={activeIndex < 1} className="d-flex gap-3 align-items-center text-auxiliary1-project pe-3 border-0 cursor-pointer rounded-5 bg-white" onClick={() => prevOrNext(false)}>
                            <div className="p-2 bg-auxiliary6-project rounded-5">
                                <FaChevronLeft className="mx-1" />
                            </div>
                            Anterior
                        </button>
                        {
                            activeIndex < aulas.length - 1 && (
                                <button disabled={activeIndex > aulas.length - 2} className="d-flex gap-3 align-items-center text-auxiliary1-project ps-3 border-0 cursor-pointer rounded-5 bg-white" onClick={() => prevOrNext(true)}>
                                    Próximo
                                    <div className="p-2 bg-auxiliary6-project rounded-5">
                                        <FaChevronRight className="mx-1" />
                                    </div>
                                </button>
                            )
                        }
                    </div>
                </div>
                <div>

                </div>
                <div className="mt-4 position-relative d-flex justify-content-center align-items-center">
                    {getDisplay()}
                </div>
                {receiveLesson &&
                    <SendLesson email={user.name} lessonId={id ?? ""} />
                }
                <div className="my-5" id="tutor">
                    {/* <Notas /> */}
                    <Tutor carreira={carreiraDecoded} curso={cursoDecoded} />
                </div>
            </div>
        </div>
    )
}