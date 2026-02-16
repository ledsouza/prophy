import { Typography } from "@/components/foundation";

export default function Footer() {
    return (
        <footer className="bg-quaternary/10">
            <div className="px-4 py-3 sm:px-6">
                <div className="flex flex-col items-center gap-2 text-center opacity-60 sm:flex-row sm:justify-around">
                    <Typography element="p" size="sm" variant="secondary" className="bold">
                        MedPhys Hub
                    </Typography>
                    <Typography element="p" size="sm" variant="secondary">
                        Desenvolvido por PhysCollab Stack para Prophy. Todos os direitos reservados.
                    </Typography>
                    <Typography element="p" size="sm" variant="secondary">
                        &copy; {new Date().getFullYear()} PhysCollab Stack.
                    </Typography>
                </div>
            </div>
        </footer>
    );
}
