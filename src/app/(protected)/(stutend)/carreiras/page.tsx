"use client";

import { Suspense, useContext, useEffect } from "react";

import Bootcamps from "./components/Bootcamps";
import Categorias from "./components/Categorias";
import Hero from "./components/Hero";
import { LoaderContext } from "@/contexts/LoaderContext";

export default function Carreiras() {

    const { setResponses } = useContext(LoaderContext);

    useEffect(() => {
        setResponses([false, false]);
    }, [setResponses]);

    return (
        <main className="py-5" >
            <section className="container container-ajuste mt-5 pt-4">
                <Hero />
            </section>
            {/* <section className="container container-ajuste mt-5">
                <Bootcamps />
            </section> */}
            <section className="container container-ajuste mt-3 pe-xxl-0">
                <Suspense>
                    <Categorias />
                </Suspense>
            </section>
        </main>
    )
}