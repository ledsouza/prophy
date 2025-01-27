import { Typography } from "@/components/foundation";

export default function Footer() {
    return (
        <footer className="bg-quaternary bg-opacity-10 h-16">
            <div className="h-full px-2">
                <div className="flex items-center justify-around h-full opacity-60">
                    <Typography
                        element="p"
                        size="sm"
                        variant="secondary"
                        className="bold"
                    >
                        MedPhys Hub
                    </Typography>
                    <Typography element="p" size="sm" variant="secondary">
                        Desenvolvido por PhysCollab Stack para Prophy. Todos os
                        direitos reservados.
                    </Typography>
                    <Typography element="p" size="sm" variant="secondary">
                        &copy; {new Date().getFullYear()} PhysCollab Stack.
                    </Typography>
                </div>
            </div>
        </footer>
    );
}
