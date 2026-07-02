import { Button, Card, ProgressBar } from 'react-bootstrap';
import React, { useContext, useEffect, useMemo, useState } from 'react';

import { AuthContext } from '@/contexts/AuthContext';
import Certificado from '@/components/Certificado/CertificadoGeral';
import { FaRegFilePdf } from 'react-icons/fa';
import { api } from "@/shared/api/api";
import { apiRd } from '@/shared/api/apiRd';

interface Course {
  courseid: number;
  fullname: string;
  shortname: string;
  completed: boolean;
}

interface Career {
  courseid: number;
  fullname: string;
  shortname: string;
  completed: boolean;
  children: Course[];
}

interface ProgressResponse {
  userid: number;
  scope: string;
  cohortid: number;
  subcourse_scope: string;
  totals: {
    courses: number;
    careers: number;
    completedCourses: number;
    completedCareers: number;
  };
  progress: {
    courses: number;
    careers: number;
    overall: number;
  };
  completedAll: boolean;
  courses: Course[];
  careers: Career[];
}

interface CertificateData {
  certificate_created: number;
  code: string;
  coursename: string;
  firstname: string;
  lastname: string;
  workload: string;
  name: string;
}

const CertificadoGeral: React.FC = () => {
  const [data, setData] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [triggerDownload, setTriggerDownload] = useState<boolean[]>([false]);

  const { user, perfil } = useContext(AuthContext);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user?.token) return;

      setLoading(true);
      setError('');

      try {
        const response = await api.get("/progress/user-cohort",
          {
            headers: {
              userid: user.id,
              cohortid: 160,
              subcourse_scope: 'all',
              scope: 'cohort',
              exclude_courses: '513,514'
            }
          }
        );

        setData(response.data);
      } catch {
        setError('Erro ao buscar progresso.');
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [user?.id, user?.token]);

  const certificadoMockado: CertificateData = useMemo(() => {
    function capitalizeFirstLetter(text: string) {
      if (!text) return ""; // Retorna vazio se o texto for undefined, null ou ""
      return text.charAt(0).toUpperCase() + text.slice(1);
    }

    return {
      certificate_created: new Date().getTime() / 1000,
      code: `GERAL-${data?.userid ?? '0000'}-${data?.cohortid ?? '160'}`,
      coursename: '',
      firstname: capitalizeFirstLetter(perfil.firstname),
      lastname: capitalizeFirstLetter(perfil.lastname),
      workload: `${data?.totals?.courses ?? 0} cursos concluídos`,
      name: ''
    };
  }, [data?.cohortid, data?.totals?.courses, data?.userid, perfil.firstname, perfil.lastname]);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>{error}</div>;
  if (!data) return null;

  return (
    <div className="row">
      <span className="fs-28 mb-5 fw-700 text-auxiliary2-project">
        Certificado geral
      </span>

      <div className="col-xxl-3 col-md-4 col-md-6 col-10">
        <Card className="mb-3 p-3 h-100">
          <Card.Title className="mb-3 pt-2 text-center text-auxiliary2-project">
            O Certificado geral é desbloqueado ao concluir todos os cursos e atividades.
            <FaRegFilePdf className="w-75 h-auto px-4 mt-3" color="#FF3B30" />
          </Card.Title>

          <Card.Body className="d-flex flex-column">
            <ProgressBar now={data.progress.overall} label={`${data.progress.overall}%`} />

            <div className="mt-3">
              <Button
                className="w-100"
                onClick={() => {
                  const newTrigger = [...triggerDownload];
                  newTrigger[0] = true;
                  setTriggerDownload(newTrigger);
                }}
                disabled={data.progress.overall < 99}
              >
                Baixar Certificado
                <FaRegFilePdf color="#fff" className="ms-2" />
              </Button>
            </div>
          </Card.Body>
        </Card>

        <Certificado
          certificado={certificadoMockado}
          triggerDownload={triggerDownload}
          index={0}
          onDownloaded={() => {
            const newTrigger = [...triggerDownload];
            newTrigger[0] = false;
            setTriggerDownload(newTrigger);
          }}
        />
      </div>
    </div>
  );
};

export default CertificadoGeral;