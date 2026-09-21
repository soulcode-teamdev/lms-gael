"use client";

import { useContext, useEffect } from "react";
import { LoaderContext } from "@/contexts/LoaderContext";
import FormularioFase2 from "./components/FormularioFase2";

export default function Page() {
    const { setIsLoading } = useContext(LoaderContext);

    useEffect(() => {
        setIsLoading(false);
    }, [setIsLoading]);

    return (
        <main>
            <section className="container container-ajuste mt-5 pt-5 min-vh-85">
                <FormularioFase2 />
            </section>
        </main>
    );
}
