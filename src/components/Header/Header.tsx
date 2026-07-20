"use client";

import { FaChevronRight, FaSearch } from "react-icons/fa";
import { Form, Nav, Navbar, NavbarCollapse, NavbarToggle } from 'react-bootstrap';
import { useContext, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AuthContext } from '@/contexts/AuthContext';
import { GoGear } from "react-icons/go";
import { GoHome } from "react-icons/go";
import Image from 'next/image';
import { LiaCertificateSolid } from "react-icons/lia";
import { MdLogout, MdOutlineAssignment } from "react-icons/md";
import { PiStudentBold } from "react-icons/pi";
import aluno from "/public/aluno_2.png";
import logo from "/public/gael/logo.png";

export default function Header() {

  const [value, setValue] = useState<string>();

  const { user, perfil,
    signOut
  } = useContext(AuthContext);

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { push } = useRouter();


  function handleSearch() {
    const destino = user?.type_render === 'curso' ? '/cursos' : '/carreiras';

    if (!pathname.includes(destino.replace("/", ""))) {
      push(`${destino}?search=${value}`);
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("search", value || "");
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }

  return (
    <Navbar expand="lg" className="header bg-auxiliary2-project py-lg-2 py-4 position-absolute w-100" style={{ zIndex: 500 }}>

      <div className='d-lg-flex d-none justify-content-end w-100 align-items-center gap-5'>
        <div className="position-relative">
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}>
            <Form.Control className="form-input-header" type="text" placeholder="Buscar Cursos" onChange={(e) => setValue(e.target.value)} />
            <FaSearch className="form-input-icon-header cursor-pointer" color="#fff" onClick={handleSearch} />
          </form>
        </div>
        <a href="/perfil" className="d-flex gap-2 align-items-center text-decoration-none">
          <Image src={perfil?.imagealt || aluno.src} width={55} height={55} alt="foto de aluno" className="foto-aluno-header" />
          <span className="fw-300 fs-12 text-white">Olá, {perfil?.firstname || "Estudante"}</span>
          <FaChevronRight color="#fff" size={18} />
        </a>
      </div>

      <div className="d-lg-none   d-flex  justify-content-between w-100 px-3 ">
        <a href="/carreiras" className="d-flex justify-content-center gap-4  ">
          <Image src={logo.src} width={72} height={42} alt="logo Gael" className="object-fit-contain" />
        </a>
        <NavbarToggle aria-controls="basic-navbar-nav" />
      </div>


      <NavbarCollapse id="basic-navbar-nav">
        <Nav className="me-auto d-lg-none">
          <div className="d-flex flex-column align-items-center gap-1">
            <a href="/carreiras" className="ps-2 icon-18-sidebar header-item fs-12 fw-700 py-2 div-icon-sidebar mt-5 text-white">
              <GoHome color="#fff" size={20} strokeWidth={0.5} className="me-2" />
              Home
            </a>

            <a href="/perfil" className="ps-2 icon-18-sidebar header-item fs-12 fw-700 py-2 div-icon-sidebar text-white">
              <PiStudentBold color="#fff" size={18} className="me-2" />
              Meu Perfil
            </a>

            <a href="/certificados" className="ps-2 icon-18-sidebar header-item fs-12 fw-700 py-2 div-icon-sidebar text-white">
              <LiaCertificateSolid color="#fff" size={18} className="me-2" strokeWidth={0.5} />
              Certificados
            </a>

            <a href="/inscricao-fase2" className="ps-2 icon-18-sidebar header-item fs-12 fw-700 py-2 div-icon-sidebar text-white">
              <MdOutlineAssignment color="#fff" size={18} className="me-2" strokeWidth={0.5} />
              Inscrição Fase 2
            </a>

            <a href="/perfil/editar" className="ps-2 icon-18-sidebar header-item fs-12 fw-700 py-2 div-icon-sidebar text-white mb-5">
              <GoGear color="#fff" size={18} className="me-2" strokeWidth={0.5} />
              Configurações
            </a>

            <button className="btn bg-white w-50" onClick={signOut}>
              <MdLogout className="text-auxiliary1-project me-2" size={20} />
              <span>Sair</span>
            </button>

          </div>
        </Nav>
      </NavbarCollapse>
    </Navbar>
  )
}