import { Accordion, AccordionBody, AccordionHeader, AccordionItem, Col, Row } from "react-bootstrap";

export default function Faq() {
    return (
        <Row className="d-flex justify-content-center py-5 px-2">
            <Col xxl={8} md={19}>
                <span>Faq</span>
                <h2 className="fw-700 fs-28 mb-4 mt-2">Dúvidas Frequentes</h2>

                <Accordion alwaysOpen>
                    <AccordionItem eventKey="0" className="mb-2">
                        <AccordionHeader>Para quem é o Cria Mais?</AccordionHeader>
                        <AccordionBody>
                            O programa foi feito para pessoas criativas, empreendedores, que trabalham por conta própria e querem aprender a organizar suas finanças.
                        </AccordionBody>
                    </AccordionItem>

                    <AccordionItem eventKey="1" className="mb-2">
                        <AccordionHeader>Como funciona o Capital Semente de R$ 8 mil?</AccordionHeader>
                        <AccordionBody>
                            <p>
                                O Capital Semente é um incentivo a fundo (não é empréstimo) de R$ 8.000,00 para compra de equipamentos, insumos ou divulgação do seu negócio criativo.
                            </p>
                            <p className="mb-1">Como concorrer a uma das 60 vagas (com mentorias exclusivas):</p>
                            <ul className="mb-0">
                                <li>Conclua as 4 trilhas obrigatórias da Fase I na plataforma.</li>
                                <li>A partir de 20/08, preencha o formulário de seleção na sua área logada.</li>
                                <li>Envie um vídeo-pitch simples de 3 a 5 minutos apresentando seu projeto e onde sugere investir o recurso.</li>
                            </ul>
                        </AccordionBody>
                    </AccordionItem>

                    <AccordionItem eventKey="2" className="mb-2">
                        <AccordionHeader>Já terminei as 4 trilhas. Qual é o passo a passo para me inscrever na Fase II?</AccordionHeader>
                        <AccordionBody>
                            <p>
                                Parabéns pela conclusão! Com as trilhas finalizadas, seu botão de inscrição para a Fase II estará automaticamente liberado no painel. Clicando nele, você vai:
                            </p>
                            <ul>
                                <li>Preencher um formulário simplificado com os dados do seu empreendimento.</li>
                                <li>Anexar o link ou arquivo do seu vídeo-pitch de 3 a 5 minutos.</li>
                                <li>Dar o aceite nos termos do programa e enviar.</li>
                            </ul>
                            <p className="mb-0">Dica: Fique de olho no prazo final das inscrições: dia 20 de setembro!</p>
                        </AccordionBody>
                    </AccordionItem>

                    <AccordionItem eventKey="3" className="mb-2">
                        <AccordionHeader>Como devo gravar e o que preciso falar no meu vídeo-pitch?</AccordionHeader>
                        <AccordionBody>
                            <p>
                                Relaxa, não é preciso edição profissional! Grave pelo celular mesmo, num local claro e silencioso. Em 3 a 5 minutos, mande o papo reto respondendo:
                            </p>
                            <ul className="mb-0">
                                <li>Quem é você e o seu negócio (O que você faz)?</li>
                                <li>Qual é o maior desafio da sua empresa hoje?</li>
                                <li>Como os R$ 8 mil do Capital Semente podem ajudar no desenvolvimento do seu negócio?</li>
                            </ul>
                        </AccordionBody>
                    </AccordionItem>

                    <AccordionItem eventKey="4" className="mb-2">
                        <AccordionHeader>Como meu projeto será avaliado e quando sairá o resultado?</AccordionHeader>
                        <AccordionBody>
                            Nossa banca de especialistas vai analisar seu empreendimento olhando para a inovação, o impacto na comunidade, a clareza da sua história e a viabilidade dos R$ 8 mil realmente impactarem seu corre. A lista dos 60 selecionados sai dia 28 de setembro na plataforma e nas nossas redes!
                        </AccordionBody>
                    </AccordionItem>

                    <AccordionItem eventKey="5" className="mb-2">
                        <AccordionHeader>Poderei usar o capital semente como eu quiser?</AccordionHeader>
                        <AccordionBody>
                            Não. O Capital Semente de R$ 8 mil é pra fazer seu corre crescer! Junto com seu mentor, você vai definir o investimento focado nas prioridades reais do negócio, seja equipamento, produção ou marketing, pra virar a chave e gerar mais renda.
                        </AccordionBody>
                    </AccordionItem>

                    <AccordionItem eventKey="6" className="mb-2">
                        <AccordionHeader>Quanto tempo duram as mentorias?</AccordionHeader>
                        <AccordionBody>
                            Serão 3 meses de acompanhamento colado no seu negócio! Durante esse tempo, você vai ter encontros com o seu mentor ou mentora pra olhar a realidade da sua empresa de perto. O foco é entender a sua rotina e colocar a mão na massa com atividades práticas pra organizar a gestão e ajustar o que for preciso.
                        </AccordionBody>
                    </AccordionItem>

                    <AccordionItem eventKey="7" className="mb-2">
                        <AccordionHeader>Por quanto tempo terei mentoria e poderei usar o capital semente?</AccordionHeader>
                        <AccordionBody>
                            As mentorias e o uso do recurso duram 3 meses! Nesse período, você e seu mentor vão se encontrar pra organizar a gestão do seu microempreendimento, colocar tarefas práticas em dia e aplicar o Capital Semente no ritmo certo pra sua empresa crescer.
                        </AccordionBody>
                    </AccordionItem>

                    <AccordionItem eventKey="8" className="mb-2">
                        <AccordionHeader>As mentorias serão on-line ou presenciais?</AccordionHeader>
                        <AccordionBody>
                            As mentorias são 100% online pelo Google Meet. Todos os encontros vão seguir um cronograma definido e avisado com antecedência pra você conseguir se organizar direitinho sem atrapalhar sua rotina.
                        </AccordionBody>
                    </AccordionItem>

                    <AccordionItem eventKey="9" className="mb-2">
                        <AccordionHeader>Preciso enviar algum documento pra participar da FASE II?</AccordionHeader>
                        <AccordionBody>
                            Não! Pra participar da seleção e receber R$ 8 mil + mentorias na Fase II, é só preencher um formulário simples na própria plataforma do Cria Mais e enviar o vídeo-pitch do seu negócio.
                        </AccordionBody>
                    </AccordionItem>

                    <AccordionItem eventKey="10" className="mb-2">
                        <AccordionHeader>Se eu for selecionado(a), o capital semente cai direto na minha conta?</AccordionHeader>
                        <AccordionBody>
                            Não. O repasse dos R$ 8 mil é feito conforme a aprovação do Plano de Aplicação, que você e seu mentor vão montar juntos para garantir que o dinheiro vá direto pras prioridades reais do seu negócio.
                        </AccordionBody>
                    </AccordionItem>

                    <AccordionItem eventKey="11" className="mb-2">
                        <AccordionHeader>Posso receber o capital semente em uma conta comum?</AccordionHeader>
                        <AccordionBody>
                            Sim! Você pode usar a sua conta de sempre, desde que ela esteja no mesmo nome e CPF/CNPJ de quem fez a inscrição do empreendimento na Fase II.
                        </AccordionBody>
                    </AccordionItem>

                </Accordion>
            </Col>
        </Row>
    );
}
