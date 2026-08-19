import { useContext, useEffect, useState } from "react";

import { AuthContext } from "@/contexts/AuthContext";
import Image from "next/image";
import { LoaderContext } from "@/contexts/LoaderContext";
import { ProgressBar } from "react-bootstrap";
import { RiPlayMiniLine } from "react-icons/ri";
import { api } from "@/shared/api/api";
import bannerDesktop from "/public/gael/banner_plataforma_cria_mais_1209x320.png";
import bannerMobile from "/public/gael/banner_plataforma_cria_mais_352x171.png";
import cardDireita from "/public/gael/banner_plataforma_cria_mais_649x314.png";

interface Course {
    id: number;
    fullname: string;
    summary?: string;
    visible?: number;
    category: string;
    icon?: string;
    carga: string;
    carreira: string;
    inscrito?: number;
    destaque?: number;
    progresso?: string;
}

interface ApiResponse {
    data: Course[];
}

export default function Hero() {
    const [course, setCourse] = useState<Course>();

    const { user } = useContext(AuthContext);
    const { updateResponses } = useContext(LoaderContext);

    useEffect(() => {
        function getCourse() {
            api.get("/course", {
                headers: {
                    "database": user?.database,
                    "Authorization": `Bearer ${user?.token}`
                }
            })
                .then((res: ApiResponse) => {
                    let curso;

                    if (user?.type_render === 'carreira') {
                        curso = res.data.find((car) => car.id === 507);
                    } else if (user?.type_render === 'curso') {
                        curso = res.data.find((car) => !car.carreira || car.carreira.toUpperCase() !== 'SIM');
                    }

                    setCourse(curso);
                })
                .catch((err) => console.error(err))
                .finally(() => updateResponses());
        }

        if (user?.name && user?.database && !course) {
            getCourse();
        }
    }, [user, updateResponses, course]);

    function removeHtmlTags(text: string) {
        return text.replace(/<[^>]*>/g, '');
    }

    function getImgUrl(url: string) {
        const regex = /<img[^>]+src\s*=\s*['"]([^'"]+)['"][^>]*>/i;
        const match = url.match(regex);
        return match ? match[1] : "";
    }

    return (
        course &&
        <div className="row hero-carreiras">
            <div className="col-12 p-xxl-0 m-xxl-0">
                <div className="row row-gap-4 mt-0">
                    <a href="/inscricao-fase2" className="col-12 px-3.5 d-lg-block d-none">
                        <Image src={bannerDesktop.src} width={0} height={0} className="w-100 h-auto rounded-3 shadow" alt="Banner Gael" />
                    </a>
                    <a href="/inscricao-fase2" className="col-12 px-3.5 d-lg-none">
                        <Image src={bannerMobile.src} width={0} height={0} className="w-100 h-auto rounded-3 shadow" alt="Banner Gael" />
                    </a>
                    <div className="col-xxl-6 col-12 card-hero d-block ">
                        <div className="d-flex box-shadow-hero rounded-3  h-100">
                            <div className="col-5 px-0 rounded-start-3 ">
                                <Image
                                    src={getImgUrl(course?.icon || "")}
                                    width={0}
                                    height={0}
                                    className="w-100   h-100 object-fit-cover rounded-start-3"
                                    alt="Imagem ilustrativa"
                                />
                            </div>

                            <div className="col-7 bg-white d-flex flex-column  py-4 px-3 justify-content-between rounded-end-3">
                                <span className="fw-700 fs-21 text-start ">{course?.fullname}</span>
                                <span className="card-text-hero">{removeHtmlTags(course?.summary || "")}</span>
                                <div className="d-flex flex-column flex-md-row justify-content-between py-md-4 py-2">
                                    <span className="fs-12 d-flex align-items-center my-md-0 my-3">
                                        {/* <FaRegClock className='text-auxiliary1-project me-2' /> */}
                                        {/* {course?.carga} DE ESTUDO */}
                                        TRILHA 2
                                    </span>
                                    <a href={user.type_render === 'curso' ? `/cursos/${course.id}` : `/curso?id=${course.id}`}
                                        className="btn btn-primary d-flex align-items-center justify-content-center fs-12 fw-700 px-exxl-4">
                                        {user?.type_render === 'curso' ? 'Acessar Curso' : 'Acessar Conteúdo'}
                                        <RiPlayMiniLine size={20} strokeWidth={0.5} className="ms-1" />
                                    </a>
                                </div>
                                <div className="d-flex gap-2 align-items-center fs-12 my-2 fw-700">
                                    <div className="w-100">
                                        <ProgressBar now={parseInt(course?.progresso || "0")} />
                                    </div>
                                    {course?.progresso || "0"}%
                                </div>
                            </div>
                        </div>
                    </div>

                    <a href="/inscricao-fase2" className="col-xxl-6 col-12 card-hero">
                        <div className="position-relative w-100 h-100 rounded-3 shadow overflow-hidden">
                            <Image src={cardDireita.src} width={0} height={0} className="w-100 h-100 object-fit-cover" alt="Card direita" style={{ minHeight: '220px' }} />
                        </div>
                    </a>
                </div>
            </div>
        </div>
    );
}
