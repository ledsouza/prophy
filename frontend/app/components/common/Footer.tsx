export default function Footer() {
    return (
        <footer className="bg-quaternary bg-opacity-10 h-16">
            <div className="h-full px-2">
                <div className="flex items-center justify-center h-full">
                    <p className="text-gray-secondary text-opacity-60 text-xs">
                        &copy; {new Date().getFullYear()} Prophy, Inc. Todos os
                        direitos reservados.
                    </p>
                </div>
            </div>
        </footer>
    );
}
