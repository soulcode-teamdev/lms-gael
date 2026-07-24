import { Button, Modal } from "react-bootstrap";
import { useContext, useEffect, useState } from "react";

import { AuthContext } from "@/contexts/AuthContext";
import Certificado from "@/components/Certificado/Certificado";
import { api } from "@/shared/api/api";
import axios from "axios";

export interface Sequence {
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

interface Props {
    sequence: Sequence;
    setbuttons: () => React.ReactElement;
}

export interface CertificateData {
    certificate_created: number;
    code: string;
    coursename: string;
    firstname: string;
    lastname: string;
    workload: string;
    name: string;
}

export default function MdlCustomcert({ sequence, setbuttons }: Props) {

    console.log(sequence)

    const { user } = useContext(AuthContext);

    const [certificado, setCertificado] = useState<CertificateData | null>(null);
    const [triggerDownload, setTriggerDownload] = useState<boolean[]>([false]);
    const [erroEmissao, setErroEmissao] = useState<string | null>(null);


    const [show, setShow] = useState(true);

    const handleClose = () => setShow(false);

    useEffect(() => {
        buscarCertificado(true);
    }, []);

    const buscarCertificado = async (readyOnly?: boolean) => {

        if (!user?.token) return;

        try {
            const res = await api.get("/certificate", {
                headers: {

                    course: sequence.data_module.course,
                    template_id: sequence.data_module.templateid
                }
            });
            if (readyOnly) return;
            setCertificado(res.data);
            setTriggerDownload([true]);
        } catch (err) {
            if (readyOnly) return;

            // 403: não elegível (não matriculado, curso não concluído, template inválido).
            if (axios.isAxiosError(err) && err.response?.status === 403) {
                const detalhe = (err.response?.data as { error?: string })?.error;
                setErroEmissao(
                    "Não foi possível emitir o certificado. Verifique se você concluiu todas as atividades obrigatórias do curso." +
                    (detalhe ? `\n\nDetalhe: ${detalhe}` : "")
                );
                return;
            }

            setErroEmissao("Não foi possível emitir o certificado. Tente novamente mais tarde.");
        }
    };

    return (
        <div className="w-100">
            <Modal show={!!erroEmissao} centered onHide={() => setErroEmissao(null)}>
                <Modal.Header closeButton>
                    <Modal.Title className="fs-18">Certificado indisponível</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ whiteSpace: "pre-line" }}>{erroEmissao}</Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={() => setErroEmissao(null)}>Entendi</Button>
                </Modal.Footer>
            </Modal>
            <Modal show={show} centered onHide={handleClose} className="position-relative" backdrop={true}>
                <img
                    src="/gael/certificado_gael_grafismo_2.png"
                    alt=""
                    style={{
                        position: 'absolute', width: 100,
                        zIndex: 1, top: 8, right: 8,
                    }}
                />
                {/* Camada 2 do background */}
                <img
                    src="/gael/certificado_gael_grafismo_1.png"
                    alt=""
                    style={{
                        position: 'absolute', width: 100,
                        zIndex: 1, bottom: 8, left: 8,
                    }}
                />
                <div className="d-flex flex-column justify-content-center align-items-center pb-5 w-100 bg-secondary gap-3 h-100 border-primary rounded-3" style={{ border: "8px solid" }}>
                    <h1 className="text-primary m-0 mt-5 fw-bold">Parabéns!</h1>
                    <h2 className="text-auxiliary2-project m-0 mb-4">Trilha Concluída!</h2>
                    <div className="d-flex justify-content-center gap-3 mt-4 pb-2">
                        <a className="btn btn-outline-primary" href={"/carreiras"}>
                            Voltar para home
                            {/* <span className="" style={{ transform: 'scaleX(-1)' }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="black"><path d="m560-240-56-58 142-142H160v-80h486L504-662l56-58 240 240-240 240Z" /></svg>
                                        </span> */}
                        </a>
                        <Button variant="primary" onClick={() => buscarCertificado()}>
                            Baixe seu certificado
                            <span className=""><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="black"><path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z" /></svg></span>
                        </Button>
                    </div>
                </div>
                <Certificado
                    certificado={certificado}
                    triggerDownload={triggerDownload}
                    index={0}
                    onDownloaded={() => setTriggerDownload([false])}
                />
            </Modal>
            <div className="w-100 my-3 mb-5 d-flex">

                <Button className="px-3 w-100" onClick={() => buscarCertificado()}>Baixar Certificado</Button>
                <Certificado
                    certificado={certificado}
                    triggerDownload={triggerDownload}
                    index={0}
                    onDownloaded={() => setTriggerDownload([false])}
                />
            </div>
            {setbuttons()}
        </div>
    );
}