import Faq from "./login/components/Faq";
import Footer from "./login/components/Footer";
import Header from "./login/components/Header";
import Image from "next/image";
import patriocinadoresH from "/public/gael/footer.svg";
import patriocinadoresV from "/public/gael/footer_mobile.svg";

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
    return (
        <>
            <Header />
            {children}
            <section className="container">
                <Faq />
            </section>
            <div className="d-flex justify-content-center align-items-center w-100 bg-auxiliary1-project py-4 px-3">
                {/* Horizontal em telas médias+ */}
                <Image
                    src={patriocinadoresH.src}
                    width={0}
                    height={0}
                    alt="Patrocinadores"
                    className="h-auto d-none d-md-block"
                    style={{ width: '100%', maxWidth: '1300px' }}
                />
                {/* Vertical em telas pequenas */}
                <Image
                    src={patriocinadoresV.src}
                    width={0}
                    height={0}
                    alt="Patrocinadores"
                    className="h-auto d-md-none"
                    style={{ width: '100%', maxWidth: 300 }}
                />
            </div>
            <Footer />
        </>
    );
}
