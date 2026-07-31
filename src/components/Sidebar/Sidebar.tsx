"use client";

import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useContext, useState } from "react";

import { AuthContext } from "@/contexts/AuthContext";
import { GoGear } from "react-icons/go";
import { GoHome } from "react-icons/go";
import Image from "next/image";
import { LiaCertificateSolid } from "react-icons/lia";
import { MdLogout, MdOutlineAssignment } from "react-icons/md";
import { PiStudentBold } from "react-icons/pi";
import logo1 from "/public/gael/logo_login.png";

export default function Sidebar() {

    const { signOut } = useContext(AuthContext);

    const [open, setOpen] = useState<boolean>(false);

    const { user } = useContext(AuthContext);

    return (
        <div className={`d-lg-flex d-none gap-1 sidebar position-fixed bg-auxiliary2-project position-relative flex-column align-items-center px-3 py-4 ${open ? 'sidebar-open' : ''}`}>

            <a className="d-flex gap-3 row-gap-0 flex-wrap" href={user?.type_render === 'carreira' ? "/carreiras" : "/cursos"}>
                <Image src={logo1.src} width={70} height={45} alt="logo Gael" className="object-fit-contain" style={{ maxWidth: '70px' }} />
            </a>

            <a href={user?.type_render === 'carreira' ? "/carreiras" : "/cursos"} className={`${open ? 'w-100 ps-2 icon-18-sidebar fs-12 fw-700 py-2' : ''} div-icon-sidebar mt-5 text-white`}>
                <GoHome color="#fff" size={20} strokeWidth={0.5} />
                {open && 'Home'}
            </a>

            <a href="/perfil" className={`${open ? 'w-100 ps-2 icon-18-sidebar fs-12 fw-700 py-2' : ''} div-icon-sidebar text-white`}>
                <PiStudentBold color="#fff" size={20} />
                {open && 'Minhas Carreiras'}
            </a>

            <a href="/certificados" className={`${open ? 'w-100 ps-2 icon-18-sidebar fs-12 fw-700 py-2' : ''} div-icon-sidebar text-white`}>
                <LiaCertificateSolid color="#fff" size={20} strokeWidth={0.5} />
                {open && 'Certificados'}
            </a>

            <a href="/inscricao-fase2" className={`${open ? 'w-100 ps-2 icon-18-sidebar fs-12 fw-700 py-2' : ''} div-icon-sidebar text-white`}>
                <MdOutlineAssignment color="#fff" size={20} />
                {open && 'Inscrição Fase 2'}
            </a>

            <a href="/perfil/editar" className={`${open ? 'w-100 ps-2 icon-18-sidebar fs-12 fw-700 py-2' : ''} div-icon-sidebar text-white`}>
                <GoGear color="#fff" size={20} strokeWidth={0.5} />
                {open && 'Configurações'}
            </a>

            <div className={`${open ? 'w-100 icon-18-sidebar py-2' : ''} logout-sidebar align-item-center justify-content-center fs-12 text-auxiliary1-project div-icon-sidebar mt-auto bg-white`} onClick={signOut}>
                <MdLogout className="text-auxiliary1-project" size={20} />
                {open && 'Sair'}
            </div>

            <div className="icon-aba-sidebar bg-auxiliary1-project cursor-pointer" onClick={() => setOpen(!open)}>
                {
                    open
                        ?
                        <FaChevronLeft color="#fff" size={18} />
                        :
                        <FaChevronRight color="#fff" size={18} />
                }
            </div>
        </div>
    );
}